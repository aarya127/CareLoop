import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// fastify cookie parsing for http-only cookies
// register dynamically to avoid build-time issues if plugin missing
// (fastify-cookie is expected to be installed in dev environment)

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

  // Global validation — strip unknown fields, auto-transform types, reject bad input
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // Global exception filter — standard JSON error shape for all errors
  app.useGlobalFilters(new HttpExceptionFilter());

  const configuredOrigins = (process.env.WEB_URL ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const devOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (configuredOrigins.includes(origin) || devOriginPattern.test(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });

  await app.listen(PORT, HOST);
  console.info(`[API] listening on http://${HOST}:${PORT}`);
}

bootstrap();
