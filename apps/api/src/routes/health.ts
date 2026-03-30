import type { FastifyInstance } from 'fastify';
import { prisma } from '@careloop/db';
import { getRedisClient } from '../plugins/redis';
import type { HealthStatus } from '@careloop/types';

const startTime = Date.now();

export async function healthRoutes(app: FastifyInstance) {
  app.get<{ Reply: HealthStatus }>('/', async (_req, reply) => {
    const status: HealthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: {
        database: 'down',
        redis: 'down',
      },
    };

    // DB ping
    try {
      await prisma.$queryRaw`SELECT 1`;
      status.services.database = 'ok';
    } catch {
      status.status = 'degraded';
    }

    // Redis ping
    try {
      const redis = getRedisClient();
      await redis.ping();
      status.services.redis = 'ok';
    } catch {
      status.status = 'degraded';
    }

    const httpStatus = status.status === 'ok' ? 200 : 503;
    return reply.code(httpStatus).send(status);
  });
}
