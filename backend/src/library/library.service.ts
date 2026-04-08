import { Injectable } from '@nestjs/common';
import { CreateLibraryDto } from './dto/create-library.dto';
import { UpdateLibraryDto } from './dto/update-library.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Library } from './entities/library.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Game } from '../games/entities/game.entity';

export type AccessType = 'purchased' | 'developer';

export interface ILibraryItem {
  id: string;
  userId: string;
  gameId: string;
  orderId: string | null;
  purchaseDate: Date;
  game: Game;
  accessType: AccessType;
}

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(Library)
    private readonly libraryRepository: Repository<Library>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>
  ) {}

  async findAllByUser(userId: string): Promise<ILibraryItem[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    const purchasedItems = await this.libraryRepository.find({
      where: { userId },
      relations: ['game', 'game.categories', 'game.developer', 'game.media'],
      order: { purchaseDate: 'DESC' }
    })

    const libraryItems: ILibraryItem[] = purchasedItems.map(item => ({
      id: item.id,
      userId: item.userId,
      gameId: item.gameId,
      orderId: item.orderId,
      purchaseDate: item.purchaseDate,
      game: item.game,
      accessType: 'purchased'
    }));

    if (user?.companyId) {
      const developedGames = await this.gameRepository.find({
        where: { developerId: user.companyId },
        relations: ['categories', 'developer', 'media']
      });

      developedGames.forEach(game => {
        const isAlreadyPresent = libraryItems.some(item => item.gameId === game.id);
        
        if (!isAlreadyPresent) {
          libraryItems.push({
            id: `dev-access-${game.id}`,
            userId: userId,
            gameId: game.id,
            orderId: null,
            purchaseDate: game.createdAt,
            game: game,
            accessType: 'developer'
          });
        }
      });
    }

    return libraryItems.sort((a, b) => 
      b.purchaseDate.getTime() - a.purchaseDate.getTime()
    );
  }

  async checkAccess(userId: string, gameId: string): Promise<boolean> {
    const purchase = await this.libraryRepository.findOne({ where: { userId, gameId } });
    if (purchase) return true;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    const game = await this.libraryRepository.manager.findOne(Game, { where: { id: gameId } });
    
    if (user && game && user.companyId === game.developerId) {
      return true;
    }

    return false;
  }
}
