import { Injectable, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@careloop/db';
import { authConfig } from '../../config/auth';
import { hashToken, hashUserAgent, randomToken } from '../auth/auth.utils';
import { getRedisClient } from '../../config/redis';

// Parallel to ../auth/session.service.ts, but for the patient-portal principal —
// deliberately NOT a modification of that file (see patient-auth.guard.ts for why
// the two principal types are kept structurally separate). Own Redis namespace
// ("psess:") and own cookie (PATIENT_SESSION_COOKIE) so a patient session can
// never be read as a staff one or vice versa.
const PATIENT_SESSION_CACHE_TTL_SECONDS = 60;
const PATIENT_SESSION_CACHE_VERSION = 'v1';

function patientSessionCacheKey(tokenHash: string): string {
  return `psess:${PATIENT_SESSION_CACHE_VERSION}:${tokenHash}`;
}

export type PatientSessionContext = {
  sessionId: string;
  patientId: string;
  practiceId: string;
};

@Injectable()
export class PatientSessionService {
  async createSession(params: {
    patientId: string;
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

    const session = await prisma.patientSession.create({
      data: {
        patientId: params.patientId,
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

  async validateSession(rawToken: string): Promise<PatientSessionContext> {
    const tokenHash = hashToken(rawToken);
    const cacheKey = patientSessionCacheKey(tokenHash);

    try {
      const redis = getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        const ctx = JSON.parse(cached) as PatientSessionContext;
        void prisma.patientSession
          .updateMany({
            where: { sessionTokenHash: tokenHash, revokedAt: null },
            data: {
              lastSeenAt: new Date(),
              idleExpiresAt: new Date(Date.now() + authConfig.sessionIdleTtlSeconds * 1000),
            },
          })
          .catch(() => {});
        return ctx;
      }
    } catch {
      // Redis unavailable — fall through to DB
    }

    const session = await prisma.patientSession.findUnique({
      where: { sessionTokenHash: tokenHash },
      include: { patient: { include: { portalCredential: true } } },
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session not found');
    }

    const credential = session.patient.portalCredential;
    if (!credential || credential.status !== 'active') {
      throw new UnauthorizedException('Session not found');
    }

    const now = new Date();
    if (session.expiresAt <= now || session.idleExpiresAt <= now) {
      await prisma.patientSession.update({
        where: { id: session.id },
        data: { revokedAt: now, revokeReason: 'expired' },
      });
      throw new UnauthorizedException('Session expired');
    }

    await prisma.patientSession.update({
      where: { id: session.id },
      data: {
        lastSeenAt: now,
        idleExpiresAt: new Date(Date.now() + authConfig.sessionIdleTtlSeconds * 1000),
      },
    });

    const ctx: PatientSessionContext = {
      sessionId: session.id,
      patientId: session.patientId,
      practiceId: credential.practiceId,
    };

    const remainingMs =
      Math.min(session.expiresAt.getTime(), session.idleExpiresAt.getTime()) - now.getTime();
    const cacheTtl = Math.max(
      0,
      Math.min(PATIENT_SESSION_CACHE_TTL_SECONDS, Math.floor(remainingMs / 1000)),
    );
    if (cacheTtl > 0) {
      try {
        const redis = getRedisClient();
        await redis.set(cacheKey, JSON.stringify(ctx), 'EX', cacheTtl);
      } catch {
        // Non-fatal — next request will re-validate from DB
      }
    }

    return ctx;
  }

  async revokeSession(rawToken: string, reason = 'logout'): Promise<void> {
    if (!rawToken) return;
    const tokenHash = hashToken(rawToken);
    try {
      await getRedisClient().del(patientSessionCacheKey(tokenHash));
    } catch {
      /* non-fatal */
    }
    await prisma.patientSession.updateMany({
      where: { sessionTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
  }

  /**
   * Revoke every active session for a patient — used after a password reset so
   * a leaked old session can't survive it. Mirrors SessionService.revokeAllUserSessions.
   */
  async revokeAllPatientSessions(patientId: string, reason = 'security_event'): Promise<void> {
    const sessions = await prisma.patientSession.findMany({
      where: { patientId, revokedAt: null },
      select: { sessionTokenHash: true },
    });

    await prisma.patientSession.updateMany({
      where: { patientId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: reason },
    });

    try {
      const redis = getRedisClient();
      await Promise.all(sessions.map((s) => redis.del(patientSessionCacheKey(s.sessionTokenHash))));
    } catch {
      /* non-fatal — DB revocation stands; cache entries expire within the TTL */
    }
  }
}
