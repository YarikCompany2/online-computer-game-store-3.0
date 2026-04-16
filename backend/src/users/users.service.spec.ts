import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { Company } from '../companies/entities/company.entity';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let userRepo;
  let companyRepo;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((entity, data) => data),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
      update: jest.fn().mockResolvedValue({}),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn(),
            update: jest.fn().mockResolvedValue({}),
            softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
          },
        },
        {
          provide: getRepositoryToken(Company),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(User));
    companyRepo = module.get(getRepositoryToken(Company));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { email: 'test@mail.com', username: 'tester', password: 'password123' };

    it('should successfully create a user with hashed password', async () => {
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      userRepo.save.mockResolvedValue({ id: 'u1', ...dto, passwordHash: 'hashed_password' });

      const result = await service.create(dto);

      expect(result).not.toHaveProperty('passwordHash');
      expect(userRepo.save).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 'salt');
    });

    it('should throw BadRequestException if email exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1' });
      await expect(service.create(dto)).rejects.toThrow('email already exists');
    });
  });

  describe('topUpBalance', () => {
    it('should add amount to balance and commit transaction', async () => {
      const userId = 'u1';
      const amount = 50;
      const initialBalance = 100;

      mockQueryRunner.manager.findOne.mockResolvedValue({ id: userId, balance: initialBalance });

      userRepo.findOne.mockResolvedValue({ id: userId, balance: 150 });

      const result = await service.topUpBalance(userId, amount);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.update).toHaveBeenCalledWith(User, userId, { balance: 150 });
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      
      expect(result.balance).toBe(150);
    });

    it('should rollback transaction if user not found', async () => {
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      await expect(service.topUpBalance('u1', 50)).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('leaveCompany', () => {
    it('should allow a member to leave', async () => {
      const user = { id: 'u1', companyId: 'c1' };
      const company = { id: 'c1', ownerId: 'other-user' };

      userRepo.findOne.mockResolvedValue(user);
      companyRepo.findOne.mockResolvedValue(company);

      await service.leaveCompany('u1');

      expect(userRepo.update).toHaveBeenCalledWith('u1', { companyId: null });
    });

    it('should block the CEO from leaving (must delete company)', async () => {
      const user = { id: 'ceo-id', companyId: 'c1' };
      const company = { id: 'c1', ownerId: 'ceo-id' };

      userRepo.findOne.mockResolvedValue(user);
      companyRepo.findOne.mockResolvedValue(company);

      await expect(service.leaveCompany('ceo-id')).rejects.toThrow(
        'As the CEO, you cannot leave the company'
      );
    });
  });

  describe('remove', () => {
    it('should successfully soft delete account', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1', companyId: null });
      await service.remove('u1');
      expect(userRepo.softDelete).toHaveBeenCalledWith('u1');
    });

    it('should throw if user owns a company', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1', companyId: 'c1' });
      await expect(service.remove('u1')).rejects.toThrow("Can't delete account while owning a company");
    });
  });
});