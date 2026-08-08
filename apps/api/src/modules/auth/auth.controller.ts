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
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthGuard, RequireRole, RolesGuard } from '../../common/guards';
import { AuthService } from './auth.service';
import { AUTH_ROLES } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SignupDto } from './dto/signup.dto';
import { Public, CurrentUser } from '../../common/decorators';
import { SESSION_COOKIE, SessionService } from './session.service';
import { clearSessionCookie, setSessionCookie } from './session-cookie';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(SessionService) private readonly sessionService: SessionService,
  ) {}

  /** 10 attempts per minute per IP to prevent brute-force */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() req: any, @Res({ passthrough: true }) res: any) {
    const data = await this.authService.login(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    setSessionCookie(res, data.sessionToken);

    return { user: data.user };
  }

  /**
   * Self-serve organization signup — creates a new practice + first admin and
   * logs them in. Public + rate-limited (5/min per IP) to deter abuse.
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: SignupDto, @Req() req: any, @Res({ passthrough: true }) res: any) {
    const data = await this.authService.signup(dto, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    setSessionCookie(res, data.sessionToken);
    return { user: data.user };
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
  async register(@Body() dto: RegisterDto, @Req() req: any) {
    return this.authService.register(req.user.practiceId, req.user.id, dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const token = req.sessionToken ?? req.cookies?.[SESSION_COOKIE];

    await this.authService.logout(token, {
      userId: (req as any).user?.id,
      practiceId: (req as any).user?.practiceId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    clearSessionCookie(res);
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
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    if (req.user) return { user: req.user };
    const token = req.cookies?.[SESSION_COOKIE];
    const data = await this.authService.getSession(token);
    if (!data) {
      clearSessionCookie(res);
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
      others.map((s) => this.sessionService.revokeSessionById(s.id, userId, 'revoke_all_others')),
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
  async adminOverview(@Req() req: any) {
    // Scope to the admin's own practice — never a client-supplied practiceId.
    return this.authService.getAdminOverview(req.user.practiceId);
  }
}
