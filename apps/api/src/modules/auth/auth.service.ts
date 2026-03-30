import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { authConfig } from '../../config/auth';
import crypto from 'crypto';
import { prisma } from '@careloop/db';

// jsonwebtoken is available at runtime; keep typing local to avoid extra @types dependency
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jwt = require('jsonwebtoken') as {
  sign: (payload: object, secret: string, options: { expiresIn: string }) => string;
};

type DbAuthUser = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
};

type CountRow = { count: bigint | number };

type AdminOverview = {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    leftThisMonth: number;
    monthlyGrowthPct: number;
  };
  patients: {
    total: number;
    newThisMonth: number;
  };
  appointments: {
    thisMonth: number;
    completedThisMonth: number;
    completionRatePct: number;
  };
  activity: {
    transcriptsThisMonth: number;
    conversationsThisMonth: number;
  };
};

function toNumber(value: bigint | number): number {
  return typeof value === 'bigint' ? Number(value) : value;
}

function monthStartFor(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
}

function monthEndExclusive(start: Date): Date {
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1, 0, 0, 0, 0));
}

function pctChange(current: number, previous: number): number {
  if (previous <= 0 && current <= 0) return 0;
  if (previous <= 0) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const digest = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${digest}`;
}

function verifyPassword(password: string, encoded: string): boolean {
  const [algo, salt, digest] = encoded.split('$');
  if (algo !== 'scrypt' || !salt || !digest) return false;

  const incoming = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(digest, 'hex');
  if (incoming.length !== stored.length) return false;
  return crypto.timingSafeEqual(incoming, stored);
}

@Injectable()
export class AuthService {
  private tablesReady = false;
  private dbAvailable = true;
  private readonly memoryUsers = new Map<
    string,
    {
      id: string;
      email: string;
      passwordHash: string;
      role: string;
      firstName: string;
      lastName: string;
      joinedAt: Date;
      leftAt: Date | null;
      isActive: boolean;
    }
  >();
  private readonly memorySessions = new Map<string, { userId: string; expiresAt: number }>();

  private getSeedAdmin() {
    return {
      id: process.env.AUTH_ADMIN_ID ?? 'auth-admin-seed',
      email: process.env.AUTH_ADMIN_EMAIL ?? 'admin@demo.careloop',
      password: process.env.AUTH_ADMIN_PASSWORD ?? 'demo123',
      firstName: process.env.AUTH_ADMIN_FIRST_NAME ?? 'Admin',
      lastName: process.env.AUTH_ADMIN_LAST_NAME ?? 'CareLoop',
    };
  }

  private ensureMemorySeed(): void {
    const seed = this.getSeedAdmin();
    if (this.memoryUsers.has(seed.email)) return;
    this.memoryUsers.set(seed.email, {
      id: seed.id,
      email: seed.email,
      passwordHash: hashPassword(seed.password),
      role: 'admin',
      firstName: seed.firstName,
      lastName: seed.lastName,
      joinedAt: new Date(),
      leftAt: null,
      isActive: true,
    });
  }

  private async ensureAuthTables(): Promise<void> {
    if (this.tablesReady) return;

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS auth_credentials (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin',
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          left_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS auth_sessions (
          token TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await prisma.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS idx_auth_credentials_joined_at ON auth_credentials(joined_at);'
      );
      await prisma.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS idx_auth_credentials_left_at ON auth_credentials(left_at);'
      );
      await prisma.$executeRawUnsafe(
        'CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);'
      );

      const seed = this.getSeedAdmin();
      const passwordHash = hashPassword(seed.password);

      await prisma.$executeRaw`
        INSERT INTO auth_credentials (id, email, password_hash, role, first_name, last_name, is_active)
        VALUES (${seed.id}, ${seed.email}, ${passwordHash}, 'admin', ${seed.firstName}, ${seed.lastName}, TRUE)
        ON CONFLICT (email) DO NOTHING;
      `;

      this.dbAvailable = true;
      this.tablesReady = true;
    } catch {
      // Keep auth available in development even if database credentials/tables are unavailable.
      this.dbAvailable = false;
      this.tablesReady = true;
      this.ensureMemorySeed();
    }
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: { id: string; email?: string } }> {
    if (!dto?.email || !dto?.password) {
      throw new UnauthorizedException('Missing credentials');
    }

    await this.ensureAuthTables();

    if (!this.dbAvailable) {
      const account = this.memoryUsers.get(dto.email);
      if (!account || !account.isActive || !verifyPassword(dto.password, account.passwordHash)) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const accessToken = jwt.sign(
        {
          sub: account.id,
          email: account.email,
          role: account.role,
          firstName: account.firstName,
          lastName: account.lastName,
        },
        authConfig.jwtSecret,
        { expiresIn: authConfig.jwtExpiresIn }
      );

      const refreshToken = crypto.randomBytes(48).toString('hex');
      this.memorySessions.set(refreshToken, {
        userId: account.id,
        expiresAt: Date.now() + authConfig.sessionTtlSeconds * 1000,
      });

      return {
        accessToken,
        refreshToken,
        user: {
          id: account.id,
          email: account.email,
          role: account.role,
          firstName: account.firstName,
          lastName: account.lastName,
        } as any,
      };
    }

    const rows = await prisma.$queryRaw<DbAuthUser[]>`
      SELECT id, email, password_hash, role, first_name, last_name, is_active
      FROM auth_credentials
      WHERE email = ${dto.email}
      LIMIT 1;
    `;

    const account = rows[0];
    if (!account || !account.is_active || !verifyPassword(dto.password, account.password_hash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (account.role !== 'admin') {
      throw new UnauthorizedException('Admin account required');
    }

    const userId = account.id;

    const accessToken = jwt.sign(
      {
        sub: userId,
        email: account.email,
        role: account.role,
        firstName: account.first_name,
        lastName: account.last_name,
      },
      authConfig.jwtSecret,
      {
      expiresIn: authConfig.jwtExpiresIn,
      }
    );

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const expiresAt = Date.now() + authConfig.sessionTtlSeconds * 1000;

    await prisma.$executeRaw`
      INSERT INTO auth_sessions (token, user_id, expires_at)
      VALUES (${refreshToken}, ${userId}, ${new Date(expiresAt)});
    `;

    return {
      accessToken,
      refreshToken,
      user: {
        id: account.id,
        email: account.email,
        role: account.role,
        firstName: account.first_name,
        lastName: account.last_name,
      } as any,
    };
  }

  async register(_dto: RegisterDto): Promise<{ userId: string }> {
    // Out of scope for demo; create user in DB here
    const id = crypto.randomUUID();
    return { userId: id };
  }

  async logout(sessionId?: string): Promise<void> {
    if (!sessionId) return;
    await this.ensureAuthTables();
    if (!this.dbAvailable) {
      this.memorySessions.delete(sessionId);
      return;
    }
    await prisma.$executeRaw`DELETE FROM auth_sessions WHERE token = ${sessionId};`;
  }

  async refresh(token: string): Promise<{ accessToken: string; refreshToken?: string; user?: { id: string } }> {
    if (!token) throw new UnauthorizedException('Missing refresh token');

    await this.ensureAuthTables();

    if (!this.dbAvailable) {
      const record = this.memorySessions.get(token);
      if (!record) throw new UnauthorizedException('Invalid refresh token');
      if (record.expiresAt < Date.now()) {
        this.memorySessions.delete(token);
        throw new UnauthorizedException('Refresh token expired');
      }

      const account = Array.from(this.memoryUsers.values()).find((u) => u.id === record.userId);
      if (!account) {
        this.memorySessions.delete(token);
        throw new UnauthorizedException('Account no longer exists');
      }

      this.memorySessions.delete(token);
      const newRefresh = crypto.randomBytes(48).toString('hex');
      this.memorySessions.set(newRefresh, {
        userId: account.id,
        expiresAt: Date.now() + authConfig.sessionTtlSeconds * 1000,
      });

      const accessToken = jwt.sign(
        {
          sub: account.id,
          email: account.email,
          role: account.role,
          firstName: account.firstName,
          lastName: account.lastName,
        },
        authConfig.jwtSecret,
        { expiresIn: authConfig.jwtExpiresIn }
      );

      return {
        accessToken,
        refreshToken: newRefresh,
        user: {
          id: account.id,
          email: account.email,
          role: account.role,
          firstName: account.firstName,
          lastName: account.lastName,
        } as any,
      };
    }

    const rows = await prisma.$queryRaw<Array<{ token: string; user_id: string; expires_at: Date }>>`
      SELECT token, user_id, expires_at
      FROM auth_sessions
      WHERE token = ${token}
      LIMIT 1;
    `;

    const record = rows[0];
    if (!record) throw new UnauthorizedException('Invalid refresh token');
    if (new Date(record.expires_at).getTime() < Date.now()) {
      await prisma.$executeRaw`DELETE FROM auth_sessions WHERE token = ${token};`;
      throw new UnauthorizedException('Refresh token expired');
    }

    const userRows = await prisma.$queryRaw<Array<{ id: string; email: string; role: string; first_name: string; last_name: string }>>`
      SELECT id, email, role, first_name, last_name
      FROM auth_credentials
      WHERE id = ${record.user_id}
      LIMIT 1;
    `;
    const user = userRows[0];
    if (!user) {
      await prisma.$executeRaw`DELETE FROM auth_sessions WHERE token = ${token};`;
      throw new UnauthorizedException('Account no longer exists');
    }

    const newRefresh = crypto.randomBytes(48).toString('hex');
    const expiresAt = Date.now() + authConfig.sessionTtlSeconds * 1000;

    await prisma.$executeRaw`
      DELETE FROM auth_sessions
      WHERE token = ${token};
    `;

    await prisma.$executeRaw`
      INSERT INTO auth_sessions (token, user_id, expires_at)
      VALUES (${newRefresh}, ${record.user_id}, ${new Date(expiresAt)});
    `;

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      authConfig.jwtSecret,
      {
        expiresIn: authConfig.jwtExpiresIn,
      }
    );

    return {
      accessToken,
      refreshToken: newRefresh,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      } as any,
    };
  }

  async getAdminOverview(practiceId = 'demo-practice'): Promise<AdminOverview> {
    await this.ensureAuthTables();

    if (!this.dbAvailable) {
      const users = Array.from(this.memoryUsers.values());
      return {
        users: {
          total: users.length,
          active: users.filter((u) => u.isActive && !u.leftAt).length,
          newThisMonth: users.length,
          leftThisMonth: users.filter((u) => u.leftAt).length,
          monthlyGrowthPct: 0,
        },
        patients: { total: 0, newThisMonth: 0 },
        appointments: { thisMonth: 0, completedThisMonth: 0, completionRatePct: 0 },
        activity: { transcriptsThisMonth: 0, conversationsThisMonth: 0 },
      };
    }

    const now = new Date();
    const currentMonthStart = monthStartFor(now);
    const nextMonthStart = monthEndExclusive(currentMonthStart);
    const previousMonthStart = monthStartFor(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    );

    const [
      totalUsersRow,
      activeUsersRow,
      joinedCurrentRow,
      joinedPreviousRow,
      leftCurrentRow,
      patientTotal,
      patientNewThisMonth,
      appointmentThisMonth,
      appointmentCompletedThisMonth,
      transcriptsThisMonth,
      conversationsThisMonth,
    ] = await Promise.all([
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint AS count FROM auth_credentials`,
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::bigint AS count
        FROM auth_credentials
        WHERE is_active = TRUE AND (left_at IS NULL OR left_at > NOW())
      `,
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::bigint AS count
        FROM auth_credentials
        WHERE joined_at >= ${currentMonthStart} AND joined_at < ${nextMonthStart}
      `,
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::bigint AS count
        FROM auth_credentials
        WHERE joined_at >= ${previousMonthStart} AND joined_at < ${currentMonthStart}
      `,
      prisma.$queryRaw<CountRow[]>`
        SELECT COUNT(*)::bigint AS count
        FROM auth_credentials
        WHERE left_at IS NOT NULL AND left_at >= ${currentMonthStart} AND left_at < ${nextMonthStart}
      `,
      prisma.patient.count({ where: { practiceId } }),
      prisma.patient.count({ where: { practiceId, createdAt: { gte: currentMonthStart, lt: nextMonthStart } } }),
      prisma.appointment.count({ where: { practiceId, start: { gte: currentMonthStart, lt: nextMonthStart } } }),
      prisma.appointment.count({
        where: {
          practiceId,
          start: { gte: currentMonthStart, lt: nextMonthStart },
          status: { in: ['completed'] },
        },
      }),
      prisma.callTranscript.count({ where: { practiceId, createdAt: { gte: currentMonthStart, lt: nextMonthStart } } }),
      prisma.conversation.count({ where: { practiceId, createdAt: { gte: currentMonthStart, lt: nextMonthStart } } }),
    ]);

    const totalUsers = toNumber(totalUsersRow[0]?.count ?? 0);
    const activeUsers = toNumber(activeUsersRow[0]?.count ?? 0);
    const joinedCurrent = toNumber(joinedCurrentRow[0]?.count ?? 0);
    const joinedPrevious = toNumber(joinedPreviousRow[0]?.count ?? 0);
    const leftCurrent = toNumber(leftCurrentRow[0]?.count ?? 0);
    const completionRate = appointmentThisMonth > 0
      ? Number(((appointmentCompletedThisMonth / appointmentThisMonth) * 100).toFixed(2))
      : 0;

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: joinedCurrent,
        leftThisMonth: leftCurrent,
        monthlyGrowthPct: pctChange(joinedCurrent, joinedPrevious),
      },
      patients: {
        total: patientTotal,
        newThisMonth: patientNewThisMonth,
      },
      appointments: {
        thisMonth: appointmentThisMonth,
        completedThisMonth: appointmentCompletedThisMonth,
        completionRatePct: completionRate,
      },
      activity: {
        transcriptsThisMonth,
        conversationsThisMonth,
      },
    };
  }
}
