import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { Game, GameStatus } from '../games/entities/game.entity';
import { Order } from '../orders/entities/order.entity';
import { Company } from '../companies/entities/company.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from '../notification/entities/notification.entity';
import { slugify } from '../utils/slugify';
import { join } from 'path';
import { Media } from '../media/entities/media.entity';
import { Requirement } from '../requirements/entities/requirement.entity';
import * as fs from 'fs';
import { Discount } from '../discounts/entities/discount.entity';
import { CreateDiscountDto } from '../discounts/dto/create-discount.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Company) private readonly companyRepo: Repository<Company>,
    @InjectRepository(Game) private readonly gameRepo: Repository<Game>,
    @InjectRepository(Notification) private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Discount) private readonly discountRepo: Repository<Discount>,
  ) {}

  async getGlobalStats() {
    const [totalUsers, totalCompanies, totalModerators, totalCompanyMembers] = await Promise.all([
      this.userRepo.count(),
      this.companyRepo.count(),
      this.userRepo.count({ where: { role: UserRole.MODERATOR } }),
      this.userRepo.count({ where: { companyId: Not(IsNull()) } }),
    ]);

    return {
      totalUsers,
      totalCompanies,
      totalModerators,
      totalCompanyMembers,
    };
  }

  async searchUsers(query: string) {
    if (!query || query.length < 2) return [];

    return await this.userRepo.createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.email', 'user.role'])
      .where('LOWER(user.username) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(user.email) LIKE LOWER(:query)', { query: `%${query}%` })
      .orderBy('user.username', 'ASC')
      .limit(10)
      .getMany();
  }

  async promoteToModerator(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.update(userId, { role: UserRole.MODERATOR });
    return { message: `${user.username} is now a Moderator` };
  }

  async getPendingModerationGames() {
    return await this.gameRepo.find({
      where: { status: GameStatus.PENDING_MODERATION },
      relations: ['publisher', 'developer', 'media'],
      order: { createdAt: 'DESC' }
    });
  }

  async updateUserRole(id: string, role: UserRole) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.userRepo.update(id, { role });
    return { message: `User ${user.username} promoted to ${role}` };
  }

  async demoteFromModerator(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    if (user.role === UserRole.ADMIN) {
      throw new BadRequestException('Cannot demote an Administrator');
    }

    await this.userRepo.update(userId, { role: UserRole.USER });
    return { message: `${user.username} has been demoted to User` };
  }

  async rejectAndWipe(gameId: string) {
    const game = await this.gameRepo.findOne({ where: { id: gameId } });
    if (!game) throw new NotFoundException('Game not found');

    const slug = slugify(game.title);
    const paths = [
      join(process.cwd(), 'uploads', 'covers', slug),
      join(process.cwd(), 'uploads', 'builds', slug)
    ];

    paths.forEach(folder => {
      if (fs.existsSync(folder)) {
        fs.rmSync(folder, { recursive: true, force: true });
        console.log(`[Admin Cleanup] Deleted folder: ${folder}`);
      }
    });

    await this.gameRepo.manager.delete(Media, { gameId: game.id });
    await this.gameRepo.manager.delete(Requirement, { gameId: game.id });
    
    await this.notificationRepo.delete({ gameId: game.id });

    await this.gameRepo.delete(game.id);

    return { message: 'Rejected and data wiped successfully' };
  }

  async getAllGlobalDiscounts() {
    return await this.discountRepo.find({ 
      where: { isGlobal: true },
      order: { startDate: 'DESC' }
    });
  }

  async createGlobalDiscount(dto: CreateDiscountDto) {
    const discount = this.discountRepo.create({
      ...dto,
      isGlobal: true,
      isActive: true
    });
    return await this.discountRepo.save(discount);
  }

  async toggleDiscount(id: string) {
    const discount = await this.discountRepo.findOne({ where: { id } });
    if (!discount) throw new NotFoundException();
    
    await this.discountRepo.update(id, { isActive: !discount.isActive });
    return { message: 'Status updated' };
  }

  async deleteDiscount(id: string) {
    return await this.discountRepo.delete(id);
  }
}
