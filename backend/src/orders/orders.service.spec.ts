import { Test, TestingModule } from "@nestjs/testing";
import { OrdersService } from "./orders.service";
import { DataSource } from "typeorm";
import { CartService } from "../cart/cart.service";
import { UsersService } from "../users/users.service";
import { BadRequestException } from "@nestjs/common";

describe('OrdersService', () => {
  let service: OrdersService;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn().mockImplementation((entity, data) => data),
      save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'order-uuid', ...data })),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    getRepository: jest.fn().mockReturnValue({
      find: jest.fn(),
    }),
  };

  const mockCartService = {
    getMyCart: jest.fn(),
    clearCart: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: CartService, useValue: mockCartService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkout', () => {
    const userId = 'user-uuid';

    it('should successfully complete checkout when cart is valid and balance is enough', async () => {
      const mockCartItems = [
        { gameId: 'g1', game: { price: 10, title: 'Game 1' } },
        { gameId: 'g2', game: { price: 20, title: 'Game 2' } },
      ];

      const mockUser = { id: userId, balance: 50 };

      mockCartService.getMyCart.mockResolvedValue(mockCartItems);
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await service.checkout(userId);

      expect(result.message).toBe('Purchase successful');
      expect(result.totalSpent).toBe(30);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockUsersService.update).toHaveBeenCalledWith(userId, { balance: 20 });
      expect(mockCartService.clearCart).toHaveBeenCalledWith(userId);
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException if cart is empty', async () => {
      mockCartService.getMyCart.mockResolvedValue([]);

      await expect(service.checkout(userId)).rejects.toThrow(BadRequestException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException and rollback if balance is insufficient', async () => {
      const mockCartItems = [{ gameId: 'g1', game: { price: 100 } }];
      const mockUser = { id: userId, balance: 10 };

      mockCartService.getMyCart.mockResolvedValue(mockCartItems);
      mockUsersService.findOne.mockResolvedValue(mockUser);

      await expect(service.checkout(userId)).rejects.toThrow(BadRequestException);

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    describe('findAllByUser', () => {
      it('should return order history for user', async () => {
        const mockOrders = [{ id: 'o1', totalAmount: 30 }];

        const repo = mockDataSource.getRepository();
        (repo.find as jest.Mock).mockResolvedValue(mockOrders);

        const result = await service.findAllByUser(userId);

        expect(result).toEqual(mockOrders);
        expect(repo.find).toHaveBeenCalledWith({
          where: { userId },
          relations: ['items', 'items.game'],
          order: { createdAt: 'DESC' },
        })
      }); 
    });
  });

  
});