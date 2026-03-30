import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { authConfig } from '../../config/auth';
import crypto from 'crypto';

// jsonwebtoken is available at runtime; keep typing local to avoid extra @types dependency
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt = require('jsonwebtoken') as {
  sign: (payload: object, secret: string, options: { expiresIn: string }) => string;
};

type RefreshRecord = { userId: string; expiresAt: number };

const refreshStore = new Map<string, RefreshRecord>();

@Injectable()
export class AuthService {
  // Very small demo implementation for dev: validate password === 'demo123'
  // Produces a short-lived access JWT and a server-stored refresh token.
  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: { id: string; email?: string } }> {
    if (!dto?.email || !dto?.password) {
      throw new UnauthorizedException('Missing credentials');
    }

    // Demo credential check - replace with DB lookup in production
    if (dto.password !== 'demo123') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userId = dto.email; // demo: use email as user id

    const accessToken = jwt.sign({ sub: userId, email: dto.email }, authConfig.jwtSecret, {
      expiresIn: authConfig.jwtExpiresIn,
    });

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = Date.now() + authConfig.sessionTtlSeconds * 1000;
    refreshStore.set(refreshToken, { userId, expiresAt });

    return { accessToken, refreshToken, user: { id: userId, email: dto.email } };
  }

  async register(_dto: RegisterDto): Promise<{ userId: string }> {
    // Out of scope for demo; create user in DB here
    const id = crypto.randomUUID();
    return { userId: id };
  }

  async logout(sessionId?: string): Promise<void> {
    if (!sessionId) return;
    // sessionId is expected to be the refresh token value in this demo
    refreshStore.delete(sessionId);
  }

  async refresh(token: string): Promise<{ accessToken: string; refreshToken?: string; user?: { id: string } }> {
    if (!token) throw new UnauthorizedException('Missing refresh token');

    const record = refreshStore.get(token);
    if (!record) throw new UnauthorizedException('Invalid refresh token');
    if (record.expiresAt < Date.now()) {
      refreshStore.delete(token);
      throw new UnauthorizedException('Refresh token expired');
    }

    // rotate refresh token
    refreshStore.delete(token);
    const newRefresh = crypto.randomBytes(48).toString('hex');
    const expiresAt = Date.now() + authConfig.sessionTtlSeconds * 1000;
    refreshStore.set(newRefresh, { userId: record.userId, expiresAt });

    const accessToken = jwt.sign({ sub: record.userId }, authConfig.jwtSecret, {
      expiresIn: authConfig.jwtExpiresIn,
    });

    return { accessToken, refreshToken: newRefresh, user: { id: record.userId } };
  }
}
