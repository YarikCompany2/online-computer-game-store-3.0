import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'process';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
import { AuthModule } from './auth/auth.module';
import { GamesModule } from './games/games.module';
import { CategoriesModule } from './categories/categories.module';
import { SeederModule } from './database/seeder.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { LibraryModule } from './library/library.module';
import { MediaModule } from './media/media.module';
import { RequirementsModule } from './requirements/requirements.module';
import { ReviewsModule } from './reviews/reviews.module';
import { DiscountsModule } from './discounts/discounts.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: process.env.NODE_ENV === 'test'
          ? config.get<string>('DB_NAME_TEST')
          : config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
        dropSchema: process.env.NODE_ENV === 'test',
      }),
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    UsersModule,
    CompaniesModule,
    AuthModule,
    GamesModule,
    CategoriesModule,
    SeederModule,
    CartModule,
    OrdersModule,
    LibraryModule,
    MediaModule,
    RequirementsModule,
    ReviewsModule,
    DiscountsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
