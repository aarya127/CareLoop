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
    });
  }
}
