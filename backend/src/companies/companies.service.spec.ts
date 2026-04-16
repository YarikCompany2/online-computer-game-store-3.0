import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Notification as NotificationEntity, NotificationType, NotificationStatus } from '../notification/entities/notification.entity';
import { UsersService } from '../users/users.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let companyRepo;
  let userRepo;
  let notificationRepo;
  let usersService: UsersService;

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: getRepositoryToken(Company),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn(),
            findOne: jest.fn(),
            softDelete: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(NotificationEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn().mockImplementation(dto => dto),
          },
        },
        {
          provide: UsersService,
          useValue: {
            update: jest.fn(),
            findByIdentifier: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
    companyRepo = module.get(getRepositoryToken(Company));
    userRepo = module.get(getRepositoryToken(User));
    notificationRepo = module.get(getRepositoryToken(NotificationEntity));
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { name: 'Epic Games', description: 'Devs' };
    const ownerId = 'user-1';

    it('should create a company and link it to the user', async () => {
      userRepo.findOne.mockResolvedValue({ id: ownerId, role: UserRole.USER, companyId: null });
      companyRepo.save.mockResolvedValue({ id: 'comp-1', ...dto });

      const result = await service.create(dto as any, ownerId);

      expect(result.id).toBe('comp-1');
      expect(usersService.update).toHaveBeenCalledWith(ownerId, { companyId: 'comp-1' });
    });

    it('should block staff members from creating companies', async () => {
      userRepo.findOne.mockResolvedValue({ id: ownerId, role: UserRole.ADMIN });

      await expect(service.create(dto as any, ownerId)).rejects.toThrow(
        'Platform staff members are prohibited'
      );
    });

    it('should throw if user already has a company', async () => {
      userRepo.findOne.mockResolvedValue({ id: ownerId, role: UserRole.USER, companyId: 'existing-id' });

      await expect(service.create(dto as any, ownerId)).rejects.toThrow(
        'User already owns a company'
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      const mockData = [{ name: 'A' }, { name: 'B' }];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockData, 2]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.totalPages).toBe(1);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });

  describe('inviteUser', () => {
    it('should send invitation to valid user', async () => {
      const targetUser = { id: 'u2', username: 'alex', role: UserRole.USER, companyId: null };
      (usersService.findByIdentifier as jest.Mock).mockResolvedValue(targetUser);
      notificationRepo.findOne.mockResolvedValue(null);
      companyRepo.findOne.mockResolvedValue({ name: 'Valve' });

      await service.inviteUser('alex', 'comp-1');

      expect(notificationRepo.save).toHaveBeenCalledWith(expect.objectContaining({
        type: NotificationType.COMPANY_INVITATION,
        recipientId: 'u2'
      }));
    });

    it('should throw if user already in a studio', async () => {
      (usersService.findByIdentifier as jest.Mock).mockResolvedValue({
        id: 'u2', companyId: 'other-comp'
      });

      await expect(service.inviteUser('alex', 'comp-1')).rejects.toThrow(
        'already a member of a studio'
      );
    });
  });

  describe('remove', () => {
    it('should unlink users and delete company', async () => {
      companyRepo.findOne.mockResolvedValue({ id: 'c1', ownerId: 'owner-1' });
      
      await service.remove('c1', 'owner-1');

      expect(userRepo.update).toHaveBeenCalledWith({ companyId: 'c1' }, { companyId: null });
      expect(companyRepo.softDelete).toHaveBeenCalledWith('c1');
    });

    it('should throw if company not found or owner mismatch', async () => {
      companyRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('c1', 'hacker')).rejects.toThrow(NotFoundException);
    });
  });
});