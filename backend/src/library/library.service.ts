import { Injectable } from '@nestjs/common';
import { CreateLibraryDto } from './dto/create-library.dto';
import { UpdateLibraryDto } from './dto/update-library.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Library } from './entities/library.entity';
import { Repository } from 'typeorm';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(Library)
    private readonly libraryRepository: Repository<Library>
  ) {}

  async findAllByUser(userId: string) {
    return await this.libraryRepository.find({
      where: { userId },
      relations: ['game', 'game.categories', 'game.company'],
      order: { purchaseDate: 'DESC' }
    });
  }
}
