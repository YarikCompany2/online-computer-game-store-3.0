import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsService } from './reviews.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { BadRequestException } from '@nestjs/common';

describe('ReviewsService', () => {
  let service: ReviewsService;

  const mockReviewRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((review) => 
      Promise.resolve({ id: 'review-uuid', ...review })
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Review),
          useValue: mockReviewRepository,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-uuid';
    const createReviewDto = {
      gameId: 'game-uuid',
      rating: 5,
      comment: 'This game is legendary!',
    };

    it('should successfully create a review if user has not reviewed this game yet', async () => {
      mockReviewRepository.findOne.mockResolvedValue(null);

      const result = await service.create(userId, createReviewDto);

      expect(result).toHaveProperty('id', 'review-uuid');
      expect(result.userId).toBe(userId);
      expect(result.rating).toBe(5);
      expect(mockReviewRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already reviewed this game', async () => {
      mockReviewRepository.findOne.mockResolvedValue({ id: 'existing-review-id' });

      await expect(
        service.create(userId, createReviewDto)
      ).rejects.toThrow(BadRequestException);
      
      expect(mockReviewRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('findByGame', () => {
    it('should return all reviews for a specific game with user info', async () => {
      const gameId = 'game-uuid';
      const mockReviews = [
        { id: '1', rating: 5, comment: 'Great!', user: { username: 'Gamer1' } },
        { id: '2', rating: 4, comment: 'Good', user: { username: 'Gamer2' } },
      ];
      mockReviewRepository.find.mockResolvedValue(mockReviews);

      const result = await service.findByGame(gameId);

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockReviews);
      
      expect(mockReviewRepository.find).toHaveBeenCalledWith({
        where: { gameId },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
    });
  });
});