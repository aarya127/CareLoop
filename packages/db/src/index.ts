import { PrismaClient } from '@prisma/client';

// Keep local development usable even when DATABASE_URL is not exported in shell.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://user@localhost:5432/careloop?schema=public';
}

// Prevent multiple instances in dev (hot-reload safe)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';
