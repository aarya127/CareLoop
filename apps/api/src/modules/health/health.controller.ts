import { Controller, Get, Res } from '@nestjs/common';
import type { HealthStatus } from '@careloop/shared';
import type { FastifyReply } from 'fastify';
import { prisma } from '../../config/database';
import { getRedisClient } from '../../config/redis';
import { Public } from '../../common/decorators';

const startTime = Date.now();

@Controller('health')
export class HealthController {
  private async withTimeout<T>(operation: Promise<T>, timeoutMs = 2_000): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Health dependency check timed out')), timeoutMs);
    });
    return Promise.race([operation, timeout]).finally(() => {
      if (timer) clearTimeout(timer);
    });
  }

  @Public()
  @Get('live')
  live() {
    return {
      status: 'ok' as const,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
    };
  }

  @Public()
  @Get()
  check(@Res({ passthrough: true }) reply: FastifyReply): Promise<HealthStatus> {
    return this.readiness(reply);
  }

  @Public()
  @Get('ready')
  async readiness(@Res({ passthrough: true }) reply: FastifyReply): Promise<HealthStatus> {
    const [dbOk, redisOk] = await Promise.all([
      this.withTimeout(prisma.$queryRaw`SELECT 1`)
        .then(() => true)
        .catch(() => false),
      this.withTimeout(getRedisClient().ping())
        .then(() => true)
        .catch(() => false),
    ]);
    const dbStatus: 'ok' | 'down' = dbOk ? 'ok' : 'down';
    const redisStatus: 'ok' | 'down' = redisOk ? 'ok' : 'down';

    const allOk = dbStatus === 'ok' && redisStatus === 'ok';
    reply.status(allOk ? 200 : 503);
    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: { database: dbStatus, redis: redisStatus },
    };
  }
}
