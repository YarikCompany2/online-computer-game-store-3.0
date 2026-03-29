import { Test, TestingModule } from "@nestjs/testing";
import { RequirementsService } from "./requirements.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Requirement } from "./entities/requirement.entity";
import { Game } from "../games/entities/game.entity";
import { ForbiddenException } from "@nestjs/common";

describe('RequirementsService', () => {
  let service: RequirementsService;

  const mockReqRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((r) => Promise.resolve({ id: 'req-uuid', ...r })),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockGameRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequirementsService,
        { provide: getRepositoryToken(Requirement), useValue: mockReqRepo },
        { provide: getRepositoryToken(Game), useValue: mockGameRepo },
      ],
    }).compile();

    service = module.get<RequirementsService>(RequirementsService);
  });

  describe('create', () => {
    const dto = { 
      gameId: 'g-uuid', type: 'minimum' as any, 
      os: 'Win', processor: 'i5', ram: '8', gpu: 'GTX', storage: '50' 
    };

    it('should successfully add requirements if owner is correct', async () => {
      mockGameRepo.findOne.mockResolvedValue({ id: 'g-uuid', companyId: 'comp-uuid' });

      const result = await service.create(dto, 'comp-uuid');

      expect(result.id).toBe('req-uuid');
      expect(mockReqRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException for wrong companyId', async () => {
      mockGameRepo.findOne.mockResolvedValue({ id: 'g-uuid', companyId: 'hacker-comp' });

      await expect(service.create(dto, 'my-comp')).rejects.toThrow(ForbiddenException);
    });
  });
});