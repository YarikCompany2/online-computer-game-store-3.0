import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { Repository } from 'typeorm';
import { Game } from 'src/games/entities/game.entity';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media) private mediaRepo: Repository<Media>,
    @InjectRepository(Game) private gameRepo: Repository<Game>,
  ) {}

  async create(dto: CreateMediaDto, companyId: string) {
    const game = await this.gameRepo.findOne({ where: { id: dto.gameId } });
    if (!game) throw new NotFoundException('Game not found');

    if (game.companyId !== companyId) {
      throw new ForbiddenException('You can only add media to your own games');
    }

    const media = this.mediaRepo.create(dto);
    return await this.mediaRepo.save(media);
  }

  async remove(id: string, companyId: string) {
    const media = await this.mediaRepo.findOne({
      where: { id },
      relations: ['game']
    });
    if (!media) throw new NotFoundException('Media not found');
    if (media.game.companyId !== companyId) throw new ForbiddenException('Access denied');

    return await this.mediaRepo.remove(media);
  }
}
