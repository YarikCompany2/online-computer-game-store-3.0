import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  async update(id: string, userId: string, dto: { rating?: number; comment?: string }) {
    const review = await this.reviewRepository.findOne({ where: { id, userId } });
    if (!review) throw new NotFoundException('Review not found or access denied');

    Object.assign(review, dto);
    return await this.reviewRepository.save(review);
  }

  async remove(id: string, userId: string) {
    const review = await this.reviewRepository.findOne({ where: { id, userId } });
    if (!review) throw new NotFoundException('Review not found or access denied');

    return await this.reviewRepository.remove(review);
  }
}