import './load-env';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { LatencyInterceptor } from './common/interceptors';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Serialize BigInt values (e.g. AuditLog.id) as strings in JSON responses —
// JSON.stringify throws on BigInt otherwise, 500-ing endpoints like /audit.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

// fastify cookie parsing for http-only cookies
// register dynamically to avoid build-time issues if plugin missing
// (fastify-cookie is expected to be installed in dev environment)

const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
const HOST = process.env.API_HOST ?? '0.0.0.0';
const COOKIE_SECRET = process.env.COOKIE_SECRET ?? 'change-me-in-production-use-32-char-secret';

/**
 * Validate that all required secrets are set in production.
 * Fails fast at startup so a misconfigured deployment surfaces immediately
 * rather than silently running with insecure defaults.
 */
function validateSecrets(): void {
  if (process.env.NODE_ENV !== 'production') return;

  const INSECURE_DEFAULTS = new Set([
    'change-me-in-production',
    'change-me-in-production-use-32-char-secret',
    'secret',
    'password',
    '',
  ]);

  const required: Array<{ key: string; value: string | undefined }> = [
    { key: 'COOKIE_SECRET', value: process.env.COOKIE_SECRET },
    { key: 'DATABASE_URL', value: process.env.DATABASE_URL },
    { key: 'REDIS_URL', value: process.env.REDIS_URL },
    { key: 'SESSION_TTL_SECONDS', value: process.env.SESSION_TTL_SECONDS },
  ];

  const problems: string[] = [];

  for (const { key, value } of required) {
    if (!value || INSECURE_DEFAULTS.has(value.trim())) {
      problems.push(`  - ${key} is missing or set to an insecure default`);
    }
  }

  if (problems.length > 0) {
    console.error('\n[SECURITY] Production startup aborted due to misconfigured secrets:\n');
    problems.forEach((p) => console.error(p));
    console.error('\nSet these in your secrets manager and inject them as environment variables.\n');
    process.exit(1);
  }
}

async function bootstrap() {
  validateSecrets();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env.NODE_ENV !== 'production' }),
    // rawBody: expose the unparsed request body (req.rawBody) so webhook handlers
    // can verify provider signatures over the exact bytes that were signed
    // (Stripe/SendGrid HMAC breaks if computed over re-serialized JSON).
    { bufferLogs: true, rawBody: true }
  );

  // Register cookie plugin — required before any route handling
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(fastifyCookie as any, { secret: COOKIE_SECRET });

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

  // Global latency interceptor — logs slow requests (>=500 ms) as WARN
  app.useGlobalInterceptors(new LatencyInterceptor());

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
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Idempotency-Key',
      'X-CSRF-Token',
      'X-Request-ID',
    ],
  });

  await app.listen(PORT, HOST);
  console.info(`[API] listening on http://${HOST}:${PORT}`);
}

bootstrap();
