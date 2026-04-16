import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Library } from '../library/entities/library.entity';
import { Game } from '../games/entities/game.entity';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewRepo;
  let libRepo;
  let gameRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Library),
          useValue: {
            findOne: jest.fn(),
            manager: {
              findOne: jest.fn(),
            },
          },
        },
        {
          provide: getRepositoryToken(Game),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
    reviewRepo = module.get(getRepositoryToken(Review));
    libRepo = module.get(getRepositoryToken(Library));
    gameRepo = module.get(getRepositoryToken(Game));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'u1';
    const gameId = 'g1';
    const dto = { gameId, rating: 5, comment: 'Amazing!' };

    it('should successfully create a review if user owns the game', async () => {
      gameRepo.findOne.mockResolvedValue({ id: gameId, developerId: 'other-dev' });
      libRepo.manager.findOne.mockResolvedValue({ id: userId, companyId: null });
      libRepo.findOne.mockResolvedValue({ id: 'ownership-record' });
      reviewRepo.findOne.mockResolvedValue(null);
      reviewRepo.save.mockResolvedValue({ id: 'r1', ...dto, userId });

      const result = await service.create(userId, dto);

      expect(result).toBeDefined();
      expect(reviewRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if developer reviews their own game', async () => {
      const companyId = 'my-studio';
      gameRepo.findOne.mockResolvedValue({ id: gameId, developerId: companyId });
      libRepo.manager.findOne.mockResolvedValue({ id: userId, companyId });

      await expect(service.create(userId, dto)).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user does not own the game', async () => {
      gameRepo.findOne.mockResolvedValue({ id: gameId });
      libRepo.manager.findOne.mockResolvedValue({ id: userId });
      libRepo.findOne.mockResolvedValue(null);

      await expect(service.create(userId, dto)).rejects.toThrow('must own the game');
    });

    it('should throw BadRequestException if review already exists', async () => {
      gameRepo.findOne.mockResolvedValue({ id: gameId });
      libRepo.manager.findOne.mockResolvedValue({ id: userId });
      libRepo.findOne.mockResolvedValue({ id: 'exists' });
      reviewRepo.findOne.mockResolvedValue({ id: 'old-review' });

      await expect(service.create(userId, dto)).rejects.toThrow('already reviewed this game');
    });
  });

  describe('update', () => {
    it('should update review if it belongs to the user', async () => {
      const mockReview = { id: 'r1', userId: 'u1', comment: 'Old' };
      reviewRepo.findOne.mockResolvedValue(mockReview);
      reviewRepo.save.mockImplementation(r => Promise.resolve(r));

      const result = await service.update('r1', 'u1', { comment: 'New' });

      expect(result.comment).toBe('New');
      expect(reviewRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFound if user tries to update someone else review', async () => {
      reviewRepo.findOne.mockResolvedValue(null);
      await expect(service.update('r1', 'hacker', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('adminRemove', () => {
    it('should allow admin to delete any review', async () => {
      const mockReview = { id: 'r1' };
      reviewRepo.findOne.mockResolvedValue(mockReview);
      
      await service.adminRemove('r1');
      
      expect(reviewRepo.remove).toHaveBeenCalledWith(mockReview);
    });
  });
});