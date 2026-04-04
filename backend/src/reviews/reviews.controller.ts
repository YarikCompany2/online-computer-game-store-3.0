import { Body, Controller, Get, Param, Post, UseGuards, Request, Delete, Patch } from "@nestjs/common";
import { ReviewsService } from "./reviews.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CreateReviewDto } from "./dto/create-review.dto";

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateReviewDto, @Request() req) {
    return this.reviewsService.create(req.user.userId, dto);
  }

  @Get('game/:gameId')
  findByGame(@Param('gameId') gameId: string) {
    return this.reviewsService.findByGame(gameId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any, @Request() req) {
    return this.reviewsService.update(id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.reviewsService.remove(id, req.user.userId);
  }
}