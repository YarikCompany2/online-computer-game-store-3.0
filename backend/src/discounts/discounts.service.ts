import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
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

  async createPersonal(dto: CreateDiscountDto & { gameId: string }, companyId: string) {
    const game = await this.gameRepo.findOne({ 
      where: { id: dto.gameId, publisherId: companyId },
      relations: ['discount'] 
    });
    if (!game) throw new ForbiddenException('You can only discount your own games');

    const now = new Date();
    const expirationDate = new Date(dto.endDate);
    
    if (expirationDate <= now) {
      throw new BadRequestException('The discount expiration date must be a future date.');
    }
    
    if (game.promotionId) {
      throw new BadRequestException('Cannot start a new sale while another campaign is active.');
    }

    if (dto.discountPercent <= 0) {
      throw new BadRequestException('Discount percentage must be a positive number');
    }

    const discount = this.discountRepo.create({
      name: dto.name,
      discountPercent: dto.discountPercent,
      startDate: new Date(),
      endDate: dto.endDate,
      isGlobal: false,
      isActive: true
    });
    
    const savedDiscount = await this.discountRepo.save(discount);
    game.promotionId = savedDiscount.id;
    await this.gameRepo.save(game);
    
    return savedDiscount;
  }

  async applyToGame(gameId: string, discountId: string | null) {
    const game = await this.gameRepo.findOne({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Game not found');

    if (discountId === null) {
      game.promotionId = null;
      return await this.gameRepo.save(game);
    }

    const discount = await this.discountRepo.findOne({ where: { id: discountId } });
    if (!discount) throw new NotFoundException('Discount not found');

    const now = new Date();
    if (discount.isGlobal && (new Date(discount.startDate) > now || new Date(discount.endDate) < now)) {
      throw new BadRequestException('This global event is not active at the moment');
    }

    game.promotionId = discount.id;
    return await this.gameRepo.save(game);
  }

  async findAllGlobal() {
    const now = new Date();

    return await this.discountRepo.find({ 
      where: { 
        isGlobal: true, 
        isActive: true,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now) 
      },
      order: { discountPercent: 'DESC' }
    });
  }
}