import { Test, TestingModule } from "@nestjs/testing";
import { CompaniesService } from "./companies.service"
import { getRepositoryToken } from "@nestjs/typeorm";
import { Company, CompanyType } from "./entities/company.entity";
import { User } from "../users/entities/user.entity";

describe('CompaniesService', () => {
  let service: CompaniesService;

  const mockCompanyRepo = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(company => Promise.resolve({ id: 'comp-uuid', ...company })),
  };

  const mockUserRepo = {
    update: jest.fn().mockResolvedValue({ affected: 1 }),
  };

  beforeEach(async () => {
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
});