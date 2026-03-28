import { BadRequestException, Injectable } from "@nestjs/common";
import { CartService } from "../cart/cart.service";
import { UsersService } from "../users/users.service";
import { DataSource } from "typeorm";
import { Order, OrderStatus } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Library } from "../library/entities/library.entity";

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

      const totalAmount = cartItems.reduce(
        (sum, item) => sum + Number(item.game.price),
        0
      );

      const user = await this.usersService.findOne(userId);
      if (user.balance < totalAmount) {
        throw new BadRequestException('Insufficient balance on your account');
      }

      const order = queryRunner.manager.create(Order, {
        userId,
        totalAmount,
        status: OrderStatus.PAID,
      });

      const savedOrder = await queryRunner.manager.save(order);

      for (const item of cartItems) {
        const orderItem = queryRunner.manager.create(OrderItem, {
          orderId: savedOrder.id,
          gameId: item.gameId,
          priceAtPurchase: item.game.price,
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