import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { SeederService } from '../src/database/seeder.service';
import { UsersService } from '../src/users/users.service';
import { UserRole } from '../src/users/entities/user.entity';

describe('Game Store System (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let seeder: SeederService;

  const sellerUser = {
    email: `seller${Date.now()}@test.com`,
    username: `Seller${Date.now()}`,
    password: 'password123',
  };

  const buyerUser = {
    email: `buyer${Date.now()}@test.com`,
    username: `Buyer${Date.now()}`,
    password: 'password123',
  };

  let sellerToken: string;
  let buyerToken: string;
  let sellerId: string;
  let buyerId: string;
  let gameId: string;
  let discountId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();

    seeder = app.get(SeederService);
    usersService = app.get(UsersService);
    await seeder.seed();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Setup Seller and Game', () => {
    it('Register and Login Seller', async () => {
      const reg = await request(app.getHttpServer()).post('/users/register').send(sellerUser);
      sellerId = reg.body.id;

      const log = await request(app.getHttpServer()).post('/auth/login').send({
        identifier: sellerUser.email,
        password: sellerUser.password,
      });
      sellerToken = log.body.accessToken;
    });

    it('Seller creates Company', async () => {
      await request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ name: 'E2E Studio', description: 'World Class Devs' })
        .expect(201);

      const log = await request(app.getHttpServer()).post('/auth/login').send({
        identifier: sellerUser.email,
        password: sellerUser.password,
      });
      sellerToken = log.body.accessToken;
    });

    it('Seller creates Game', async () => {
      const res = await request(app.getHttpServer())
        .post('/games')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: `E2E Hit Game ${Date.now()}`,
          description: 'This is a description that is long enough.',
          price: 50.00,
          categoryIds: [1]
        })
        .expect(201);
      gameId = res.body.id;
    });

    it('Make Seller an Admin and create Discount', async () => {
      await usersService.update(sellerId, { role: UserRole.ADMIN });
      
      const log = await request(app.getHttpServer()).post('/auth/login').send({
        identifier: sellerUser.email,
        password: sellerUser.password,
      });
      sellerToken = log.body.accessToken;

      const res = await request(app.getHttpServer())
        .post('/discounts')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          name: 'E2E Promo',
          discountPercent: 10,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000)
        })
        .expect(201);
      discountId = res.body.id;

      await request(app.getHttpServer())
        .post('/discounts/apply')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ gameId, discountId })
        .expect(201);
    });
  });

  describe('Marketplace Flow (Buyer)', () => {
    it('Register and Login Buyer', async () => {
      const reg = await request(app.getHttpServer()).post('/users/register').send(buyerUser);
      buyerId = reg.body.id;

      const log = await request(app.getHttpServer()).post('/auth/login').send({
        identifier: buyerUser.email,
        password: buyerUser.password,
      });
      buyerToken = log.body.accessToken;
    });

    it('Buyer adds Game to Cart', () => {
      return request(app.getHttpServer())
        .post('/cart')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ gameId })
        .expect(201);
    });

    it('Buyer completes Checkout', async () => {
      await usersService.update(buyerId, { balance: 100.00 });

      const res = await request(app.getHttpServer())
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(res.body.message).toBe('Purchase successful');
    });

    it('Buyer verifies ownership and leaves Review', async () => {
      const lib = await request(app.getHttpServer())
        .get('/library')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);
      
      expect(lib.body.some(i => i.gameId === gameId)).toBe(true);

      await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          gameId,
          rating: 5,
          comment: 'Bought this game, it works perfectly!'
        })
        .expect(201);
    });
  });
});