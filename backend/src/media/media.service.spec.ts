import { Test, TestingModule } from "@nestjs/testing";
import { MediaService } from "./media.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Media } from "./entities/media.entity";
import { Game } from "../games/entities/game.entity";
import { ForbiddenException, NotFoundException } from "@nestjs/common";

describe('MediaService', () => {
  let service: MediaService;

  const mockMediaRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((m) => Promise.resolve({ id: 'm-uuid', ...m })),
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
        MediaService,
        { provide: getRepositoryToken(Media), useValue: mockMediaRepo },
        { provide: getRepositoryToken(Game), useValue: mockGameRepo },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  describe('create', () => {
    const dto = { gameId: 'g-uuid', fileUrl: 'url', type: 'image' as any };

    it('should successfully add media if user is the owner of the game', async () => {
      mockGameRepo.findOne.mockResolvedValue({ id: 'g-uuid', companyId: 'comp-uuid' });

      const result = await service.create(dto, 'comp-uuid');

      expect(result).toHaveProperty('id', 'm-uuid');
      expect(mockMediaRepo.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      mockGameRepo.findOne.mockResolvedValue({ id: 'g-uuid', companyId: 'other-comp' });

      await expect(service.create(dto, 'my-comp')).rejects.toThrow(ForbiddenException);
      expect(mockMediaRepo.save).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if game does not exist', async () => {
      mockGameRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 'comp-uuid')).rejects.toThrow(NotFoundException);
    });
  });
});