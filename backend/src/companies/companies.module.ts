import { forwardRef, Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { UsersModule } from '../users/users.module';
import { Game } from '../games/entities/game.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { CompanyDashboardController } from './company-dashboard.controller';
import { CompanyDashboardService } from './company-dashboard.service';
import { User } from '../users/entities/user.entity';
import { Notification } from '../notification/entities/notification.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Game, OrderItem, User, Notification]),
    UsersModule,
    forwardRef(() => NotificationModule),
  ],
  controllers: [CompaniesController, CompanyDashboardController],
  providers: [CompaniesService, CompanyDashboardService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
