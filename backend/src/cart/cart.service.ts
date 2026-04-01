import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateCartDto } from './dto/update-cart.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Repository } from 'typeorm';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>
  ) {}

  async addToCart(userId: string, dto: AddToCartDto): Promise<Cart> {
    const { gameId } = dto;

    const existingItem = await this.cartRepository.findOne({ where: { userId, gameId }});

    if (existingItem) {
      throw new BadRequestException('This game is already in your cart');
    }

    const cartItem = this.cartRepository.create({ userId, gameId });
    return await this.cartRepository.save(cartItem);
  }

  async getMyCart(userId: string): Promise<Cart[]> {
    return await this.cartRepository.find({
      where: { userId },
      relations: ['game', 'game.categories', 'game.developer']
    })
  }

  async removeFromCart(userId: string, gameId: string): Promise<void> {
    const result = await this.cartRepository.delete({ userId, gameId });

    if (result.affected === 0) {
      throw new NotFoundException('Item not found in your cart');
    }
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartRepository.delete({ userId });
  }
}
