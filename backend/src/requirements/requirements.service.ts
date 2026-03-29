import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Requirement } from './entities/requirement.entity';
import { Repository } from 'typeorm';
import { Game } from '../games/entities/game.entity';

@Injectable()
export class RequirementsService {
  constructor(
    @InjectRepository(Requirement) private reqRepo: Repository<Requirement>,
    @InjectRepository(Game) private gameRepo: Repository<Game>,
  ) {}

  async create(dto: CreateRequirementDto, companyId: string) {
    const game = await this.gameRepo.findOne({ where: { id: dto.gameId }});
    if (!game) throw new NotFoundException('Game not found');
    if (game.companyId !== companyId) throw new ForbiddenException('Access denied');

    const req = this.reqRepo.create(dto);
    return await this.reqRepo.save(req);
  }

  async remove(id: string, companyId: string) {
    const req = await this.reqRepo.findOne({
      where: { id },
      relations: ['game']
    });

    if (!req) throw new NotFoundException('Requirement not found');
    if (req.game.companyId !== companyId) throw new ForbiddenException('Access denied');

    return await this.reqRepo.remove(req);
  }
}
