import { BadRequestException, Injectable } from "@nestjs/common";
import { CartService } from "../cart/cart.service";
import { UsersService } from "../users/users.service";
import { DataSource } from "typeorm";
import { Order, OrderStatus } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Library } from "../library/entities/library.entity";
import { Cart } from "../cart/entities/cart.entity";
import { Discount } from "../discounts/entities/discount.entity";

interface CartItemWithCalculatedPrice extends Cart {
  finalPrice: number;
}

@Injectable()
export class OrdersService {
  constructor(
    private dataSource: DataSource,
    private cartService: CartService,
    private usersService: UsersService,
  ) {}

  async checkout(userId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const cartItems = await this.cartService.getMyCart(userId);
      if (cartItems.length === 0) {
        throw new BadRequestException('Your cart is empty');
      }

      const now = new Date();
      const itemsWithCalculatedPrices: CartItemWithCalculatedPrice[] = cartItems.map(item => {
        let finalPrice = Number(item.game.price);
        const discount = item.game.discount;

        if (discount && discount.isActive) {
          const start = new Date(discount.startDate);
          const end = new Date(discount.endDate);
          
          if (now >= start && now <= end) {
            const reduction = (finalPrice * discount.discountPercent) / 100;
            finalPrice = finalPrice - reduction;
          }
        }

        return {
          ...item,
          finalPrice: Number(finalPrice.toFixed(2))
        } as CartItemWithCalculatedPrice;
      });

      const totalAmount = itemsWithCalculatedPrices.reduce((sum, item) => sum + item.finalPrice, 0);

      const user = await this.usersService.findOne(userId);
      if (user.balance < totalAmount) {
        throw new BadRequestException('Insufficient balance');
      }

      const order = queryRunner.manager.create(Order, {
        userId,
        totalAmount: Number(totalAmount.toFixed(2)),
        status: OrderStatus.PAID,
      });
      const savedOrder = await queryRunner.manager.save(order);

      for (const item of itemsWithCalculatedPrices) {
        const orderItem = queryRunner.manager.create(OrderItem, {
          orderId: savedOrder.id,
          gameId: item.gameId,
          priceAtPurchase: item.finalPrice,
        });
        await queryRunner.manager.save(orderItem);

        const libraryEntry = queryRunner.manager.create(Library, {
          userId,
          gameId: item.gameId,
          orderId: savedOrder.id
        });
        await queryRunner.manager.save(libraryEntry);
      }

      const newBalance = Number(user.balance) - totalAmount;
      await this.usersService.update(userId, { balance: newBalance });
      await this.cartService.clearCart(userId);

      await queryRunner.commitTransaction();

      return {
        message: 'Purchase successful',
        orderId: savedOrder.id,
        totalSpent: totalAmount,
        remainingBalance: newBalance,
      };

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAllByUser(userId: string) {
    return await this.dataSource.getRepository(Order).find({
      where: { userId },
      relations: ['items', 'items.game'],
      order: { createdAt: 'DESC' }
    });
  }
}