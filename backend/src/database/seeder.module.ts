import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "../categories/entities/category.entity";
import { Company } from "../companies/entities/company.entity";
import { Game } from "../games/entities/game.entity";
import { User } from "../users/entities/user.entity";
import { SeederService } from "./seeder.service";
import { Media } from "../media/entities/media.entity";
import { Requirement } from "../requirements/entities/requirement.entity";
import { Platform } from "../platform/entities/platform.entity";
import { Discount } from "../discounts/entities/discount.entity";
import { Order } from "../orders/entities/order.entity";
import { OrderItem } from "../orders/entities/order-item.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Category, Game, User, Company, Media, Requirement, Platform, Discount, Order, OrderItem])],
    providers: [SeederService],
    exports: [SeederService],
})
export class SeederModule {}