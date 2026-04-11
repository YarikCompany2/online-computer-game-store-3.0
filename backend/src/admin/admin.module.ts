import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Game } from '../games/entities/game.entity';
import { Order } from '../orders/entities/order.entity';
import { Company } from '../companies/entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Game, Order, Company])
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
