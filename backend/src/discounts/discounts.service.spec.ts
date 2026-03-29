import { Test, TestingModule } from '@nestjs/testing';
import { DiscountsService } from './discounts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Discount } from './entities/discount.entity';
import { Game } from '../games/entities/game.entity';
import { NotFoundException } from '@nestjs/common';

describe('DiscountsService', () => {
  let service: DiscountsService;

  const mockDiscountRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((d) => Promise.resolve({ id: 'discount-uuid', ...d })),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockGameRepo = {
    findOne: jest.fn(),
    save: jest.fn().mockImplementation((g) => Promise.resolve(g)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        {
          provide: getRepositoryToken(Discount),
          useValue: mockDiscountRepo,
        },
        {
          provide: getRepositoryToken(Game),
          useValue: mockGameRepo,
        },
      ],
    }).compile();

    service = module.get<DiscountsService>(DiscountsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create a new discount', async () => {
      const dto = {
        name: 'Summer Sale',
        discountPercent: 50,
        startDate: new Date(),
        endDate: new Date(),
      };

      const result = await service.create(dto as any);

      expect(result).toHaveProperty('id', 'discount-uuid');
      expect(result.name).toBe('Summer Sale');
      expect(mockDiscountRepo.save).toHaveBeenCalled();
    });
  });

  describe('applyToGame', () => {
    const gameId = 'game-uuid';
    const discountId = 'discount-uuid';

    it('should successfully apply a discount to a game', async () => {
      mockGameRepo.findOne.mockResolvedValue({ id: gameId, title: 'Witcher 3' });
      mockDiscountRepo.findOne.mockResolvedValue({ id: discountId, discountPercent: 30 });

      const result = await service.applyToGame(gameId, discountId);

      expect(result.promotionId).toBe(discountId);
      expect(mockGameRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if game is not found', async () => {
      mockGameRepo.findOne.mockResolvedValue(null);

      await expect(
        service.applyToGame('wrong-game', discountId)
      ).rejects.toThrow(NotFoundException);
      
      expect(mockGameRepo.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if discount is not found', async () => {
      mockGameRepo.findOne.mockResolvedValue({ id: gameId });
      mockDiscountRepo.findOne.mockResolvedValue(null);

      await expect(
        service.applyToGame(gameId, 'wrong-discount')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all discounts with their games', async () => {
      const mockDiscounts = [
        { id: '1', name: 'Sale 1', games: [] },
        { id: '2', name: 'Sale 2', games: [] }
      ];
      mockDiscountRepo.find.mockResolvedValue(mockDiscounts);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockDiscountRepo.find).toHaveBeenCalledWith({
        relations: ['games']
      });
    });
  });
});