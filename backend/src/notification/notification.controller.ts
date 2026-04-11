// backend/src/notification/notification.controller.ts
import { Controller, Get, Post, Param, Body, UseGuards, Request, Patch, Delete } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CompaniesService } from '../companies/companies.service';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly companiesService: CompaniesService
  ) {}

  @Get()
  findAll(@Request() req) {
    return this.notificationService.findAllByUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invite')
  async inviteUser(@Body() body: { identifier: string }, @Request() req) {
    return this.companiesService.inviteUser(body.identifier, req.user.companyId);
  }

  @Patch(':id/respond')
  respond(
    @Param('id') id: string,
    @Body('accept') accept: boolean,
    @Request() req
  ) {
    return this.notificationService.respond(id, req.user.userId, accept);
  }

  @Post() create(@Body() dto: any) { return this.notificationService.create(dto); }
  @Get(':id') findOne(@Param('id') id: string) { return this.notificationService.findOne(id); }
  @Delete(':id') remove(@Param('id') id: string) { return this.notificationService.remove(id); }
}