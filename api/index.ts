import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

let app: any;

async function bootstrap() {
  if (app) return app;

  app = await NestFactory.create(AppModule, { rawBody: true });

  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://downtheque.vercel.app',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.setGlobalPrefix('api/v1');
  await app.init();
  return app;
}

export default async function handler(req: any, res: any) {
  const nestApp = await bootstrap();
  const expressApp = nestApp.getHttpAdapter().getInstance();
  return expressApp(req, res);
}
