import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  getStats() { return this.adminService.getGlobalStats(); }

  @Get('users/search')
  @Roles(UserRole.ADMIN)
  searchUsers(@Query('q') query: string) {
    return this.adminService.searchUsers(query);
  }

  @Patch('promote/:id')
  @Roles(UserRole.ADMIN)
  promote(@Param('id') id: string) { return this.adminService.promoteToModerator(id); }

  @Patch('demote/:id')
  @Roles(UserRole.ADMIN)
  demote(@Param('id') id: string) { 
    return this.adminService.demoteFromModerator(id); 
  }

  @Get('moderation/pending')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  getPendingGames() {
    return this.adminService.getPendingModerationGames();
  }

  @Delete('moderation/reject/:id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN)
  async rejectGame(@Param('id') id: string) {
    return this.adminService.rejectAndWipe(id);
  }
}
