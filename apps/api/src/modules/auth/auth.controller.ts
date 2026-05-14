import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { authConfig } from '../../config/auth';
import { AuthGuard, RequireRole, RolesGuard } from '../../common/guards';
import { AuthService } from './auth.service';
import { AUTH_ROLES } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public, CurrentUser } from '../../common/decorators';
import { SESSION_COOKIE, SessionService } from './session.service';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 8 * 60 * 60, // 8 hours in seconds
};

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(SessionService) private readonly sessionService: SessionService,
  ) {}

  private setSessionCookie(res: any, token: string): void {
    res.setCookie(authConfig.sessionCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: authConfig.cookieDomain,
      maxAge: authConfig.sessionTtlSeconds,
    });
  }

  private clearSessionCookie(res: any): void {
    res.setCookie(authConfig.sessionCookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      domain: authConfig.cookieDomain,
      expires: new Date(0),
      maxAge: 0,
    });
  }

  /** 10 attempts per minute per IP to prevent brute-force */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: any
  ) {
    const data = await this.authService.login(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.setCookie(SESSION_COOKIE, data.sessionToken, COOKIE_OPTS);

    return { user: data.user, sessionToken: data.sessionToken };
  }

  /**
   * Create a new user account. Requires an authenticated admin session.
   * This endpoint is intentionally NOT public — open self-registration is
   * disabled. Users are provisioned by an administrator or via an invite flow.
   */
  @RequireRole(AUTH_ROLES.ADMIN)
  @UseGuards(RolesGuard)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: any
  ) {
    const token = req.cookies?.[SESSION_COOKIE];

    await this.authService.logout(token, {
      userId: (req as any).user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    this.clearSessionCookie(res);
    return { ok: true };
  }

  @Get('me')
  async me(@Req() req: any) {
    // req.user is populated by SessionAuthGuard (accepts cookie OR Bearer token)
    if (req.user) return req.user;
    // fallback: re-validate from cookie (direct browser calls)
    const token = req.cookies?.[SESSION_COOKIE];
    const data = await this.authService.getSession(token);
    if (!data) throw new UnauthorizedException('No active session');
    return data.user;
  }

  @Get('session')
  async session(@Req() req: any) {
    if (req.user) return req.user;
    const token = req.cookies?.[SESSION_COOKIE];
    const data = await this.authService.getSession(token);
    if (!data) throw new UnauthorizedException('No active session');
    return data.user;
  }

  @Post('refresh')
  async refresh(
    @Req() req: any,
    @Res({ passthrough: true }) res: any
  ) {
    if (req.user) return { user: req.user };
    const token = req.cookies?.[SESSION_COOKIE];
    const data = await this.authService.getSession(token);
    if (!data) {
      this.clearSessionCookie(res);
      throw new UnauthorizedException('No active session');
    }
    return { user: data.user };
  }

  /**
   * GET /auth/sessions — list all active sessions for the current user.
   * Used by the "Devices & Sessions" settings page for session accountability.
   * Returns metadata only (IP hash, userAgent hash, timestamps) — never the raw token.
   */
  @Get('sessions')
  async listSessions(@Req() req: any) {
    const userId: string | undefined = (req as any).user?.id;
    if (!userId) throw new UnauthorizedException();
    return this.sessionService.listUserSessions(userId);
  }

  /**
   * DELETE /auth/sessions — revoke all OTHER sessions for the current user.
   * Useful for "sign out everywhere" security action.
   * The current session is preserved.
   */
  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  async revokeOtherSessions(@Req() req: any) {
    const userId: string | undefined = (req as any).user?.id;
    const currentSessionId: string | undefined = (req as any).user?.sessionId;
    if (!userId) throw new UnauthorizedException();

    // Revoke all then re-create a fresh token for the current session would be ideal;
    // for now we revoke all non-current sessions by updating userId+revokedAt null
    // where id != currentSessionId.
    const active = await this.sessionService.listUserSessions(userId);
    const others = active.filter((s) => s.id !== currentSessionId);

    await Promise.all(
      others.map((s) => this.sessionService.revokeSessionById(s.id, userId, 'revoke_all_others'))
    );

    return { revokedCount: others.length };
  }

  /**
   * DELETE /auth/sessions/:id — revoke a specific session by ID.
   * Only the owner of the session can revoke it (enforced in SessionService).
   */
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  async revokeSession(@Param('id') sessionId: string, @Req() req: any) {
    const userId: string | undefined = (req as any).user?.id;
    if (!userId) throw new UnauthorizedException();
    await this.sessionService.revokeSessionById(sessionId, userId);
    return { ok: true };
  }

  @Get('admin-overview')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole(AUTH_ROLES.ADMIN)
  async adminOverview(@Query('practiceId') practiceId?: string) {
    return this.authService.getAdminOverview(practiceId ?? 'demo-practice');
  }
}

