import { Test, TestingModule } from "@nestjs/testing";
import { CompaniesService } from "./companies.service"
import { getRepositoryToken } from "@nestjs/typeorm";
import { Company, CompanyType } from "./entities/company.entity";
import { User } from "../users/entities/user.entity";
import { Repository } from "typeorm";
import { skip } from "node:test";
import { NotFoundException } from "@nestjs/common";

describe('CompaniesService', () => {
  let service: CompaniesService;

  let mockCompanyRepo: Partial<Record<keyof Repository<Company>, jest.Mock>>;

  const mockUserRepo = {
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  beforeEach(async () => {
    mockCompanyRepo = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn().mockImplementation((company) => 
        Promise.resolve({
          id: 'comp-uuid',
          ...company
        })
      ),
      update: jest.fn(),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        { provide: getRepositoryToken(Company), useValue: mockCompanyRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a company and link it to the owner user', async () => {
      const dto = {
        name: 'Big Game Studio',
        description: 'Elite devs',
        type: CompanyType.DEVELOPER
      };
      const ownerId = 'user-uuid';

      const result = await service.create(dto, ownerId);

      expect(result.id).toBe('comp-uuid');
      expect(result.name).toBe(dto.name);
      expect(result.ownerId).toBe(ownerId);

      expect(mockUserRepo.update).toHaveBeenCalledWith(ownerId, {
        companyId: 'comp-uuid'
      });
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of companies with default values', async () => {
      const mockCompanies = [{ id: '1', name: 'Company 1' }, { id: '2', name: 'Company 2' }];
      const totalCount = 2;

      mockCompanyRepo.findAndCount = jest.fn().mockResolvedValue([mockCompanies, totalCount]);

      const result = await service.findAll({});

      expect(result.data).toEqual(mockCompanies);
      expect(result.meta.totalItems).toBe(totalCount);
      expect(result.meta.currentPage).toBe(1);
      expect(result.meta.itemsPerPage).toBe(10);
      expect(result.meta.totalPages).toBe(1);

      expect(mockCompanyRepo.findAndCount).toHaveBeenCalledWith({
        take: 10,
        skip: 0,
      });
    });

    it('should correctly calculate skip for the second page', async () => {
      const totalCount = 15;
      mockCompanyRepo.findAndCount = jest.fn().mockResolvedValue([[], totalCount]);

      const page = 2;
      const limit = 5;

      const result = await service.findAll({ page, limit });

      expect(mockCompanyRepo.findAndCount).toHaveBeenCalledWith({
        take: 5,
        skip: 5,
      });

      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.currentPage).toBe(2);
    })
  });

  describe('remove', () => {
    it('should unlink users and soft delete the company if owner is correct', async () => {
      const company = { id: 'comp-uuid', ownerId: 'owner-uuid' };
      (mockCompanyRepo.findOne as jest.Mock).mockResolvedValue(company);

      await service.remove('comp-uuid', 'owner-uuid');

      expect(mockUserRepo.update).toHaveBeenCalledWith(
        { companyId: 'comp-uuid' },
        { companyId: null }
      );

      expect(mockCompanyRepo.softDelete).toHaveBeenCalledWith('comp-uuid');
    });

    it('should throw NotFoundException if company not found or owner is wrong', async () => {
      (mockCompanyRepo.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.remove('comp-uuid', 'not-owner-uuid')
      ).rejects.toThrow(NotFoundException)
    })
  });
});