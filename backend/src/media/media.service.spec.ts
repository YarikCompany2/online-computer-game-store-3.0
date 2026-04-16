import { Test, TestingModule } from '@nestjs/testing';
import { MediaService } from './media.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Media, MediaType } from './entities/media.entity';
import { Game } from '../games/entities/game.entity';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('MediaService', () => {
  let service: MediaService;
  let mediaRepo;
  let gameRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: getRepositoryToken(Media),
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

    service = module.get<MediaService>(MediaService);
    mediaRepo = module.get(getRepositoryToken(Media));
    gameRepo = module.get(getRepositoryToken(Game));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadGameMedia', () => {
    const mockFile = { filename: 'cover.jpg' } as Express.Multer.File;
    const companyId = 'comp-1';
    const gameId = 'game-1';

    it('should successfully upload media if company is the developer', async () => {
      gameRepo.findOne.mockResolvedValue({ id: gameId, developerId: companyId });
      mediaRepo.save.mockResolvedValue({ id: 'm1', fileUrl: 'some-url' });

      const result = await service.uploadGameMedia(mockFile, gameId, companyId, true);

      expect(result).toBeDefined();
      expect(mediaRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        isMain: true,
        type: MediaType.IMAGE
      }));
    });

    it('should throw ForbiddenException if company is not the developer', async () => {
      gameRepo.findOne.mockResolvedValue({ id: gameId, developerId: 'other-comp' });

      await expect(service.uploadGameMedia(mockFile, gameId, companyId, true))
        .rejects.toThrow(ForbiddenException);
    });
  });

  describe('handleFileUpload', () => {
    it('should throw BadRequestException if file is missing', async () => {
      await expect(service.handleFileUpload(null as any, 'g1', 'c1'))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('saveToDb', () => {
    const gameId = 'g1';
    const companyId = 'c1';
    const fileUrl = 'http://localhost:3000/uploads/img.png';

    it('should allow upload if company is the publisher (not only developer)', async () => {
      gameRepo.findOne.mockResolvedValue({ 
        id: gameId, 
        developerId: 'dev-2', 
        publisherId: companyId 
      });
      mediaRepo.save.mockImplementation(dto => Promise.resolve({ id: 'm2', ...dto }));

      const result = await service.saveToDb(gameId, fileUrl, false, companyId);

      expect(result.gameId).toBe(gameId);
      expect(mediaRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if game does not exist', async () => {
      gameRepo.findOne.mockResolvedValue(null);
      await expect(service.saveToDb(gameId, fileUrl, false, companyId))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should successfully remove media', async () => {
      const mockMedia = { 
        id: 'm1', 
        game: { developerId: 'c1' } 
      };
      mediaRepo.findOne.mockResolvedValue(mockMedia);
      mediaRepo.remove.mockResolvedValue(mockMedia);

      const result = await service.remove('m1', 'c1');

      expect(result).toEqual(mockMedia);
      expect(mediaRepo.remove).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if trying to remove media of another dev game', async () => {
      mediaRepo.findOne.mockResolvedValue({ 
        id: 'm1', 
        game: { developerId: 'real-dev' } 
      });

      await expect(service.remove('m1', 'hacker-dev')).rejects.toThrow(ForbiddenException);
    });
  });
});