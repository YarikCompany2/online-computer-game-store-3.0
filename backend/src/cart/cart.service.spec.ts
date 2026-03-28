import { Repository } from "typeorm";
import { CartService } from "./cart.service"
import { Cart } from "./entities/cart.entity";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe('CartService', () => {
  let service: CartService;
  let repo: Repository<Cart>

  const mockCartRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((item) => Promise.resolve({ id: 'cart-entry-uuid', ...item })),
    delete: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getRepositoryToken(Cart),
          useValue: mockCartRepository,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    repo = module.get<Repository<Cart>>(getRepositoryToken(Cart));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToCart', () => {
    const userId = 'user-uuid';
    const dto = { gameId: 'game-uuid' };

    it('should successfully add a game to the cart', async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      const result = await service.addToCart(userId, dto);

      expect(result).toHaveProperty('id', 'cart-entry-uuid');
      expect(result.userId).toBe(userId);
      expect(mockCartRepository.save).toHaveBeenCalled();
    });

    it('should throw BadReqyestException if game is already in cart', async () => {
      mockCartRepository.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.addToCart(userId, dto)).rejects.toThrow(BadRequestException);
      expect(mockCartRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getMyCart', () => {
    it('should return all items with relations for a specific user', async () => {
      const userId = 'user-uuid';
      const mockItems = [
        { id: '1', game: { title: 'Terraria' } },
        { id: '2', game: { title: 'Factorio' } }
      ];
      mockCartRepository.find.mockResolvedValue(mockItems);

      const result = await service.getMyCart(userId);

      expect(result).toEqual(mockItems);
      expect(mockCartRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['game', 'game.categories', 'game.company']
      })
    });
  });
  
  describe('removeFromCart', () => {
    it('should successfully delete item from cart', async () => {
      mockCartRepository.delete.mockResolvedValue({ affected: 1 });

      await service.removeFromCart('user-id', 'game-id');

      expect(mockCartRepository.delete).toHaveBeenCalledWith({
        userId: 'user-id',
        gameId: 'game-id'
      });
    });

    it('should throw NotFoundException if item was not in cart', async () => {
      mockCartRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(
        service.removeFromCart('user-id', 'game-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('clearCart', () => {
    it('should delete all items for a specific user', async () => {
      mockCartRepository.delete.mockResolvedValue({ affected: 5 });

      await service.clearCart('user-id');

      expect(mockCartRepository.delete).toHaveBeenCalledWith({ userId: 'user-id' });
    });
  });
});