import { Injectable, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@careloop/db';
import { authConfig } from '../../config/auth';
import { hashToken, hashUserAgent, randomToken } from './auth.utils';
import { getRedisClient } from '../../config/redis';

export const SESSION_COOKIE = 'cl_session';

// Redis cache TTL for validated session context (60 s is short enough that
// revocations propagate within one minute, long enough to avoid per-request
// DB round-trips under normal load).
const SESSION_CACHE_TTL_SECONDS = 60;
const SESSION_CACHE_VERSION = 'v1';

function sessionCacheKey(tokenHash: string): string {
  return `sess:${SESSION_CACHE_VERSION}:${tokenHash}`;
}

export type SessionContext = {
  sessionId: string;
  userId: string;
  roles: string[];
};

@Injectable()
export class SessionService {
  async createSession(params: {
    userId: string;
    ip?: string;
    userAgent?: string;
  }): Promise<{ rawToken: string; sessionId: string }> {
    const token = randomToken();
    const tokenHash = hashToken(token);
    const csrfToken = randomToken(32);
    const csrfHash = hashToken(csrfToken);

    const now = Date.now();
    const expiresAt = new Date(now + authConfig.sessionTtlSeconds * 1000);
    const idleExpiresAt = new Date(now + authConfig.sessionIdleTtlSeconds * 1000);

    const session = await prisma.session.create({
      data: {
        userId: params.userId,
        sessionTokenHash: tokenHash,
        csrfSecretHash: csrfHash,
        expiresAt,
        idleExpiresAt,
        createdByIp: params.ip,
        createdByUserAgentHash: hashUserAgent(params.userAgent),
      },
      select: { id: true },
    });

    return { rawToken: token, sessionId: session.id };
  }

  async validateSession(rawToken: string): Promise<SessionContext> {
    const tokenHash = hashToken(rawToken);
    const cacheKey = sessionCacheKey(tokenHash);

    // ── L1: Redis cache ──────────────────────────────────────────────────────
    // Avoids a DB round-trip on every authenticated request.
    // Cache is invalidated immediately on revocation.
    try {
      const redis = getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        const ctx = JSON.parse(cached) as SessionContext;
        // Update lastSeenAt async — don't block the request on it
        void prisma.session
          .updateMany({
            where: { sessionTokenHash: tokenHash, revokedAt: null },
            data: { lastSeenAt: new Date() },
          })
          .catch(() => {});
        return ctx;
      }
    } catch {
      // Redis unavailable — fall through to DB
    }

    // ── L2: DB lookup ────────────────────────────────────────────────────────
    const session = await prisma.session.findUnique({
      where: { sessionTokenHash: tokenHash },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session not found');
    }

    if (!session.user || session.user.status !== 'active' || session.user.deletedAt) {
      throw new UnauthorizedException('Session not found');
    }

    const now = new Date();
    if (session.expiresAt <= now || session.idleExpiresAt <= now) {
      await prisma.session.update({
        where: { id: session.id },
        data: {
          revokedAt: now,
          revokeReason: 'expired',
        },
      });
      throw new UnauthorizedException('Session expired');
    }

    await prisma.session.update({
      where: { id: session.id },
      data: {
        lastSeenAt: now,
        idleExpiresAt: new Date(Date.now() + authConfig.sessionIdleTtlSeconds * 1000),
      },
    });

    const ctx: SessionContext = {
      sessionId: session.id,
      userId: session.userId,
      roles: session.user.roles.map((item) => item.role.name),
    };

    // Cache the validated context for subsequent requests
    try {
      const redis = getRedisClient();
      await redis.set(cacheKey, JSON.stringify(ctx), 'EX', SESSION_CACHE_TTL_SECONDS);
    } catch {
      // Non-fatal — next request will re-validate from DB
    }

    return ctx;
  }

  async revokeSession(rawToken: string, reason = 'logout'): Promise<void> {
    if (!rawToken) return;
    const tokenHash = hashToken(rawToken);
    // Evict from cache immediately so subsequent requests re-validate from DB
    try {
      await getRedisClient().del(sessionCacheKey(tokenHash));
    } catch { /* non-fatal */ }
    await prisma.session.updateMany({
      where: {
        sessionTokenHash: tokenHash,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
  }

  async revokeAllUserSessions(userId: string, reason = 'security_event'): Promise<void> {
    // Capture token hashes first so we can evict the Redis cache after revoking —
    // otherwise a "sign out everywhere" would leave sessions valid for up to the
    // cache TTL (60s).
    const sessions = await prisma.session.findMany({
      where: { userId, revokedAt: null },
      select: { sessionTokenHash: true },
    });

    await prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });

    await this.evictCachedSessions(sessions.map((s) => s.sessionTokenHash));
  }

  /**
   * Revoke a specific session by its ID.
   * Only revokes if the session belongs to the given userId (prevents IDOR).
   */
  async revokeSessionById(sessionId: string, userId: string, reason = 'user_revoked'): Promise<void> {
    // Ownership check (id + userId) prevents users from revoking others' sessions.
    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId, revokedAt: null },
      select: { sessionTokenHash: true },
    });
    if (!session) return;

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });

    await this.evictCachedSessions([session.sessionTokenHash]);
  }

  /** Delete cached session contexts by token hash so revocation takes effect immediately. */
  private async evictCachedSessions(tokenHashes: string[]): Promise<void> {
    if (tokenHashes.length === 0) return;
    try {
      const redis = getRedisClient();
      await Promise.all(tokenHashes.map((h) => redis.del(sessionCacheKey(h))));
    } catch {
      /* non-fatal — DB revocation stands; cache entries expire within the TTL */
    }
  }

  /**
   * Return a user's active (non-revoked, non-expired) sessions for device accountability.
   * Never returns the raw token or its hash.
   */
  async listUserSessions(userId: string): Promise<
    Array<{
      id: string;
      createdAt: Date;
      expiresAt: Date;
      idleExpiresAt: Date;
      lastSeenAt: Date | null;
      createdByIp: string | null;
      userAgentHash: string | null;
    }>
  > {
    const now = new Date();
    return prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        idleExpiresAt: true,
        lastSeenAt: true,
        createdByIp: true,
        createdByUserAgentHash: true,
      },
      orderBy: { lastSeenAt: 'desc' },
    }).then((rows) =>
      rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        expiresAt: r.expiresAt,
        idleExpiresAt: r.idleExpiresAt,
        lastSeenAt: r.lastSeenAt,
        createdByIp: r.createdByIp ?? null,
        userAgentHash: r.createdByUserAgentHash ?? null,
      }))
    );
  }
}
