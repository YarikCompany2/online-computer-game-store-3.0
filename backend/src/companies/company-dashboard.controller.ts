import { Controller, Get, UseGuards, Request, ForbiddenException, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CompanyDashboardService } from './company-dashboard.service';

@UseGuards(JwtAuthGuard)
@Controller('company-dashboard')
export class CompanyDashboardController {
  constructor(private dashboardService: CompanyDashboardService) {}

  @Get('stats')
  async getStats(@Request() req) {
    if (!req.user.companyId) {
      throw new ForbiddenException('You are not associated with any company');
    }
    return this.dashboardService.getStats(req.user.companyId);
  }

  @Get('game-stats/:id')
  async getGameStats(@Param('id') gameId: string, @Request() req) {
    return this.dashboardService.getGameDetailStats(gameId, req.user.companyId);
  }
}