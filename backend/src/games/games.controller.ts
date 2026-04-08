import { Controller, Get, Post, Body, Request, Param, Delete, UseGuards, ForbiddenException, Patch, Query, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { type Response } from 'express';
import { GamesService } from './games.service';
import { CreateGameDto } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { LibraryService } from '../library/library.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { slugify } from '../utils/slugify';
import { join } from 'path';
import * as fs from 'node:fs';

@Controller('games')
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly libraryService: LibraryService,
    private readonly gameService: GamesService,
  ) {}

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
  @Post('upload-build')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const folderName = slugify(req.body.gameTitle || 'untitled');
        const uploadPath = join(process.cwd(), 'uploads', 'builds', folderName);

        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const originalNameOnly = file.originalname.replace('.zip', '');
        const cleanFileName = slugify(originalNameOnly);
        const uniqueId = Math.random().toString(36).substring(2, 8);
        
        cb(null, `${cleanFileName}-${uniqueId}.zip`);
      },
    }),
    limits: { fileSize: 500 * 1024 * 1024 },
  }))
  async uploadBuild(@UploadedFile() file: Express.Multer.File, @Body('gameId') gameId: string) {
    return this.gamesService.updateBuildUrl(gameId, file.path);
  }

  @UseGuards(JwtAuthGuard)
  @Get('download/:id')
  async downloadGame(
    @Param('id') gameId: string, 
    @Request() req, 
    @Res() res: Response
  ) {
    const userId = req.user.userId;
    const hasAccess = await this.libraryService.checkAccess(userId, gameId);
    
    if (!hasAccess) {
      throw new ForbiddenException('You do not own this game');
    }

    const game = await this.gamesService.getBuildPath(gameId);
    
    return res.download(game.buildUrl, `${slugify(game.title)}.zip`); 
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    if (!req.user.companyId) throw new ForbiddenException('No company associated');
    return this.gamesService.remove(id, req.user.companyId);
  }
}
