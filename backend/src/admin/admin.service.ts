import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { Game } from '../games/entities/game.entity';
import { Order } from '../orders/entities/order.entity';
import { Company } from '../companies/entities/company.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
  ) {}

  async getGlobalStats() {
    const result = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.total_amount)', 'total')
      .where('order.status = :status', { status: 'paid' })
      .getRawOne();

    return {
      totalPlatformRevenue: parseFloat(result.total) || 0,
      totalUsers: await this.userRepo.count(),
    };
  }

  async findAllUsers() {
    return await this.userRepo.find({
      select: ['id', 'username', 'email', 'role', 'companyId'],
      order: { username: 'ASC' }
    });
  }

  async promoteToModerator(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.userRepo.update(userId, { role: UserRole.MODERATOR });
    return { message: `${user.username} is now a Moderator` };
  }

  async updateUserRole(id: string, role: UserRole) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    await this.userRepo.update(id, { role });
    return { message: `User ${user.username} promoted to ${role}` };
  }
}
