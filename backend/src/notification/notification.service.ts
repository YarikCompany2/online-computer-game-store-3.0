import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus, NotificationType } from './entities/notification.entity';
import { Game, GameStatus } from '../games/entities/game.entity';
import { slugify } from '../utils/slugify';
import { join } from 'path';
import * as fs from 'fs';
import { Media } from '../media/entities/media.entity';
import { Requirement } from '../requirements/entities/requirement.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAllByUser(userId: string) {
    return await this.notificationRepo.find({
      where: { recipientId: userId, status: NotificationStatus.PENDING },
      relations: ['game', 'game.publisher'],
      order: { createdAt: 'DESC' }
    });
  }

  async respond(notificationId: string, userId: string, accept: boolean) {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, recipientId: userId },
      relations: ['game']
    });

    if (!notification) throw new NotFoundException('Notification not found');

    if (notification.type === NotificationType.GAME_PUBLISH) {
      return this.handleGamePublishResponse(notification, accept);
    } 

    if (notification.type === NotificationType.COMPANY_INVITATION) {
      if (accept) {
        await this.userRepo.update(userId, { companyId: notification.senderCompanyId });
        notification.status = NotificationStatus.ACCEPTED;
      } else {
        notification.status = NotificationStatus.REJECTED;
      }
      return await this.notificationRepo.save(notification);
    }
  }

  private async handleGamePublishResponse(notification: Notification, accept: boolean) {
    const game = notification.game;

    if (!game) {
      throw new BadRequestException('This notification is not associated with a game.');
    }

    if (accept) {
      notification.status = NotificationStatus.ACCEPTED;
      await this.gameRepo.update(game.id, { status: GameStatus.ACTIVE });
      return await this.notificationRepo.save(notification);
    } else {
      const slug = slugify(game.title);
      const coverFolder = join(process.cwd(), 'uploads', 'covers', slug);
      const buildFolder = join(process.cwd(), 'uploads', 'builds', slug);

      [coverFolder, buildFolder].forEach(f => {
        if (fs.existsSync(f)) fs.rmSync(f, { recursive: true, force: true });
      });
      await this.gameRepo.manager.delete(Media, { gameId: game.id });
      await this.gameRepo.manager.delete(Requirement, { gameId: game.id });
      
      await this.notificationRepo.delete(notification.id);
      await this.gameRepo.delete(game.id);

      return { message: 'Collaboration rejected and game data deleted' };
    }
  }

  create(dto: any) { return 'Internal use only'; }
  findOne(id: string) { return this.notificationRepo.findOne({ where: { id } }); }
  update(id: string, dto: any) { return `Update ${id}`; }
  remove(id: string) { return this.notificationRepo.delete(id); }
}