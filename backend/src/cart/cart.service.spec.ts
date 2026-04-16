import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { Library } from '../library/entities/library.entity';
import { User } from '../users/entities/user.entity';
import { Game } from '../games/entities/game.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;
  let cartRepo;
  let libRepo;
  let userRepo;
  let gameRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getRepositoryToken(Cart),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn().mockImplementation(dto => dto),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Library),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Game),
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepo = module.get(getRepositoryToken(Cart));
    libRepo = module.get(getRepositoryToken(Library));
    userRepo = module.get(getRepositoryToken(User));
    gameRepo = module.get(getRepositoryToken(Game));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToCart', () => {
    const userId = 'u1';
    const gameId = 'g1';
    const dto = { gameId };

    it('should successfully add game to cart', async () => {
      userRepo.findOne.mockResolvedValue({ id: userId, companyId: null });
      gameRepo.findOne.mockResolvedValue({ id: gameId, developerId: 'other-comp' });
      libRepo.findOne.mockResolvedValue(null);
      cartRepo.findOne.mockResolvedValue(null);
      cartRepo.save.mockResolvedValue({ id: 'cart-entry', userId, gameId });

      const result = await service.addToCart(userId, dto);

      expect(result).toHaveProperty('id', 'cart-entry');
      expect(cartRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user missing', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.addToCart(userId, dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is the developer', async () => {
      userRepo.findOne.mockResolvedValue({ id: userId, companyId: 'my-studio' });
      gameRepo.findOne.mockResolvedValue({ id: gameId, developerId: 'my-studio' });

      await expect(service.addToCart(userId, dto)).rejects.toThrow(
        'As the developer of this game, you already have full access'
      );
    });

    it('should throw BadRequestException if game already owned', async () => {
      userRepo.findOne.mockResolvedValue({ id: userId });
      gameRepo.findOne.mockResolvedValue({ id: gameId });
      libRepo.findOne.mockResolvedValue({ id: 'lib-id' });

      await expect(service.addToCart(userId, dto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if game already in cart', async () => {
      userRepo.findOne.mockResolvedValue({ id: userId });
      gameRepo.findOne.mockResolvedValue({ id: gameId });
      libRepo.findOne.mockResolvedValue(null);
      cartRepo.findOne.mockResolvedValue({ id: 'existing-cart-id' });

      await expect(service.addToCart(userId, dto)).rejects.toThrow('already in your cart');
    });
  });

  describe('getMyCart', () => {
    it('should return cart items with relations', async () => {
      const mockItems = [{ id: '1', game: { title: 'Terraria' } }];
      cartRepo.find.mockResolvedValue(mockItems);

      const result = await service.getMyCart('u1');

      expect(result).toEqual(mockItems);
      expect(cartRepo.find).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'u1' },
        relations: expect.arrayContaining(['game', 'game.media'])
      }));
    });
  });

  describe('removeFromCart', () => {
    it('should successfully remove item', async () => {
      cartRepo.delete.mockResolvedValue({ affected: 1 });
      await service.removeFromCart('u1', 'g1');
      expect(cartRepo.delete).toHaveBeenCalledWith({ userId: 'u1', gameId: 'g1' });
    });

    it('should throw NotFoundException if nothing was deleted', async () => {
      cartRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.removeFromCart('u1', 'g1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('clearCart', () => {
    it('should call delete for all user items', async () => {
      await service.clearCart('u1');
      expect(cartRepo.delete).toHaveBeenCalledWith({ userId: 'u1' });
    });
  });
});