import { Controller, Get, Post, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { ApplyDiscountDto } from './dto/apply-discount.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateDiscountDto, @Request() req) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only administrators can create global discounts');
    }
    return this.discountsService.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('apply')
  async applyToGame(@Body() dto: ApplyDiscountDto, @Request() req) {
    if (req.user.role !== UserRole.ADMIN && !req.user.companyId) {
      throw new ForbiddenException('Access denied');
    }
    return this.discountsService.applyToGame(dto.gameId, dto.discountId);
  }

  @Get()
  async findAll() {
    return this.discountsService.findAll();
  }
}