import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { UpdateCartDto } from './dto/update-cart.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AddToCartDto } from './dto/add-to-cart.dto';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async addToCart(@Body() addToCartDto: AddToCartDto, @Request() req) {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  @Get()
  async getMyCart(@Request() req) {
    return this.cartService.getMyCart(req.user.userId);
  }

  @Delete(':gameId')
  async removeFromCart(@Param('gameId') gameId: string, @Request() req) {
    await this.cartService.removeFromCart(req.user.userId, gameId);
    return { message: 'Removed from cart' };
  }
}
