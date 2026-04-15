import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Game } from '../games/entities/game.entity';
import { OrderItem } from '../orders/entities/order-item.entity';

interface ISalesHistoryRaw {
  date: string;
  count: string;
  revenue: string;
}

@Injectable()
export class CompanyDashboardService {
  constructor(
    @InjectRepository(Game) private gameRepo: Repository<Game>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
  ) {}

  async getStats(companyId: string) {
    const games = await this.gameRepo.find({
      where: { publisherId: companyId }, 
      relations: ['media', 'discount']
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
        description: game.description,
        price: game.price,
        salesCount: gameSales.length,
        totalRevenue: revenue,
        mainCover: game.media.find(m => m.isMain)?.fileUrl || null,
        status: game.status,
        discount: game.discount ? {
          discountPercent: game.discount.discountPercent,
          isActive: game.discount.isActive,
          startDate: game.discount.startDate,
          endDate: game.discount.endDate
        } : null
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

  async getGameDetailStats(gameId: string, companyId: string) {
    const game = await this.gameRepo.findOne({
      where: { id: gameId, publisherId: companyId },
      relations: ['discount']
    });
  
    if (!game) throw new NotFoundException('Game not found or you are not the publisher');

    const salesData: ISalesHistoryRaw[] = await this.orderItemRepo
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .select("DATE(order.created_at)", "date")
      .addSelect("COUNT(item.id)", "count")
      .addSelect("SUM(item.priceAtPurchase)", "revenue")
      .where("item.gameId = :gameId", { gameId })
      .groupBy("date")
      .orderBy("date", "ASC")
      .getRawMany();

    return {
        title: game.title,
        price: game.price,
        discount: game.discount ? {
          name: game.discount.name,
          discountPercent: game.discount.discountPercent,
          isActive: game.discount.isActive,
          startDate: game.discount.startDate,
          endDate: game.discount.endDate
        } : null,
        history: salesData.map(d => ({
            date: d.date,
            count: Number(d.count),
            revenue: Number(d.revenue)
        }))
    };
  }
}