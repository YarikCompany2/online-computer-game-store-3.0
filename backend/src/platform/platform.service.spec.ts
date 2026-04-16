import { Test, TestingModule } from '@nestjs/testing';
import { PlatformService } from './platform.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Platform } from './entities/platform.entity';

describe('PlatformService', () => {
  let service: PlatformService;
  let repo;

  const mockPlatforms = [
    { id: 1, name: 'Linux' },
    { id: 2, name: 'Windows' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformService,
        {
          provide: getRepositoryToken(Platform),
          useValue: {
            find: jest.fn().mockResolvedValue(mockPlatforms),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PlatformService>(PlatformService);
    repo = module.get(getRepositoryToken(Platform));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all platforms sorted by name alphabetically', async () => {
      const result = await service.findAll();

      expect(result).toEqual(mockPlatforms);
      expect(result).toHaveLength(2);
      
      expect(repo.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a platform if it exists', async () => {
      const targetId = 1;
      const expectedPlatform = { id: targetId, name: 'Linux' };
      repo.findOne.mockResolvedValue(expectedPlatform);

      const result = await service.findOne(targetId);

      expect(result).toEqual(expectedPlatform);
      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: targetId },
      });
    });

    it('should return null if platform is not found', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });
});