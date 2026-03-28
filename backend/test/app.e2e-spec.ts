import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { SeederService } from '../src/database/seeder.service';

describe('Authentication & Companies (e2e)', () => {
  let app: INestApplication<App>;
  let seeder: SeederService;

  const testUser = {
    email: `tester${Date.now()}@example.com`,
    username: 'Tester',
    password: 'password123',
  };

  let accessToken: string;
  let refreshToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    seeder = app.get(SeederService);

    await seeder.seed();
    console.log('Test Database Seeded.');
  });

  afterAll(async () => {
    await app.close();
  });

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
});
