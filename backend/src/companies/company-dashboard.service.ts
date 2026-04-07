import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Game } from '../games/entities/game.entity';
import { OrderItem } from '../orders/entities/order-item.entity';

@Injectable()
export class CompanyDashboardService {
  constructor(
    @InjectRepository(Game) private gameRepo: Repository<Game>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
  ) {}

  async getStats(companyId: string) {
    const games = await this.gameRepo.find({
      where: { developerId: companyId },
      relations: ['media']
    });

    if (games.length === 0) {
      return { totalRevenue: 0, totalSales: 0, activeGamesCount: 0, games: [] };
    }

    const gameIds = games.map(g => g.id);

    const sales = await this.orderItemRepo.find({
      where: { gameId: In(gameIds) }
    });

    const gamesStats = games.map(game => {
      const gameSales = sales.filter(s => s.gameId === game.id);
      const revenue = gameSales.reduce((sum, s) => sum + Number(s.priceAtPurchase), 0);
      
      return {
        id: game.id,
        title: game.title,
        price: game.price,
        salesCount: gameSales.length,
        totalRevenue: revenue,
        mainCover: game.media.find(m => m.isMain)?.fileUrl || null
      };
    });

    const totalRevenue = gamesStats.reduce((sum, g) => sum + g.totalRevenue, 0);
    const totalSales = gamesStats.reduce((sum, g) => sum + g.salesCount, 0);

    return {
      totalRevenue,
      totalSales,
      activeGamesCount: games.length,
      games: gamesStats
    };
  }
}