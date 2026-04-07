import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { UsersModule } from '../users/users.module';
import { Game } from '../games/entities/game.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { CompanyDashboardController } from './company-dashboard.controller';
import { CompanyDashboardService } from './company-dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Game, OrderItem]),
    UsersModule,
  ],
  controllers: [CompaniesController, CompanyDashboardController],
  providers: [CompaniesService, CompanyDashboardService],
})
export class CompaniesModule {}
