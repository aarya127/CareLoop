import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@careloop/shared';
import { prisma } from '../../config/database';
import { getRedisClient } from '../../config/redis';
import { Public } from '../../common/decorators';

const startTime = Date.now();

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  async check(): Promise<HealthStatus> {
    let dbStatus: 'ok' | 'down' = 'down';
    let redisStatus: 'ok' | 'down' = 'down';

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'ok';
    } catch {}

    try {
      await getRedisClient().ping();
      redisStatus = 'ok';
    } catch {}

    const allOk = dbStatus === 'ok' && redisStatus === 'ok';
    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: { database: dbStatus, redis: redisStatus },
    };
  }
}
