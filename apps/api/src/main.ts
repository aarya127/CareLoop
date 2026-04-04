import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from './app.module';

const PORT = Number(process.env.API_PORT ?? 3001);
const HOST = process.env.API_HOST ?? '0.0.0.0';
const COOKIE_SECRET = process.env.COOKIE_SECRET ?? 'change-me-in-production-use-32-char-secret';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env.NODE_ENV !== 'production' }),
    { bufferLogs: true }
  );

  // Register cookie plugin — required before any route handling
  await app.register(fastifyCookie, { secret: COOKIE_SECRET });

  app.enableCors({
    origin: process.env.WEB_URL ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });

  await app.listen(PORT, HOST);
  console.info(`[API] listening on http://${HOST}:${PORT}`);
}

bootstrap();
