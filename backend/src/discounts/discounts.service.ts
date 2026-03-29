import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discount } from './entities/discount.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { Game } from '../games/entities/game.entity';

@Injectable()
export class DiscountsService {
  constructor(
    @InjectRepository(Discount)
    private readonly discountRepo: Repository<Discount>,
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
  ) {}

  async create(dto: CreateDiscountDto) {
    const discount = this.discountRepo.create(dto);
    return await this.discountRepo.save(discount);
  }

  async applyToGame(gameId: string, discountId: string) {
    const game = await this.gameRepo.findOne({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Game not found');

    const discount = await this.discountRepo.findOne({ where: { id: discountId } });
    if (!discount) throw new NotFoundException('Discount not found');

    game.promotionId = discount.id;
    return await this.gameRepo.save(game);
  }

  async findAll() {
    return await this.discountRepo.find({ relations: ['games'] });
  }
}