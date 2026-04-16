import { Test, TestingModule } from '@nestjs/testing';
import { GamesService } from './games.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Game, GameStatus } from './entities/game.entity';
import { Category } from '../categories/entities/category.entity';
import { Library } from '../library/entities/library.entity';
import { Company } from '../companies/entities/company.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Notification as NotificationEntity, NotificationType, NotificationStatus } from '../notification/entities/notification.entity';
import { LibraryService } from '../library/library.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('GamesService', () => {
  let service: GamesService;
  let gameRepo;
  let categoryRepo;
  let notificationRepo;
  let userRepo;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: getRepositoryToken(Game),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            manager: {
              getRepository: jest.fn().mockReturnValue({
                create: jest.fn().mockImplementation(dto => dto),
                save: jest.fn(),
                findBy: jest.fn().mockResolvedValue([]),
              }),
              delete: jest.fn(),
              findOne: jest.fn(),
            },
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: { findBy: jest.fn() },
        },
        {
          provide: getRepositoryToken(Library),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Company),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(NotificationEntity),
          useValue: { 
            create: jest.fn().mockImplementation(dto => dto), 
            save: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { 
            find: jest.fn().mockResolvedValue([]), 
          },
        },
        {
          provide: LibraryService,
          useValue: { checkAccess: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
    gameRepo = module.get(getRepositoryToken(Game));
    categoryRepo = module.get(getRepositoryToken(Category));
    notificationRepo = module.get(getRepositoryToken(NotificationEntity));
    userRepo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      title: 'New Game',
      description: 'Cool game desc',
      price: 10,
      categoryIds: [1],
    };

    it('should throw BadRequest if title already exists', async () => {
      gameRepo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(service.create(dto as any, 'comp-1', {})).rejects.toThrow(BadRequestException);
    });

    it('should create game and notify moderators if self-published', async () => {
      gameRepo.findOne.mockResolvedValue(null);
      categoryRepo.findBy.mockResolvedValue([{ id: 1 }]);
      gameRepo.save.mockResolvedValue({ id: 'g1', title: 'New Game', developerId: 'comp-1' });

      await service.create(dto as any, 'comp-1', { userId: 'u1' });

      expect(gameRepo.save).toHaveBeenCalled();
      expect(gameRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        status: GameStatus.PENDING_MODERATION
      }));
    });
  });

  describe('findAll', () => {
    it('should apply price filters correctly', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      
      await service.findAll({ page: 1 }, undefined, undefined, 10, 50);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'game.price >= :minPrice',
        { minPrice: 10 }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'game.price <= :maxPrice',
        { maxPrice: 50 }
      );
    });

    it('should handle freeOnly filter', async () => {
        mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
        await service.findAll({ page: 1 }, undefined, undefined, undefined, undefined, 'newest', true);
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('game.price = 0');
    });
  });

  describe('update', () => {
    it('should prevent changing status while in moderation', async () => {
      gameRepo.findOne.mockResolvedValue({ 
        id: 'g1', 
        publisherId: 'p1', 
        status: GameStatus.PENDING_MODERATION 
      });

      await expect(service.update('g1', { status: GameStatus.ACTIVE } as any, 'p1'))
        .rejects.toThrow('awaiting moderation');
    });

    it('should throw Forbidden if non-publisher tries to update', async () => {
      gameRepo.findOne.mockResolvedValue({ id: 'g1', publisherId: 'real-pub' });
      await expect(service.update('g1', {}, 'hacker')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyGame', () => {
    it('should set status to COMING_SOON if release date is in future', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      gameRepo.findOne.mockResolvedValue({ id: 'g1', createdAt: futureDate });
      
      await service.verifyGame('g1');

      expect(gameRepo.update).toHaveBeenCalledWith('g1', { status: GameStatus.COMING_SOON });
    });

    it('should set status to ACTIVE if release date has passed', async () => {
        const pastDate = new Date('2020-01-01');
        gameRepo.findOne.mockResolvedValue({ id: 'g1', createdAt: pastDate });
        
        await service.verifyGame('g1');
  
        expect(gameRepo.update).toHaveBeenCalledWith('g1', { status: GameStatus.ACTIVE });
      });
  });

  describe('remove', () => {
    it('should block deletion while in moderation queue', async () => {
      gameRepo.findOne.mockResolvedValue({ id: 'g1', publisherId: 'p1', status: GameStatus.PENDING_MODERATION });
      await expect(service.remove('g1', 'p1')).rejects.toThrow('Cannot delete a project while it is in the moderation queue');
    });

    it('should successfully soft delete if everything is correct', async () => {
      gameRepo.findOne.mockResolvedValue({ id: 'g1', publisherId: 'p1', status: GameStatus.ACTIVE });
      await service.remove('g1', 'p1');
      expect(gameRepo.softDelete).toHaveBeenCalledWith('g1');
    });
  });
});