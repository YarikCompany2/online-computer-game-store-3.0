import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { SeederService } from '../src/database/seeder.service';
import { UsersService } from '../src/users/users.service';

describe('Game Store System (e2e)', () => {
  let app: INestApplication<App>;
  let usersService: UsersService;
  let seeder: SeederService;

  const testUser = {
    email: `tester${Date.now()}@example.com`,
    username: 'Tester',
    password: 'password123',
  };

  let accessToken: string;
  let refreshToken: string;
  let userId: string;
  let gameId: string = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    seeder = app.get(SeederService);
    usersService = app.get(UsersService);

    await seeder.seed();
    console.log('Test Database Seeded.');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication & Identity', () => {
    it('/users/register (POST) - Success', () => {
      return request(app.getHttpServer())
        .post('/users/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          userId = res.body.id;
        });
    });

    it('/auth/login (POST) - Success', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.refreshToken).toBeDefined();
          accessToken = res.body.accessToken;
          refreshToken = res.body.refreshToken;
        });
    });

    let validRefreshToken: string;
    let oldRefreshToken: string;

    it('/auth/refresh (POST) - Success', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          userId: userId,
          refreshToken: refreshToken
        })
        .expect(200)
      
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.refreshToken).not.toBe(refreshToken);

      oldRefreshToken = refreshToken;
      refreshToken = res.body.refreshToken;
    });

    it('/auth/refresh (POST) - Failure (Old Refresh Token)', async () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          userId,
          refreshToken: oldRefreshToken,
        })
        .expect(401)
    });
  })
  
  describe('Company & Ownership', () => {
    it('/companies (POST) - Success with Token', () => {
      return request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Test Studio',
          description: 'Testing something',
          type: 'developer'
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.ownerId).toBe(userId);
        });
    });

    it('/companies (POST) - Failure (No Token)', () => {
      return request(app.getHttpServer())
        .post('/companies')
        .send({ name: 'Hack Studio' })
        .expect(401);
    });

    it('/companies (POST) - Failure (User already owns a company)', () => {
      return request(app.getHttpServer())
        .post('/companies')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Second Empire',
          type: 'publisher',
        })
        .expect(400)
    });
  });

  describe('Marketplace Flow', () => {
    it('/games (GET) - Browse and find paid game', async () => {
      const res = await request(app.getHttpServer())
        .get('/games')
        .expect(200);

      expect(res.body.data.length).toBeGreaterThan(0);

      const paidGame = res.body.data.find((g: any) => Number(g.price) > 0);
      gameId = paidGame ? paidGame.id : res.body.data[0].id;
    });

    it ('/cart (POST) - Add game to cart', () => {
      return request(app.getHttpServer())
        .post('/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ gameId })
        .expect(201);
    });
  });

  describe('Transaction & Delivery', () => {
    it('/orders/checkout (POST) - Buy game with enough balance', async () => {
      await usersService.update(userId, { balance: 500 });

      const res = await request(app.getHttpServer())
        .post('/orders/checkout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.message).toBe('Purchase successful');
      expect(Number(res.body.remainingBalance)).toBeLessThan(500);
    });

    it('/library (GET) - Confirm game ownership in library', async () => {
      const res = await request(app.getHttpServer())
        .get('/library')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const hasGame = res.body.some((item: any) => item.gameId === gameId);
      expect(hasGame).toBe(true);
    });
  });
});
