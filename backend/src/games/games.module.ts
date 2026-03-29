import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { CategoriesModule } from '../categories/categories.module';
import { CompaniesModule } from '../companies/companies.module';
import { Category } from '../categories/entities/category.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Media } from '../media/entities/media.entity';
import { Requirement } from '../requirements/entities/requirement.entity';
import { Review } from '../reviews/entities/review.entity';
import { Discount } from '../discounts/entities/discount.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, Category, Cart, Media, Requirement, Review, Discount]),
    CategoriesModule,
    CompaniesModule,
  ],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [TypeOrmModule, GamesService]
})
export class GamesModule {}
