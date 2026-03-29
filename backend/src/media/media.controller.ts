import { Controller, Get, Post, Body, Patch, Param, Request, UseGuards, ForbiddenException, Delete } from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  create(@Body() dto: CreateMediaDto, @Request() req) {
    if (!req.user.companyId) throw new ForbiddenException('No company profile found');
    return this.mediaService.create(dto, req.user.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.mediaService.remove(id, req.user.companyId);
  }
}
