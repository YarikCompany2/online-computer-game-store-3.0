import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Company } from './entities/company.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { type PaginatedResource } from '../common/interfaces/paginated-resource.interface';
import { GetCompaniesFilterDto } from './dto/get-companies-filter.dto';
import { NotificationType } from 'src/notification/entities/notification.entity';

@Controller('companies')
export class CompaniesController {
  constructor(

    private readonly companiesService: CompaniesService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto, @Request() req): Promise<Company> {
    const ownerId = req.user.userId;

    return this.companiesService.create(createCompanyDto, ownerId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('invite')
  async inviteUser(@Body() body: { identifier: string }, @Request() req) {
    if (!req.user.companyId) {
      throw new ForbiddenException('You must own a company to invite members');
    }
    return this.companiesService.inviteUser(body.identifier, req.user.companyId);
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
