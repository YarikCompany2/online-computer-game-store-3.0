import { Module } from '@nestjs/common';
import { RequirementsService } from './requirements.service';
import { RequirementsController } from './requirements.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Requirement } from './entities/requirement.entity';
import { Game } from '../games/entities/game.entity';
import { Platform } from '../platform/entities/platform.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Requirement, Game, Platform])],
  controllers: [RequirementsController],
  providers: [RequirementsService],
})
export class RequirementsModule {}
