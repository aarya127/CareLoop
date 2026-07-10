import {
  ConflictException,
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
import type { SignupDto } from './dto/signup.dto';
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
    leftReasons: Array<{ reason: string; count: number }>;
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

export interface AuthUser {
  id: string;
  email: string;
  /** Primary role, kept for display/back-compat. Authorization uses `roles`. */
  role: string;
  /** All roles assigned to the user — the full set used for RBAC checks. */
  roles: string[];
  firstName: string;
  lastName: string;
  practiceId: string;
}

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
      const email = (dto?.email ?? '').trim().toLowerCase();
      if (!email) {
        throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
      }
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
          failedLoginCount: true,
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

        // Only lock the account after N consecutive failures (not on a single
        // typo). Locking-before-password-check means a lock would otherwise
        // reject the correct password too, so keep the threshold meaningful.
        const nextCount = (user.failedLoginCount ?? 0) + 1;
        const shouldLock = nextCount >= AUTH_LIMITS.LOGIN_ACCOUNT_MAX_ATTEMPTS;
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginCount: shouldLock ? 0 : nextCount,
            lockedUntil: shouldLock ? new Date(this.nowMs() + 60 * 1000) : null,
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

  /**
   * Self-serve organization signup: atomically creates a new Practice + its first
   * admin User, then issues a session (same result shape as login). Public, so the
   * controller rate-limits it. The new user is the admin of a brand-new, isolated
   * practice — there is no cross-tenant exposure.
   */
  async signup(dto: SignupDto, context: { ip?: string; userAgent?: string }): Promise<LoginResult> {
    const email = dto.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await hashPassword(dto.password);

    // Practice + admin role + user + role assignment must all succeed together —
    // never leave an orphan practice with no admin.
    const { userId, practiceId } = await prisma.$transaction(async (tx) => {
      const practice = await tx.practice.create({
        data: {
          name: dto.practiceName.trim(),
          timeZone: dto.timeZone?.trim() || 'America/New_York',
        },
        select: { id: true },
      });

      const role = await tx.role.upsert({
        where: { name: AUTH_ROLES.ADMIN },
        update: {},
        create: { name: AUTH_ROLES.ADMIN, description: 'admin role' },
        select: { id: true },
      });

      const user = await tx.user.create({
        data: {
          email,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          passwordHash,
          passwordAlgo: 'bcrypt',
          practiceId: practice.id,
          status: 'active',
        },
        select: { id: true },
      });

      await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });

      return { userId: user.id, practiceId: practice.id };
    });

    const { rawToken, sessionId } = await this.sessionService.createSession({
      userId,
      ip: context.ip,
      userAgent: context.userAgent,
    });

    await this.addAuditLog({
      eventType: 'signup',
      outcome: 'success',
      actorUserId: userId,
      targetUserId: userId,
      sessionId,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { practiceId },
    });

    return { sessionToken: rawToken, user: await this.toSafeUser(userId) };
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

  async getAdminOverview(practiceId: string): Promise<AdminOverview> {
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
      leftUsers,
      patientTotal,
      patientNewThisMonth,
      appointmentThisMonth,
      appointmentCompletedThisMonth,
      transcriptsThisMonth,
      conversationsThisMonth,
    ] = await Promise.all([
      prisma.user.count({ where: { practiceId } }),
      prisma.user.count({
        where: {
          practiceId,
          status: 'active',
          deletedAt: null,
        },
      }),
      prisma.user.count({
        where: {
          practiceId,
          createdAt: { gte: currentMonthStart, lt: nextMonthStart },
        },
      }),
      prisma.user.count({
        where: {
          practiceId,
          createdAt: { gte: previousMonthStart, lt: currentMonthStart },
        },
      }),
      prisma.user.count({
        where: {
          practiceId,
          deletedAt: { gte: currentMonthStart, lt: nextMonthStart },
        },
      }),
      prisma.user.findMany({
        where: {
          practiceId,
          deletedAt: { gte: currentMonthStart, lt: nextMonthStart },
        },
        select: {
          deletedReason: true,
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
        leftReasons: this.countRemovalReasons(leftUsers),
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

  private countRemovalReasons(users: Array<{ deletedReason: string | null }>) {
    const reasonCounts = new Map<string, number>();

    for (const user of users) {
      const reason = user.deletedReason?.trim() || 'Not provided';
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    }

    return Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((left, right) => right.count - left.count);
  }

  async validateSession(token: string): Promise<{ user: AuthUser; sessionId: string } | null> {
    try {
      const session = await this.sessionService.validateSession(token);
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, email: true, firstName: true, lastName: true, practiceId: true },
      });
      if (!user) return null;
      return {
        user: {
          id: user.id,
          email: user.email,
          role: session.roles[0] ?? 'STAFF',
          roles: session.roles.length > 0 ? session.roles : ['STAFF'],
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          practiceId: user.practiceId,
        },
        sessionId: session.sessionId,
      };
    } catch {
      return null;
    }
  }
}
