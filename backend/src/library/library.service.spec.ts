import { Test, TestingModule } from '@nestjs/testing';
import { LibraryService } from './library.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Library } from './entities/library.entity';
import { User } from '../users/entities/user.entity';
import { Game } from '../games/entities/game.entity';

describe('LibraryService', () => {
  let service: LibraryService;
  let libRepo;
  let userRepo;
  let gameRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LibraryService,
        {
          provide: getRepositoryToken(Library),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            manager: {
              findOne: jest.fn(),
            },
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Game),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<LibraryService>(LibraryService);
    libRepo = module.get(getRepositoryToken(Library));
    userRepo = module.get(getRepositoryToken(User));
    gameRepo = module.get(getRepositoryToken(Game));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByUser', () => {
    const userId = 'u1';

    it('should return only purchased items if user is not in a company', async () => {
      userRepo.findOne.mockResolvedValue({ id: userId, companyId: null });
      libRepo.find.mockResolvedValue([
        { id: 'l1', gameId: 'g1', purchaseDate: new Date(), game: { title: 'Game 1' } }
      ]);

      const result = await service.findAllByUser(userId);

      expect(result).toHaveLength(1);
      expect(result[0].accessType).toBe('purchased');
      expect(gameRepo.find).not.toHaveBeenCalled();
    });

    it('should combine purchased and professional games (dev access)', async () => {
      const companyId = 'c1';
      userRepo.findOne.mockResolvedValue({ id: userId, companyId });
      
      libRepo.find.mockResolvedValue([
        { id: 'l1', gameId: 'g1', purchaseDate: new Date('2023-01-01'), game: { id: 'g1', title: 'Bought' } }
      ]);

      gameRepo.find.mockResolvedValue([
        { id: 'g2', title: 'Studio Project', createdAt: new Date('2023-02-01') }
      ]);

      const result = await service.findAllByUser(userId);

      expect(result).toHaveLength(2);
      expect(result.find(i => i.gameId === 'g1')!.accessType).toBe('purchased');
      expect(result.find(i => i.gameId === 'g2')!.accessType).toBe('developer');
    });

    it('should deduplicate games if user bought a game they also developed', async () => {
      const companyId = 'c1';
      userRepo.findOne.mockResolvedValue({ id: userId, companyId });
      
      const sharedGame = { id: 'g_shared', title: 'Shared' };

      libRepo.find.mockResolvedValue([
        { id: 'l1', gameId: 'g_shared', purchaseDate: new Date(), game: sharedGame }
      ]);

      gameRepo.find.mockResolvedValue([sharedGame]);

      const result = await service.findAllByUser(userId);

      expect(result).toHaveLength(1);
      expect(result[0].accessType).toBe('purchased');
    });
  });

  describe('checkAccess', () => {
    const userId = 'u1';
    const gameId = 'g1';

    it('should return true if game is purchased', async () => {
      libRepo.findOne.mockResolvedValue({ id: 'exists' });

      const result = await service.checkAccess(userId, gameId);

      expect(result).toBe(true);
    });

    it('should return true if user is the developer of the game', async () => {
      libRepo.findOne.mockResolvedValue(null); 
      userRepo.findOne.mockResolvedValue({ id: userId, companyId: 'my_studio' });
      libRepo.manager.findOne.mockResolvedValue({ id: gameId, developerId: 'my_studio' });

      const result = await service.checkAccess(userId, gameId);

      expect(result).toBe(true);
    });

    it('should return false if no purchase and not developer', async () => {
      libRepo.findOne.mockResolvedValue(null);
      userRepo.findOne.mockResolvedValue({ id: userId, companyId: 'my_studio' });
      libRepo.manager.findOne.mockResolvedValue({ id: gameId, developerId: 'other_studio' });

      const result = await service.checkAccess(userId, gameId);

      expect(result).toBe(false);
    });
  });
});