import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { CartService } from '../cart/cart.service';
import { UsersService } from '../users/users.service';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from './entities/order.entity';

describe('OrdersService', () => {
  let service: OrdersService;
  let cartService: CartService;
  let usersService: UsersService;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn().mockImplementation((entity, data) => data),
      save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'order-123', ...data })),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    getRepository: jest.fn().mockReturnValue({
      find: jest.fn(),
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: CartService,
          useValue: {
            getMyCart: jest.fn(),
            clearCart: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    cartService = module.get<CartService>(CartService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkout', () => {
    const userId = 'u1';

    it('should successfully process a purchase with discounts applied', async () => {
      const mockCart = [
        { 
          gameId: 'g1', 
          game: { 
            price: 100,
            discount: { 
              isActive: true, 
              discountPercent: 20, 
              startDate: new Date('2020-01-01'), 
              endDate: new Date('2099-01-01') 
            } 
          }
        },
        { 
          gameId: 'g2', 
          game: { price: 50, discount: null } 
        },
      ];
      
      (cartService.getMyCart as jest.Mock).mockResolvedValue(mockCart);
      (usersService.findOne as jest.Mock).mockResolvedValue({ id: userId, balance: 200 });

      const result = await service.checkout(userId);

      expect(result.totalSpent).toBe(130);
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(usersService.update).toHaveBeenCalledWith(userId, { balance: 70 });
      expect(cartService.clearCart).toHaveBeenCalledWith(userId);
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException if cart is empty', async () => {
      (cartService.getMyCart as jest.Mock).mockResolvedValue([]);

      await expect(service.checkout(userId)).rejects.toThrow(BadRequestException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });

    it('should rollback if user balance is insufficient', async () => {
      const mockCart = [{ gameId: 'g1', game: { price: 100 }, discount: null }];
      
      (cartService.getMyCart as jest.Mock).mockResolvedValue(mockCart);
      (usersService.findOne as jest.Mock).mockResolvedValue({ id: userId, balance: 50 });

      await expect(service.checkout(userId)).rejects.toThrow('Insufficient balance');
      
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('should rollback if an unexpected error occurs during saving', async () => {
      (cartService.getMyCart as jest.Mock).mockResolvedValue([{ gameId: 'g1', game: { price: 10 } }]);
      (usersService.findOne as jest.Mock).mockResolvedValue({ id: userId, balance: 100 });
      
      mockQueryRunner.manager.save.mockRejectedValueOnce(new Error('DB Crash'));

      await expect(service.checkout(userId)).rejects.toThrow('DB Crash');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('findAllByUser', () => {
    it('should return order history', async () => {
      const mockOrders = [{ id: 'o1', totalAmount: 130 }];
      const findSpy = jest.spyOn(mockDataSource.getRepository(null as any), 'find').mockResolvedValue(mockOrders);

      const result = await service.findAllByUser('u1');

      expect(result).toEqual(mockOrders);
      expect(findSpy).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: 'u1' }
      }));
    });
  });
});