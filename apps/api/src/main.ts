import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

// fastify cookie parsing for http-only cookies
// register dynamically to avoid build-time issues if plugin missing
// (fastify-cookie is expected to be installed in dev environment)

const PORT = Number(process.env.API_PORT ?? 3001);
const HOST = process.env.API_HOST ?? '0.0.0.0';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env.NODE_ENV !== 'production' }),
    { bufferLogs: true }
  );

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
  });

  // register fastify-cookie so we can read/set httpOnly cookies
  try {
    const fastifyInstance = app.getHttpAdapter().getInstance();
    await fastifyInstance.register(require('fastify-cookie'));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('fastify-cookie not registered:', message);
  }

  await app.listen(PORT, HOST);
  console.info(`[API] listening on http://${HOST}:${PORT}`);
}

bootstrap();
