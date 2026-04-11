import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Library } from '../library/entities/library.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Review } from '../reviews/entities/review.entity';
import { Transaction } from './entities/transaction.entity';
import { Company } from '../companies/entities/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order, Library, Cart, Review, Transaction, Company])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
