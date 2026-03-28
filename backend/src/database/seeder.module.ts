import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "../categories/entities/category.entity";
import { Company } from "../companies/entities/company.entity";
import { Game } from "../games/entities/game.entity";
import { User } from "../users/entities/user.entity";
import { SeederService } from "./seeder.service";

@Module({
    imports: [TypeOrmModule.forFeature([Category, Game, User, Company])],
    providers: [SeederService],
    exports: [SeederService],
})
export class SeederModule {}