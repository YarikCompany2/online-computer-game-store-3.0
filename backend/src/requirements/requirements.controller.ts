import { Controller, Get, Post, Body, Patch, Param, Request, UseGuards, ForbiddenException, Delete } from '@nestjs/common';
import { RequirementsService } from './requirements.service';
import { CreateRequirementDto } from './dto/create-requirement.dto';
import { UpdateRequirementDto } from './dto/update-requirement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('requirements')
export class RequirementsController {
  constructor(private readonly requirementsService: RequirementsService) {}

  @Post()
  async create(@Body() dto: CreateRequirementDto, @Request() req) {
    if (!req.user.companyId) {
      throw new ForbiddenException('You must be a company representative to set requirements');
    }

    return this.requirementsService.create(dto, req.user.companyId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Access denied');
    }

    return this.requirementsService.remove(id, req.user.companyId);
  }
}
