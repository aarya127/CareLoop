<<<<<<< HEAD
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@careloop/db';
import { authConfig } from '../../config/auth';
import { hashToken, hashUserAgent, randomToken } from './auth.utils';

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

    return {
      sessionId: session.id,
      userId: session.userId,
      roles: session.user.roles.map((item) => item.role.name),
    };
  }

  async revokeSession(rawToken: string, reason = 'logout'): Promise<void> {
    if (!rawToken) return;
    const tokenHash = hashToken(rawToken);
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
    await prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: reason,
      },
=======
import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { prisma } from '../../config/database';

/** 8 hours — rolling window resets on each validated request */
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export const SESSION_COOKIE = 'cl_session';

@Injectable()
export class SessionService {
  async create(
    userId: string,
    meta: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await prisma.session.create({
      data: { userId, token, expiresAt, ...meta },
    });

    return token;
  }

  async validate(token: string) {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      return null;
    }

    // Rolling refresh: extend expiry on each valid use
    await prisma.session.update({
      where: { id: session.id },
      data: {
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });

    return session;
  }

  async revoke(token: string): Promise<void> {
    await prisma.session.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
>>>>>>> auth
    });
  }
}
