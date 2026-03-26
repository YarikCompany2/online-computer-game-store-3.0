import { Injectable } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { Repository } from 'typeorm';
import { User, UserRole } from 'src/users/entities/user.entity';

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

  async findAll(): Promise<Company[]> {
    return await this.companyRepository.find();
  }
}
