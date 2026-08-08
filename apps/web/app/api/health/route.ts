import { NextResponse } from 'next/server';
import type { HealthStatus } from '@careloop/shared';

export const dynamic = 'force-dynamic';

const startTime = Date.now();

async function withTimeout<T>(operation: Promise<T>, timeoutMs = 2_000): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error('Database health check timed out')), timeoutMs);
  });
  return Promise.race([operation, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export async function GET(): Promise<NextResponse<HealthStatus>> {
  let dbStatus: 'ok' | 'down' = 'down';

  try {
    // Lazy import to avoid build-time issues when DB is not available
    const { prisma } = await import('@/lib/db/prisma');
    await withTimeout(prisma.$queryRaw`SELECT 1`);
    dbStatus = 'ok';
  } catch {
    dbStatus = 'down';
  }

  const status: HealthStatus = {
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? '0.0.0',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    services: {
      database: dbStatus,
      redis: 'down', // Redis is not directly used by the web app
    },
  };

  return NextResponse.json(status, {
    status: status.status === 'ok' ? 200 : 503,
  });
}
