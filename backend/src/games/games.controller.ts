import { Controller, Get, Post, Body, Request, Param, Delete, UseGuards, ForbiddenException, Patch, Query } from '@nestjs/common';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user?.userId;
    return this.gamesService.findOne(id, userId);
  }

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: number,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    return this.gamesService.findAll(paginationDto, search, categoryId, minPrice, maxPrice);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createGameDto: CreateGameDto, @Request() req) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Only company owners can create games');
    }

    return this.gamesService.create(createGameDto, req.user.companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGameDto: UpdateGameDto,
    @Request() req
  ) {
    if (!req.user.companyId) throw new ForbiddenException('No company associated');
    return this.gamesService.update(id, updateGameDto, req.user.companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    if (!req.user.companyId) throw new ForbiddenException('No company associated');
    return this.gamesService.remove(id, req.user.userId);
  }
}
