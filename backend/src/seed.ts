import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeederService } from './database/seeder.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const seeder = app.get(SeederService);
  
  try {
    await seeder.seed();
  } catch (error) {
    console.error('Seeding failed!');
  } finally {
    await app.close();
  }
}

bootstrap();