import { NextResponse } from 'next/server';
import type { HealthStatus } from '@careloop/types';

export const dynamic = 'force-dynamic';

const startTime = Date.now();

export async function GET(): Promise<NextResponse<HealthStatus>> {
  let dbStatus: 'ok' | 'down' = 'down';

  try {
    // Lazy import to avoid build-time issues when DB is not available
    const { prisma } = await import('@/lib/db/prisma');
    await prisma.$queryRaw`SELECT 1`;
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
