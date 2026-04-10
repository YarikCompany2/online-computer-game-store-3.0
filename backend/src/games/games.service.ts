import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Game, GameStatus } from './entities/game.entity';
import { ILike, In, Not, Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResource } from '../common/interfaces/paginated-resource.interface';
import { GameWithOwnership } from '../common/interfaces/game-response.interface';
import { Library } from '../library/entities/library.entity';
import { User } from '../users/entities/user.entity';
import { LibraryService } from '../library/library.service';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Library)
    private readonly libraryRepository: Repository<Library>,
    private readonly libraryService: LibraryService,
  ) {}

  async findOne(id: string, userId?: string): Promise<GameWithOwnership> {
    const game = await this.gameRepository.findOne({
      where: { id },
      relations: [
        'categories', 
        'developer', 
        'publisher', 
        'media', 
        'requirements',
        'requirements.platforms',
        'discount'
      ], 
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }

    const now = new Date();

    const isDiscountValid = 
      game.discount && 
      game.discount.isActive && 
      now >= new Date(game.discount.startDate) && 
      now <= new Date(game.discount.endDate);

    if (game.discount && !isDiscountValid) {
      game.discount = null;
    }

    let isOwned = false;
    if (userId) {
      const user = await this.libraryRepository.manager.findOne(User, { where: { id: userId } });
      const ownership = await this.libraryRepository.findOne({
        where: { userId, gameId: id }
      });
      isOwned = !!ownership || (user?.companyId === game.developerId);
    }

    return { ...game, isOwned };
  }

  async findAll(
    paginationDto: PaginationDto,
    search?: string,
    categoryId?: number,
    minPrice?: number,
    maxPrice?: number,
    sortBy: string = 'newest',
    freeOnly: boolean = false 
  ): Promise<PaginatedResource<Game>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.gameRepository.createQueryBuilder('game')
        .leftJoinAndSelect('game.categories', 'category')
        .leftJoinAndSelect('game.developer', 'developer')
        .leftJoinAndSelect('game.media', 'media')
        .leftJoinAndSelect('game.discount', 'discount')
        .where('game.status = :status', { status: GameStatus.ACTIVE });

      if (search) {
        queryBuilder.andWhere('LOWER(game.title) LIKE LOWER(:search)', { search: `%${search}%` });
      }

      if (categoryId) {
        queryBuilder.andWhere('category.id = :categoryId', { categoryId });
      }

      if (freeOnly) {
        queryBuilder.andWhere('game.price = 0');
      } else {
        if (minPrice !== undefined) queryBuilder.andWhere('game.price >= :minPrice', { minPrice });
        if (maxPrice !== undefined) queryBuilder.andWhere('game.price <= :maxPrice', { maxPrice });
      }

      switch (sortBy) {
        case 'oldest':
          queryBuilder.orderBy('game.createdAt', 'ASC');
          break;
        case 'price_low':
          queryBuilder.orderBy('game.price', 'ASC');
          break;
        case 'price_high':
          queryBuilder.orderBy('game.price', 'DESC');
          break;
        case 'title':
          queryBuilder.orderBy('game.title', 'ASC');
          break;
        case 'newest':
        default:
          queryBuilder.orderBy('game.createdAt', 'DESC');
          break;
      }

      const [data, total] = await queryBuilder
        .take(limit)
        .skip(skip)
        .getManyAndCount();

      const now = new Date();
      data.forEach(game => {
        if (game.discount) {
          const isDiscountValid = 
            game.discount.isActive && 
            now >= new Date(game.discount.startDate) && 
            now <= new Date(game.discount.endDate);

          if (!isDiscountValid) {
            game.discount = null;
          }
        }
      });

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
    const existingGame = await this.gameRepository
        .createQueryBuilder('game')
        .where('LOWER(game.title) = LOWER(:title)', { title: createGameDto.title })
        .getOne();

    if (existingGame) {
      throw new BadRequestException(`The title "${createGameDto.title}" is already taken by another game.`);
    }

    const { categoryIds, developerId, publisherId, ...gameData } = createGameDto;

    const categories = await this.categoryRepository.findBy({
      id: In(categoryIds),
    });

    if (categories.length !== categoryIds.length) {
      throw new BadRequestException('One or more categories not found');
    }

    const game = this.gameRepository.create({
      ...gameData,
      developerId: developerId || companyId,
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

    if (updateGameDto.title && updateGameDto.title !== game.title) {
      const duplicate = await this.gameRepository.findOne({
        where: { 
          title: ILike(updateGameDto.title),
          id: Not(id) 
        }
      });

      if (duplicate) {
        throw new BadRequestException(`The title "${updateGameDto.title}" is already taken by another game.`);
      }
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

  async getBuildPath(gameId: string) {
    const game = await this.gameRepository.findOne({ 
      where: { id: gameId },
      select: ['id', 'buildUrl', 'title']
    });
    
    if (!game || !game.buildUrl) {
      throw new NotFoundException('Game build not found');
    }
    return game;
  }

  async getLaunchToken(userId: string, gameId: string) {
    const hasAccess = await this.libraryService.checkAccess(userId, gameId);
    if (!hasAccess) throw new ForbiddenException();

    const token = Math.random().toString(36).substring(2, 15);
    
    return {
      token: token,
      url: `sadstore://launch/${gameId}/${token}`
    };
  }

  async updateBuildUrl(gameId: string, path: string) {
    const game = await this.gameRepository.findOne({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Game not found');

    await this.gameRepository.update(gameId, { buildUrl: path });
    
    console.log(`[Database] Build path updated for "${game.title}": ${path}`);
    return { success: true, path };
  }

  private calculatePrice(game: Game) {
    const now = new Date();
    if (game.discount && game.discount.isActive && 
        now >= game.discount.startDate && now <= game.discount.endDate) {
      const discountAmount = (game.price * game.discount.discountPercent) / 100;
      return {
        hasDiscount: true,
        originalPrice: Number(game.price),
        discountPercent: game.discount.discountPercent,
        currentPrice: Number((game.price - discountAmount).toFixed(2))
      };
    }
    return {
      hasDiscount: false,
      originalPrice: Number(game.price),
      currentPrice: Number(game.price)
    };
  }

  async remove(id: string, companyId: string) {
    const game = await this.gameRepository.findOne({ where: { id, developerId: companyId } });

    if (!game) {
      throw new NotFoundException('Game not found or you do not have permission');
    }

    return await this.gameRepository.softDelete(id);
  }
}
