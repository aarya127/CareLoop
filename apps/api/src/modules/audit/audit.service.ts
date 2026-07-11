import { Injectable, Logger } from '@nestjs/common';
import { Prisma, prisma } from '@careloop/db';
import { getRedisClient } from '../../config/redis';

export interface AuditEntry {
  eventType: string;
  outcome: 'success' | 'failure';
  actorUserId?: string;
  targetUserId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogQuery {
  eventType?: string;
  outcome?: string;
  actorUserId?: string;
  targetUserId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  /** Audit read queries are cached for 30 seconds — enough for dashboard polling. */
  private readonly readCacheTtlSeconds = 30;

  /**
   * Write an audit log entry. Failures are swallowed so they never
   * break the primary request flow.
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          eventType: entry.eventType,
          outcome: entry.outcome,
          actorUserId: entry.actorUserId,
          targetUserId: entry.targetUserId,
          sessionId: entry.sessionId,
          ip: entry.ip,
          userAgentHash: entry.userAgent,
          authMethod: 'password',
          metadata: (entry.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      this.logger.warn(`Audit write failed for event "${entry.eventType}": ${err}`);
    }
  }

  async getLog(query: AuditLogQuery) {
    const limit = Math.min(Number(query.limit ?? 50), 200);
    const offset = Number(query.offset ?? 0);

    const where: Prisma.AuditLogWhereInput = {};
    if (query.eventType) where.eventType = { contains: query.eventType, mode: 'insensitive' };
    if (query.outcome) where.outcome = query.outcome;
    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.targetUserId) where.targetUserId = query.targetUserId;
    if (query.from || query.to) {
      where.eventTime = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    // Build a stable cache key from filter params
    const cacheKey = `audit:log:${JSON.stringify({ where, limit, offset })}`;
    try {
      const redis = getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {
      /* Redis unavailable */
    }

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { eventTime: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          eventTime: true,
          eventType: true,
          outcome: true,
          actorUserId: true,
          targetUserId: true,
          ip: true,
          authMethod: true,
          sessionId: true,
          requestId: true,
          metadata: true,
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    const result = { rows, total, limit, offset };

    try {
      const redis = getRedisClient();
      await redis.set(cacheKey, JSON.stringify(result), 'EX', this.readCacheTtlSeconds);
    } catch {
      /* ok */
    }

    return result;
  }
}
