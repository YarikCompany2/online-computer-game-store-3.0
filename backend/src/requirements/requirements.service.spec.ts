import { Test, TestingModule } from '@nestjs/testing';
import { RequirementsService } from './requirements.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Requirement } from './entities/requirement.entity';
import { Game } from '../games/entities/game.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('RequirementsService', () => {
  let service: RequirementsService;
  let reqRepo;
  let gameRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequirementsService,
        {
          provide: getRepositoryToken(Requirement),
          useValue: {
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Game),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RequirementsService>(RequirementsService);
    reqRepo = module.get(getRepositoryToken(Requirement));
    gameRepo = module.get(getRepositoryToken(Game));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = {
      gameId: 'game-1',
      type: 'minimum' as any,
      processor: 'i5',
      ram: '8GB',
      gpu: 'GTX 1050',
      storage: '50GB',
    };
    const companyId = 'comp-1';

    it('should successfully create requirements if company is the developer', async () => {
      gameRepo.findOne.mockResolvedValue({ id: 'game-1', developerId: companyId });
      reqRepo.save.mockResolvedValue({ id: 'req-1', ...dto });

      const result = await service.create(dto as any, companyId);

      expect(result).toBeDefined();
      expect(reqRepo.create).toHaveBeenCalledWith(dto);
      expect(reqRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if game does not exist', async () => {
      gameRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto as any, companyId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if company is not the developer', async () => {
      gameRepo.findOne.mockResolvedValue({ id: 'game-1', developerId: 'other-dev' });

      await expect(service.create(dto as any, companyId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    const reqId = 'req-1';
    const companyId = 'comp-1';

    it('should successfully remove if company owns the game associated with req', async () => {
      const mockReq = {
        id: reqId,
        game: { developerId: companyId },
      };
      reqRepo.findOne.mockResolvedValue(mockReq);
      reqRepo.remove.mockResolvedValue(mockReq);

      const result = await service.remove(reqId, companyId);

      expect(result).toEqual(mockReq);
      expect(reqRepo.remove).toHaveBeenCalledWith(mockReq);
    });

    it('should throw NotFoundException if requirement is missing', async () => {
      reqRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(reqId, companyId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if company is not the dev of associated game', async () => {
      const mockReq = {
        id: reqId,
        game: { developerId: 'real-dev' },
      };
      reqRepo.findOne.mockResolvedValue(mockReq);

      await expect(service.remove(reqId, 'hacker-comp')).rejects.toThrow(ForbiddenException);
    });
  });
});