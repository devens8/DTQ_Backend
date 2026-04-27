import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

const server = express();
let isInitialized = false;

export async function createApp(): Promise<express.Express> {
  if (isInitialized) return server;

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    { rawBody: true, logger: ['error', 'warn'] },
  );

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
  isInitialized = true;
  return server;
}
