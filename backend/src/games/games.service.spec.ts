import { Test, TestingModule } from "@nestjs/testing";
import { GamesService } from "./games.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Category } from "../categories/entities/category.entity";
import { Game } from "./entities/game.entity";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe('GamesService', () => {
  let service: GamesService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  }

  const mockGameRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((game) => 
      Promise.resolve({ id: 'game-uuid', ...game }),
    ),
    findOne: jest.fn(),
    softDelete: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
  };

  const mockCategoryRepository = {
    findBy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: getRepositoryToken(Game),
          useValue: mockGameRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated games without filters', async () => {
      const mockGames = [{ title: 'Terraria' }, { title: 'Factorio' }];
      const totalCount = 2;

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockGames, totalCount]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockGames);
      expect(result.meta.totalItems).toBe(totalCount);
      expect(mockGameRepository.createQueryBuilder).toHaveBeenCalledWith('game');
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });

    it('should apply search filter when search string is provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10 }, 'witcher');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(game.title) LIKE LOWER(:search)'),
        { search: '%witcher%'}
      );
    });

    it('should apply category filter when categoryId is provided', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 1, limit: 10 }, undefined, 5);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.id = :categoryId',
        { categoryId: 5 }
      );
    });
  });

  describe('create', () => {
    const createGameDto = {
      title: 'Terraria',
      description: 'Re-Logic',
      price: 300.00,
      categoryIds: [1, 2],
    };
    const companyId = 'company-uuid';

    it('should successfully create a game with categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Action' },
        { id: 2, name: 'RPG' },
      ];
      mockCategoryRepository.findBy.mockResolvedValue(mockCategories);

      const result = await service.create(createGameDto, companyId);

      expect(result).toHaveProperty('id', 'game-uuid');
      expect(result.title).toBe(createGameDto.title);
      expect(result.categories).toHaveLength(2);
      expect(result.companyId).toBe(companyId);

      expect(mockGameRepository.save).toHaveBeenCalled();
    })

    it('should throw BadRequestExeption if some categories are not found', async () => {
      mockCategoryRepository.findBy.mockResolvedValue([{ id: 1, name: 'Action' }]);

      await expect(
        service.create(createGameDto, companyId),
      ).rejects.toThrow(BadRequestException);

      expect(mockGameRepository.save).not.toHaveBeenCalled();
    })
  })

  describe('update', () => {
    const gameId = 'game-uuid';
    const companyId = 'my-company-uuid';
    const updateDto = { title: 'Updated Title', categoryIds: [1] };

    it('should successfully update a game and its categories', async () => {
      const existingGame = { id: gameId, companyId, categories: [] };
      mockGameRepository.findOne.mockResolvedValue(existingGame);

      const newCategories = [{ id: 1, name: 'RPG' }];
      mockCategoryRepository.findBy.mockResolvedValue(newCategories);

      mockGameRepository.save.mockImplementation((game) => Promise.resolve(game));

      const result = await service.update(gameId, updateDto, companyId);

      expect(result.title).toBe('Updated Title');
      expect(result.categories).toHaveLength(1);
      expect(mockGameRepository.save).toHaveBeenCalled();
    })

    it('should throw NotFoundException if game does not belong to the company', async () => {
      mockGameRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(gameId, updateDto, companyId)
      ).rejects.toThrow(NotFoundException);

      expect(mockGameRepository.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if some new categories are not found', async () => {
      mockGameRepository.findOne.mockResolvedValue({ id: gameId, companyId });

      mockCategoryRepository.findBy.mockResolvedValue([]);

      await expect(
        service.update(gameId, updateDto, companyId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    const gameId = 'game-uuid';
    const companyId = 'my-company-uuid';

    it('should successfully soft delete the game if owner is correct', async () => {
      const existingGame = { id: gameId, companyId };
      mockGameRepository.findOne.mockResolvedValue(existingGame);
      mockGameRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove(gameId, companyId);

      expect(mockGameRepository.softDelete).toHaveBeenCalledWith(gameId);
    });

    it('should throw NotFoundException when trying to delete someone else game', async () => {
      mockGameRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove(gameId, 'wrong-company-id')
      ).rejects.toThrow(NotFoundException);

      expect(mockGameRepository.softDelete).not.toHaveBeenCalled();
    });
  });
});