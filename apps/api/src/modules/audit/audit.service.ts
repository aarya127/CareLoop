import { Injectable, Logger } from '@nestjs/common';
import { Prisma, prisma } from '@careloop/db';

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

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

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

  async getLog(query: {
    eventType?: string;
    actorUserId?: string;
    targetUserId?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.eventType) where.eventType = query.eventType;
    if (query.actorUserId) where.actorUserId = query.actorUserId;
    if (query.targetUserId) where.targetUserId = query.targetUserId;

    if (query.from || query.to) {
      where.eventTime = {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { eventTime: 'desc' },
        take: Math.min(query.limit ?? 50, 200),
        skip: query.offset ?? 0,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { rows, total };
  }
}

