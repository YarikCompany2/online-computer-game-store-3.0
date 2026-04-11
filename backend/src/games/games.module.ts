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
import { Library } from '../library/entities/library.entity';
import { LibraryModule } from '../library/library.module';
import { Notification } from '../notification/entities/notification.entity';
import { Company } from '../companies/entities/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, Category, Cart, Media, Requirement, Review, Discount, Company, Library, Notification]),
    CategoriesModule,
    CompaniesModule,
    LibraryModule,
  ],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [TypeOrmModule, GamesService]
})
export class GamesModule {}
