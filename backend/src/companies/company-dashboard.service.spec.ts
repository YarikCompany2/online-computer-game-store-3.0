import { Test, TestingModule } from '@nestjs/testing';
import { CompanyDashboardService } from './company-dashboard.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Game } from '../games/entities/game.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';

describe('CompanyDashboardService', () => {
  let service: CompanyDashboardService;
  let gameRepo;
  let orderItemRepo;

  const mockQueryBuilder = {
    innerJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyDashboardService,
        {
          provide: getRepositoryToken(Game),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<CompanyDashboardService>(CompanyDashboardService);
    gameRepo = module.get(getRepositoryToken(Game));
    orderItemRepo = module.get(getRepositoryToken(OrderItem));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    const companyId = 'comp-1';

    it('should return zeros if company has no games', async () => {
      gameRepo.find.mockResolvedValue([]);

      const result = await service.getStats(companyId);

      expect(result.totalRevenue).toBe(0);
      expect(result.games).toHaveLength(0);
    });

    it('should correctly aggregate revenue and sales across multiple games', async () => {
      const mockGames = [
        { id: 'g1', title: 'Game 1', price: 10, media: [] },
        { id: 'g2', title: 'Game 2', price: 20, media: [] },
      ];
      const mockSales = [
        { gameId: 'g1', priceAtPurchase: 10 },
        { gameId: 'g1', priceAtPurchase: 5 },
        { gameId: 'g2', priceAtPurchase: 20 },
      ];

      gameRepo.find.mockResolvedValue(mockGames);
      orderItemRepo.find.mockResolvedValue(mockSales);

      const result = await service.getStats(companyId);

      expect(result.totalSales).toBe(3);
      expect(result.totalRevenue).toBe(35);
      expect(result.activeGamesCount).toBe(2);
      expect(result.games[0].totalRevenue).toBe(15);
    });
  });

  describe('getGameDetailStats', () => {
    const companyId = 'comp-1';
    const gameId = 'game-1';

    it('should throw NotFoundException if game is not found or wrong owner', async () => {
      gameRepo.findOne.mockResolvedValue(null);

      await expect(service.getGameDetailStats(gameId, companyId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return formatted historical data from QueryBuilder', async () => {
      const mockGame = { id: gameId, title: 'Factorio', price: 30, discount: null };
      const rawHistory = [
        { date: '2023-10-01', count: '5', revenue: '150.00' },
        { date: '2023-10-02', count: '2', revenue: '60.00' },
      ];

      gameRepo.findOne.mockResolvedValue(mockGame);
      mockQueryBuilder.getRawMany.mockResolvedValue(rawHistory);

      const result = await service.getGameDetailStats(gameId, companyId);

      expect(result.title).toBe('Factorio');
      expect(result.history).toHaveLength(2);
      expect(result.history[0]).toEqual({
        date: '2023-10-01',
        count: 5,
        revenue: 150,
      });
      expect(orderItemRepo.createQueryBuilder).toHaveBeenCalled();
    });
  });
});