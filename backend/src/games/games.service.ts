import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Game } from './entities/game.entity';
import { In, Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>
  ) {}

  async create(createGameDto: CreateGameDto, companyId: string): Promise<Game> {
    const { categoryIds, ...gameData } = createGameDto;

    const categories = await this.categoryRepository.findBy({
      id: In(categoryIds),
    });

    if (categories.length !== categoryIds.length) {
      throw new BadRequestException('One or more categories not found');
    }

    const game = this.gameRepository.create({
      ...gameData,
      companyId,
      categories,
    });

    return await this.gameRepository.save(game);
  }

  async update(id: string, updateGameDto: UpdateGameDto, companyId: string): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id, companyId },
      relations: ['categories']
    });

    if (!game) {
      throw new NotFoundException('Game not found or you do not have permission');
    }

    const { categoryIds, ...updateData } = updateGameDto;

    if (categoryIds) {
      const categories = await this.categoryRepository.findBy({
        id: In(categoryIds),
      });
      if (categories.length !== categoryIds.length) {
        throw new BadRequestException('Some categories were not found');
      }
      game.categories = categories;
    }

    Object.assign(game, updateData);

    return await this.gameRepository.save(game);
  }

  async remove(id: string, companyId: string) {
    const game = await this.gameRepository.findOne({ where: { id, companyId } });

    if (!game) {
      throw new NotFoundException('Game not found or you do not have permission');
    }

    return await this.gameRepository.softDelete(id);
  }
}
