import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Game, GameStatus } from '../games/entities/game.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { Notification as NotificationEntity, NotificationStatus, NotificationType } from './entities/notification.entity';

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

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepo;
  let gameRepo;
  let userRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(NotificationEntity),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Game),
          useValue: {
            update: jest.fn(),
            delete: jest.fn(),
            manager: {
              delete: jest.fn(),
            },
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepo = module.get(getRepositoryToken(NotificationEntity));
    gameRepo = module.get(getRepositoryToken(Game));
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUser', () => {
    it('should return pending notifications', async () => {
      const mockNotifs = [{ id: '1', message: 'Hello' }];
      notificationRepo.find.mockResolvedValue(mockNotifs);

      const result = await service.findAllByUser('user-1');

      expect(result).toEqual(mockNotifs);
      expect(notificationRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { recipientId: 'user-1', status: NotificationStatus.PENDING }
      }));
    });
  });

  describe('respond', () => {
    const userId = 'u1';
    const notifId = 'n1';

    it('should throw NotFound if notification is missing', async () => {
      notificationRepo.findOne.mockResolvedValue(null);
      await expect(service.respond(notifId, userId, true)).rejects.toThrow(NotFoundException);
    });

    it('should prevent staff members from joining studios', async () => {
      notificationRepo.findOne.mockResolvedValue({
        id: notifId,
        recipientId: userId,
        type: NotificationType.COMPANY_INVITATION
      });
      userRepo.findOne.mockResolvedValue({ id: userId, role: UserRole.MODERATOR });

      await expect(service.respond(notifId, userId, true)).rejects.toThrow(BadRequestException);
      expect(notificationRepo.delete).toHaveBeenCalledWith(notifId);
    });

    it('should accept company invitation for normal user', async () => {
      const mockNotif = {
        id: notifId,
        recipientId: userId,
        type: NotificationType.COMPANY_INVITATION,
        senderCompanyId: 'comp-1'
      };
      notificationRepo.findOne.mockResolvedValue(mockNotif);
      userRepo.findOne.mockResolvedValue({ id: userId, role: UserRole.USER });
      notificationRepo.save.mockImplementation(n => Promise.resolve(n));

      const result = await service.respond(notifId, userId, true) as any;

      expect(userRepo.update).toHaveBeenCalledWith(userId, { companyId: 'comp-1' });
      expect(result.status).toBe(NotificationStatus.ACCEPTED);
    });
  });

  describe('handleGamePublishResponse (triggered by respond)', () => {
    const userId = 'u1';
    const notifId = 'n1';
    const gameId = 'g1';

    it('should set game status to active when accepted', async () => {
      notificationRepo.findOne.mockResolvedValue({
        id: notifId,
        recipientId: userId,
        type: NotificationType.GAME_PUBLISH,
        game: { id: gameId }
      });
      userRepo.findOne.mockResolvedValue({ id: userId });
      notificationRepo.save.mockImplementation(n => Promise.resolve(n));

      await service.respond(notifId, userId, true);

      expect(gameRepo.update).toHaveBeenCalledWith(gameId, { status: GameStatus.ACTIVE });
    });

    it('should wipe game data from DB and disk when rejected', async () => {
      notificationRepo.findOne.mockResolvedValue({
        id: notifId,
        recipientId: userId,
        type: NotificationType.GAME_PUBLISH,
        game: { id: gameId, title: 'Witcher' }
      });
      userRepo.findOne.mockResolvedValue({ id: userId });
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await service.respond(notifId, userId, false) as any;

      expect(fs.rmSync).toHaveBeenCalled();
      expect(gameRepo.manager.delete).toHaveBeenCalled(); 
      expect(gameRepo.delete).toHaveBeenCalledWith(gameId);
      expect(result.message).toContain('Collaboration rejected');
    });
  });
});