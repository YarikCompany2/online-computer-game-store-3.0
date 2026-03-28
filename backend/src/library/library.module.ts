import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Library } from './entities/library.entity';
import { User } from '../users/entities/user.entity';
import { Game } from '../games/entities/game.entity';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Library, User, Game, Order])],
  controllers: [LibraryController],
  providers: [LibraryService],
})
export class LibraryModule {}
