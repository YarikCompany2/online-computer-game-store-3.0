import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Game } from '../games/entities/game.entity';
import { Cart } from './entities/cart.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, User, Game])],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
