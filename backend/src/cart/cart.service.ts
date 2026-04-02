import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateCartDto } from './dto/update-cart.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Repository } from 'typeorm';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { Library } from '../library/entities/library.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(Library)
    private readonly libraryRepository: Repository<Library>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async addToCart(userId: string, dto: AddToCartDto): Promise<Cart> {
    const { gameId } = dto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found. Please log in again');
    }

    const alreadyOwned = await this.libraryRepository.findOne({ where: { userId, gameId } });
    if (alreadyOwned) {
      throw new BadRequestException('You already own this game in your library');
    }

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
      relations: ['game', 'game.categories', 'game.developer', 'game.media']
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
