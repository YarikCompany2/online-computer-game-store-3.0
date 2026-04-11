import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResource } from '../common/interfaces/paginated-resource.interface';
import { UsersService } from '../users/users.service';
import { Notification, NotificationStatus, NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly usersService: UsersService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, ownerId: string): Promise<Company> {
    const user = await this.userRepository.findOne({ where: { id: ownerId } });

    if (user && user.companyId) {
      throw new BadRequestException('User already owns a company');
    }

    const newCompany = this.companyRepository.create({
      ...createCompanyDto,
      ownerId,
    });
    const savedCompany = await this.companyRepository.save(newCompany);

    await this.usersService.update(ownerId, { companyId: savedCompany.id });

    return savedCompany;
  }

  async findAll(paginationDto: PaginationDto, search?: string): Promise<PaginatedResource<Company>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.companyRepository.createQueryBuilder('company');

    if (search && search.trim() !== '') {
      queryBuilder.where('LOWER(company.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder
      .take(limit)
      .skip(skip)
      .orderBy('company.name', 'ASC')
      .getManyAndCount();

    return {
      data,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
      },
    };
  }

  async inviteUser(identifier: string, senderCompanyId: string) {
    const targetUser = await this.usersService.findByIdentifier(identifier);
    if (!targetUser) {
      throw new NotFoundException(`User "${identifier}" not found`);
    }

    if (targetUser.companyId) {
      throw new BadRequestException('This user is already a member of a studio');
    }

    const existingInvite = await this.notificationRepository.findOne({
      where: {
        recipientId: targetUser.id,
        senderCompanyId: senderCompanyId,
        type: NotificationType.COMPANY_INVITATION,
        status: NotificationStatus.PENDING
      }
    });

    if (existingInvite) {
      throw new BadRequestException(
        `You have already sent an invitation to ${targetUser.username}. Please wait for them to respond.`
      );
    }

    const company = await this.companyRepository.findOne({ where: { id: senderCompanyId } });

    return await this.notificationRepository.save({
      recipientId: targetUser.id,
      senderCompanyId: senderCompanyId,
      type: NotificationType.COMPANY_INVITATION,
      message: `The studio "${company?.name}" invited you to join their team.`,
      status: NotificationStatus.PENDING
    });
  }

  async remove(id: string, ownerId: string) {
    const company = await this.companyRepository.findOne({
      where: { id, ownerId }
    });

    if (!company) {
      throw new NotFoundException('Company not found or access denied');
    }

    await this.userRepository.update({ companyId: id }, { companyId: null });

    return await this.companyRepository.softDelete(id);
  }
}
