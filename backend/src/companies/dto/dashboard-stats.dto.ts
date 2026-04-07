export class GameStatsDto {
  id: string;
  title: string;
  price: number;
  salesCount: number;
  totalRevenue: number;
  mainCover: string | null;
}

export class CompanyDashboardDto {
  totalRevenue: number;
  totalSales: number;
  activeGamesCount: number;
  games: GameStatsDto[];
}