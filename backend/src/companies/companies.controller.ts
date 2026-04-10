import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Company } from './entities/company.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { type PaginatedResource } from '../common/interfaces/paginated-resource.interface';
import { GetCompaniesFilterDto } from './dto/get-companies-filter.dto';

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
  findAll(@Query() filterDto: GetCompaniesFilterDto): Promise<PaginatedResource<Company>> {
    const { search, ...paginationProps } = filterDto;
    return this.companiesService.findAll(paginationProps, search);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.companiesService.remove(id, req.user.userId);
  }
}
