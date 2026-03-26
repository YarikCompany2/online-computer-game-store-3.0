import { Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResource } from '../common/interfaces/paginated-resource.interface';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async create(createCompanyDto: CreateCompanyDto, ownerId: string): Promise<Company> {
    const newCompany = this.companyRepository.create({
      ...createCompanyDto,
      ownerId,
    });
    const savedCompany = await this.companyRepository.save(newCompany);

    await this.userRepository.update(savedCompany.ownerId, {
      companyId: savedCompany.id
    });

    return savedCompany;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginatedResource<Company>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.companyRepository.findAndCount({
      take: limit,
      skip: skip,
    });

    return {
      data,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total/ limit),
        currentPage: page,
      }
    }
  }
}
