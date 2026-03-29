import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async create(userId: string, dto: CreateReviewDto) {
    const existingReview = await this.reviewRepository.findOne({
      where: { userId, gameId: dto.gameId }
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this game');
    }

    const review = this.reviewRepository.create({ ...dto, userId });
    return await this.reviewRepository.save(review);
  }

  async findByGame(gameId: string) {
    return await this.reviewRepository.find({
      where: { gameId },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }
}