import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Game, GameStatus } from './entities/game.entity';
import { In, Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResource } from '../common/interfaces/paginated-resource.interface';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>
  ) {}

  async findAll(
    paginationDto: PaginationDto,
    search?: string,
    categoryId?: number
  ): Promise<PaginatedResource<Game>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.gameRepository.createQueryBuilder('game')
      .leftJoinAndSelect('game.categories', 'category')
      .leftJoinAndSelect('game.developer', 'developer')
      .leftJoinAndSelect('game.publisher', 'publisher')
      .leftJoinAndSelect('game.media', 'media')
      .where('game.status = :status', { status: GameStatus.ACTIVE });

    if (search) {
      queryBuilder.andWhere('LOWER(game.title) LIKE LOWER(:search)', {
        search: `%${search}%`
      });
    }

    if (categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', { categoryId } );
    }

    const [data, total] = await queryBuilder
      .orderBy('game.createdAt', 'DESC')
      .take(limit)
      .skip(skip)
      .getManyAndCount();

    return {
      data,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async create(createGameDto: CreateGameDto, companyId: string): Promise<Game> {
    const { categoryIds, publisherId, ...gameData } = createGameDto;

    const categories = await this.categoryRepository.findBy({
      id: In(categoryIds),
    });

    if (categories.length !== categoryIds.length) {
      throw new BadRequestException('One or more categories not found');
    }

    const game = this.gameRepository.create({
      ...gameData,
      developerId: companyId,
      publisherId: publisherId || companyId,
      categories,
    });

    return await this.gameRepository.save(game);
  }

  async update(id: string, updateGameDto: UpdateGameDto, companyId: string): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id, developerId: companyId },
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
    const game = await this.gameRepository.findOne({ where: { id, developerId: companyId } });

    if (!game) {
      throw new NotFoundException('Game not found or you do not have permission');
    }

    return await this.gameRepository.softDelete(id);
  }
}
