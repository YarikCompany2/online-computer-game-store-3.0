import { DataSource } from "typeorm";
import { OrdersService } from "./orders.service"
import { Game } from "../games/entities/game.entity";
import { User } from "../users/entities/user.entity";
import { Test, TestingModule } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "./entities/order.entity";
import { OrderItem } from "./entities/order-item.entity";
import { Library } from "../library/entities/library.entity";
import { Cart } from "../cart/entities/cart.entity";
import { Category } from "../categories/entities/category.entity";
import { CartModule } from "../cart/cart.module";
import { UsersModule } from "../users/users.module";
import { Company, CompanyType } from "../companies/entities/company.entity";
import { Media } from "../media/entities/media.entity";
import { Requirement } from "../requirements/entities/requirement.entity";
import { Review } from "../reviews/entities/review.entity";
import { Discount } from "../discounts/entities/discount.entity";

describe('OrdersService (Integration)', () => {
  let service: OrdersService;
  let dataSource: DataSource;
  let testUser: User;
  let testGame: Game;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          password: '!super@password!',
          database: 'gamestore_test',
          entities: [Order, OrderItem, User, Game, Library, Cart, Category, Company, Media, Requirement, Review, Discount],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Order, OrderItem, User, Game, Library, Cart, Category, Company, Media, Requirement, Review, Discount]),
        CartModule,
        UsersModule,
      ],
      providers: [OrdersService],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    dataSource = module.get<DataSource>(DataSource);

    const userRepo = dataSource.getRepository(User);
    const gameRepo = dataSource.getRepository(Game);
    const companyRepo = dataSource.getRepository(Company);

    testUser = await userRepo.save(userRepo.create({
      email: 'integrator@test.com',
      username: 'Integrator',
      passwordHash: 'hash',
      balance: 100.00
    }));

    const testCompany = await companyRepo.save(companyRepo.create({
      name: 'Integration Studio',
      type: CompanyType.DEVELOPER,
      ownerId: testUser.id
    }));

    testGame = await gameRepo.save(gameRepo.create({
      title: 'Integration Game',
      description: 'Test',
      price: 60.00,
      companyId: testCompany.id
    }));
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should process transaction correctly: deduct balance and clear cart', async () => {
    const cartRepo = dataSource.getRepository(Cart);
    const libRepo = dataSource.getRepository(Library);

    await cartRepo.save(cartRepo.create({ userId: testUser.id, gameId: testGame.id }));

    await service.checkout(testUser.id);

    const updatedUser = await dataSource.getRepository(User).findOneBy({ id: testUser.id });
    const cartItems = await cartRepo.findBy({ userId: testUser.id });
    const libItems = await libRepo.findBy({ userId: testUser.id, gameId: testGame.id });

    expect(updatedUser).toBeDefined();
    expect(updatedUser).not.toBeNull();
    expect(Number(updatedUser!.balance)).toBe(40.00);

    expect(cartItems.length).toBe(0);
    expect(libItems.length).toBe(1);
  })
})