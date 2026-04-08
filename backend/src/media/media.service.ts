import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Media, MediaType } from './entities/media.entity';
import { Repository } from 'typeorm';
import { Game } from '../games/entities/game.entity';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media) private mediaRepo: Repository<Media>,
    @InjectRepository(Game) private gameRepo: Repository<Game>,
  ) {}

  async uploadGameMedia(file: Express.Multer.File, gameId: string, companyId: string, isMain: boolean) {
    const game = await this.gameRepo.findOne({ where: { id: gameId } });
    if (!game || game.developerId !== companyId) throw new ForbiddenException();

    const fileUrl = `http://localhost:3000/uploads/covers/${file.filename}`;
    
    const media = this.mediaRepo.create({
      gameId,
      fileUrl,
      type: MediaType.IMAGE,
      isMain,
    });

    return await this.mediaRepo.save(media);
  }

  async handleFileUpload(file: Express.Multer.File, gameId: string, companyId: string) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const game = await this.gameRepo.findOne({ where: { id: gameId } });
    
    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.developerId !== companyId) {
      throw new ForbiddenException('You can only add media to your own games');
    }

    const fileUrl = `http://localhost:3000/uploads/covers/${file.filename}`;

    const media = this.mediaRepo.create({
      gameId,
      fileUrl,
      type: MediaType.IMAGE,
      isMain: true,
    });

    return await this.mediaRepo.save(media);
  }

  async create(dto: CreateMediaDto, companyId: string) {
    const game = await this.gameRepo.findOne({ where: { id: dto.gameId } });
    if (!game) throw new NotFoundException('Game not found');

    if (game.developerId !== companyId) {
      throw new ForbiddenException('You can only add media to your own games');
    }

    const media = this.mediaRepo.create(dto);
    return await this.mediaRepo.save(media);
  }

  async saveToDb(gameId: string, fileUrl: string, isMain: boolean, companyId: string) {
    const game = await this.gameRepo.findOne({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Game not found');
    if (game.developerId !== companyId) throw new ForbiddenException();

    const media = this.mediaRepo.create({
      gameId,
      fileUrl,
      type: MediaType.IMAGE,
      isMain,
    });

    const saved = await this.mediaRepo.save(media);
    console.log(`[Database] Linked image to "${game.title}" at path: ${fileUrl}`);
    return saved;
  }

  async remove(id: string, companyId: string) {
    const media = await this.mediaRepo.findOne({
      where: { id },
      relations: ['game']
    });
    if (!media) throw new NotFoundException('Media not found');
    if (media.game.developerId !== companyId) throw new ForbiddenException('Access denied');

    return await this.mediaRepo.remove(media);
  }
}
