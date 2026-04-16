import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { Game } from '../games/entities/game.entity';
import { Discount } from '../discounts/entities/discount.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { Notification as NotificationEntity } from '../notification/entities/notification.entity';

jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');
  return {
    __esModule: true,
    ...originalModule,
    existsSync: jest.fn(),
    rmSync: jest.fn(),
  };
});

import * as fs from 'fs';

const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

describe('AdminService', () => {
  let service: AdminService;
  let userRepo;
  let gameRepo;
  let discountRepo;
  let notificationRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            count: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Company),
          useValue: { count: jest.fn() },
        },
        {
          provide: getRepositoryToken(Game),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            delete: jest.fn(),
            manager: { delete: jest.fn() },
          },
        },
        {
          provide: getRepositoryToken(NotificationEntity), 
          useValue: { delete: jest.fn() },
        },
        {
          provide: getRepositoryToken(Discount),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepo = module.get(getRepositoryToken(User));
    gameRepo = module.get(getRepositoryToken(Game));
    discountRepo = module.get(getRepositoryToken(Discount));
    notificationRepo = module.get(getRepositoryToken(NotificationEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGlobalStats', () => {
    it('should return combined stats from repositories', async () => {
      userRepo.count.mockResolvedValue(10);
      const stats = await service.getGlobalStats();
      expect(stats).toHaveProperty('totalUsers', 10);
    });
  });

  describe('promoteToModerator', () => {
    it('should update user role to moderator', async () => {
      const mockUser = { id: 'u1', username: 'tester' };
      userRepo.findOne.mockResolvedValue(mockUser);
      userRepo.update.mockResolvedValue({});

      const result = await service.promoteToModerator('u1');
      expect(userRepo.update).toHaveBeenCalledWith('u1', { role: UserRole.MODERATOR });
      expect(result.message).toContain('is now a Moderator');
    });
  });

  describe('demoteFromModerator', () => {
    it('should prevent demoting an admin', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u2', role: UserRole.ADMIN });
      await expect(service.demoteFromModerator('u2')).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectAndWipe', () => {
    it('should delete game and associated files', async () => {
      const mockGame = { id: 'g1', title: 'Cyberpunk' };
      gameRepo.findOne.mockResolvedValue(mockGame);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await service.rejectAndWipe('g1');

      expect(gameRepo.delete).toHaveBeenCalledWith('g1');
      expect(fs.rmSync).toHaveBeenCalled();
      expect(notificationRepo.delete).toHaveBeenCalledWith({ gameId: 'g1' });
    });
  });
});