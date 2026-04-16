import { Test, TestingModule } from '@nestjs/testing';
import { DiscountsService } from './discounts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Discount } from './entities/discount.entity';
import { Game } from '../games/entities/game.entity';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('DiscountsService', () => {
  let service: DiscountsService;
  let discountRepo;
  let gameRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        {
          provide: getRepositoryToken(Discount),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Game),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DiscountsService>(DiscountsService);
    discountRepo = module.get(getRepositoryToken(Discount));
    gameRepo = module.get(getRepositoryToken(Game));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPersonal', () => {
    const companyId = 'comp-1';
    const gameId = 'game-1';
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const dto = {
      name: 'Dev Sale',
      discountPercent: 20,
      endDate: futureDate,
      gameId: gameId,
      startDate: new Date(),
    };

    it('should successfully create a personal discount', async () => {
      const mockGame = { id: gameId, publisherId: companyId, promotionId: null };
      gameRepo.findOne.mockResolvedValue(mockGame);
      discountRepo.save.mockResolvedValue({ id: 'disc-123', ...dto });

      const result = await service.createPersonal(dto as any, companyId);

      expect(result.id).toBe('disc-123');
      expect(gameRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        promotionId: 'disc-123'
      }));
    });

    it('should throw ForbiddenException if user does not own the game', async () => {
      gameRepo.findOne.mockResolvedValue(null);

      await expect(service.createPersonal(dto as any, 'hacker-comp')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw BadRequestException if endDate is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const invalidDto = { ...dto, endDate: pastDate };
      
      gameRepo.findOne.mockResolvedValue({ id: gameId, publisherId: companyId });

      await expect(service.createPersonal(invalidDto as any, companyId)).rejects.toThrow(
        'expiration date must be a future date'
      );
    });

    it('should throw BadRequestException if game already has a discount', async () => {
      gameRepo.findOne.mockResolvedValue({ 
        id: gameId, 
        publisherId: companyId, 
        promotionId: 'existing-disc' 
      });

      await expect(service.createPersonal(dto as any, companyId)).rejects.toThrow(
        'another campaign is active'
      );
    });
  });

  describe('applyToGame', () => {
    it('should remove discount if discountId is null', async () => {
      gameRepo.findOne.mockResolvedValue({ id: 'g1', promotionId: 'old' });
      gameRepo.save.mockImplementation(g => Promise.resolve(g));

      const result = await service.applyToGame('g1', null);

      expect(result.promotionId).toBeNull();
    });

    it('should throw BadRequestException if global discount is not yet active', async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);

      discountRepo.findOne.mockResolvedValue({
        id: 'd1',
        isGlobal: true,
        startDate: futureStart,
        endDate: new Date()
      });
      gameRepo.findOne.mockResolvedValue({ id: 'g1' });

      await expect(service.applyToGame('g1', 'd1')).rejects.toThrow(
        'event is not active at the moment'
      );
    });
  });

  describe('findAllGlobal', () => {
    it('should call find with correct filters for active global sales', async () => {
      await service.findAllGlobal();

      expect(discountRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          isGlobal: true,
          isActive: true,
          startDate: expect.anything(),
          endDate: expect.anything()
        }
      }));
    });
  });
});