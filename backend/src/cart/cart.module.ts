import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Game } from '../games/entities/game.entity';
import { Cart } from './entities/cart.entity';
import { LibraryService } from '../library/library.service';
import { LibraryModule } from '../library/library.module';
import { Library } from '../library/entities/library.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, User, Game, Library]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
