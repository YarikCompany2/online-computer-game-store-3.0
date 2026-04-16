import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repo;

  const mockCategories = [
    { id: 1, name: 'Action' },
    { id: 2, name: 'RPG' },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            find: jest.fn().mockResolvedValue(mockCategories),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repo = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all categories ordered by name', async () => {
      const result = await service.findAll();

      expect(result).toEqual(mockCategories);
      expect(result).toHaveLength(2);

      expect(repo.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });
  });
});