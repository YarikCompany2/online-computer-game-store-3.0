import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Company } from './entities/company.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { type PaginatedResource } from 'src/common/interfaces/paginated-resource.interface';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto, @Request() req): Promise<Company> {
    const ownerId = req.user.userId;

    return this.companiesService.create(createCompanyDto, ownerId);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedResource<Company>> {
    return this.companiesService.findAll(paginationDto);
  }
}
