import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, prisma } from '@careloop/db';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import { AUTH_ERRORS, AUTH_LIMITS, AUTH_ROLES } from './auth.constants';
import { hashPassword, verifyPassword } from './auth.utils';
import { SessionService } from './session.service';

type SafeUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
};

type LoginResult = {
  sessionToken: string;
  user: SafeUser;
};

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

type RateLimitRecord = {
  attempts: number;
  windowStartMs: number;
  lockedUntilMs: number;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly ipRateLimit = new Map<string, RateLimitRecord>();
  private readonly accountRateLimit = new Map<string, RateLimitRecord>();

  constructor(@Inject(SessionService) private readonly sessionService: SessionService) {}

  private monthStartFor(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0));
  }

  private monthEndExclusive(start: Date): Date {
    return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  }

  private pctChange(current: number, previous: number): number {
    if (previous <= 0 && current <= 0) return 0;
    if (previous <= 0) return 100;
    return Number((((current - previous) / previous) * 100).toFixed(2));
  }

  private nowMs(): number {
    return Date.now();
  }

  private getOrInitRecord(store: Map<string, RateLimitRecord>, key: string): RateLimitRecord {
    const existing = store.get(key);
    if (existing) return existing;

    const created: RateLimitRecord = {
      attempts: 0,
      windowStartMs: this.nowMs(),
      lockedUntilMs: 0,
    };
    store.set(key, created);
    return created;
  }

  private enforceRateLimit(
    store: Map<string, RateLimitRecord>,
    key: string,
    windowMs: number,
    maxAttempts: number
  ): void {
    const now = this.nowMs();
    const record = this.getOrInitRecord(store, key);

    if (record.lockedUntilMs > now) {
      throw new HttpException(AUTH_ERRORS.ACCOUNT_LOCKED, HttpStatus.TOO_MANY_REQUESTS);
    }

    if (now - record.windowStartMs > windowMs) {
      record.windowStartMs = now;
      record.attempts = 0;
    }

    if (record.attempts >= maxAttempts) {
      const multiplier = Math.max(1, record.attempts - maxAttempts + 1);
      const backoffMs = Math.min(15 * 60 * 1000, multiplier * 60 * 1000);
      record.lockedUntilMs = now + backoffMs;
      throw new HttpException(AUTH_ERRORS.ACCOUNT_LOCKED, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private registerFailure(
    store: Map<string, RateLimitRecord>,
    key: string,
    windowMs: number
  ): void {
    const now = this.nowMs();
    const record = this.getOrInitRecord(store, key);

    if (now - record.windowStartMs > windowMs) {
      record.windowStartMs = now;
      record.attempts = 0;
    }

    record.attempts += 1;
  }

  private clearRateLimit(store: Map<string, RateLimitRecord>, key: string): void {
    store.delete(key);
  }

  private async addAuditLog(params: {
    eventType: string;
    outcome: 'success' | 'failure';
    actorUserId?: string;
    targetUserId?: string;
    sessionId?: string;
    ip?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          eventType: params.eventType,
          outcome: params.outcome,
          actorUserId: params.actorUserId,
          targetUserId: params.targetUserId,
          sessionId: params.sessionId,
          ip: params.ip,
          userAgentHash: params.userAgent,
          authMethod: 'password',
          metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      this.logger.warn(`Audit write failed for event ${params.eventType}`);
      this.logger.debug(error);
    }
  }

  private rethrowMappedAuthError(error: unknown): never {
    if (error instanceof HttpException) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2021' || error.code === 'P2022') {
        throw new HttpException(
          'Authentication backend is not initialized. Run database migrations for auth tables.',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }
    }

    throw error;
  }

  private async getUserRoles(userId: string): Promise<string[]> {
    const rows = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return rows.map((row) => row.role.name);
  }

  private async toSafeUser(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const roles = await this.getUserRoles(userId);
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? 'CareLoop',
      lastName: user.lastName ?? 'User',
      roles,
    };
  }

  async login(dto: LoginDto, context: { ip?: string; userAgent?: string }): Promise<LoginResult> {
    try {
      const email = dto.email.trim().toLowerCase();
      const ipKey = context.ip ?? 'unknown-ip';

      this.enforceRateLimit(
        this.ipRateLimit,
        ipKey,
        AUTH_LIMITS.LOGIN_IP_WINDOW_MS,
        AUTH_LIMITS.LOGIN_IP_MAX_ATTEMPTS
      );
      this.enforceRateLimit(
        this.accountRateLimit,
        email,
        AUTH_LIMITS.LOGIN_ACCOUNT_WINDOW_MS,
        AUTH_LIMITS.LOGIN_ACCOUNT_MAX_ATTEMPTS
      );

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          status: true,
          lockedUntil: true,
        },
      });

      if (!user?.passwordHash || user.status !== 'active') {
        this.registerFailure(this.ipRateLimit, ipKey, AUTH_LIMITS.LOGIN_IP_WINDOW_MS);
        this.registerFailure(this.accountRateLimit, email, AUTH_LIMITS.LOGIN_ACCOUNT_WINDOW_MS);
        await this.addAuditLog({
          eventType: 'login_failed',
          outcome: 'failure',
          ip: context.ip,
          userAgent: context.userAgent,
          metadata: { email },
        });
        throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
      }

      if (user.lockedUntil && user.lockedUntil.getTime() > this.nowMs()) {
        throw new HttpException(AUTH_ERRORS.ACCOUNT_LOCKED, HttpStatus.TOO_MANY_REQUESTS);
      }

      const valid = await verifyPassword(dto.password, user.passwordHash);
      if (!valid) {
        this.registerFailure(this.ipRateLimit, ipKey, AUTH_LIMITS.LOGIN_IP_WINDOW_MS);
        this.registerFailure(this.accountRateLimit, email, AUTH_LIMITS.LOGIN_ACCOUNT_WINDOW_MS);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: { increment: 1 },
            lockedUntil: new Date(this.nowMs() + 60 * 1000),
          },
        });

        await this.addAuditLog({
          eventType: 'login_failed',
          outcome: 'failure',
          targetUserId: user.id,
          ip: context.ip,
          userAgent: context.userAgent,
        });

        throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
      }

      this.clearRateLimit(this.ipRateLimit, ipKey);
      this.clearRateLimit(this.accountRateLimit, email);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      });

      const { rawToken, sessionId } = await this.sessionService.createSession({
        userId: user.id,
        ip: context.ip,
        userAgent: context.userAgent,
      });

      await this.addAuditLog({
        eventType: 'login_success',
        outcome: 'success',
        actorUserId: user.id,
        targetUserId: user.id,
        sessionId,
        ip: context.ip,
        userAgent: context.userAgent,
      });

      return {
        sessionToken: rawToken,
        user: await this.toSafeUser(user.id),
      };
    } catch (error) {
      this.rethrowMappedAuthError(error);
    }
  }

  async logout(sessionToken: string | undefined, context: { userId?: string; ip?: string; userAgent?: string }): Promise<void> {
    if (!sessionToken) return;

    await this.sessionService.revokeSession(sessionToken, 'logout');

    await this.addAuditLog({
      eventType: 'logout',
      outcome: 'success',
      actorUserId: context.userId,
      targetUserId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
    });
  }

  async getSession(sessionToken: string | undefined): Promise<{ user: SafeUser } | null> {
    if (!sessionToken) return null;

    const session = await this.sessionService.validateSession(sessionToken);
    const user = await this.toSafeUser(session.userId);
    return { user };
  }

  async register(dto: RegisterDto): Promise<{ userId: string }> {
    const email = dto.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    if (existing) {
      throw new ForbiddenException('User already exists');
    }

    const roleName = (dto.role ?? AUTH_ROLES.STAFF).trim().toLowerCase();

    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `${roleName} role`,
      },
      select: { id: true },
    });

    const passwordHash = await hashPassword(dto.password);

    const user = await prisma.user.create({
      data: {
        email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        passwordAlgo: 'bcrypt',
        practiceId: dto.practiceId,
        status: 'active',
      },
      select: { id: true },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: role.id,
      },
    });

    await this.addAuditLog({
      eventType: 'register_user',
      outcome: 'success',
      actorUserId: user.id,
      targetUserId: user.id,
      metadata: { roleName },
    });

    return { userId: user.id };
  }

  async getAdminOverview(practiceId = 'demo-practice'): Promise<AdminOverview> {
    const now = new Date();
    const currentMonthStart = this.monthStartFor(now);
    const nextMonthStart = this.monthEndExclusive(currentMonthStart);
    const previousMonthStart = this.monthStartFor(
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    );

    const [
      totalUsers,
      activeUsers,
      joinedCurrent,
      joinedPrevious,
      leftCurrent,
      patientTotal,
      patientNewThisMonth,
      appointmentThisMonth,
      appointmentCompletedThisMonth,
      transcriptsThisMonth,
      conversationsThisMonth,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          status: 'active',
          OR: [{ deletedAt: null }, { deletedAt: { gt: new Date() } }],
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: currentMonthStart, lt: nextMonthStart },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: previousMonthStart, lt: currentMonthStart },
        },
      }),
      prisma.user.count({
        where: {
          deletedAt: { gte: currentMonthStart, lt: nextMonthStart },
        },
      }),
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

    const completionRate = appointmentThisMonth > 0
      ? Number(((appointmentCompletedThisMonth / appointmentThisMonth) * 100).toFixed(2))
      : 0;

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: joinedCurrent,
        leftThisMonth: leftCurrent,
        monthlyGrowthPct: this.pctChange(joinedCurrent, joinedPrevious),
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
