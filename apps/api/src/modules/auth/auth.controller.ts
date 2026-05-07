import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
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
import { SESSION_COOKIE } from './session.service';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 8 * 60 * 60, // 8 hours in seconds
};

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.logout = this.logout.bind(this);
    this.session = this.session.bind(this);
    this.refresh = this.refresh.bind(this);
    this.adminOverview = this.adminOverview.bind(this);
  }

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

  @Public()
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
    const token = req.cookies?.[SESSION_COOKIE];
    const data = await this.authService.getSession(token);
    if (!data) throw new UnauthorizedException('No active session');
    return data.user;
  }

  @Get('session')
  async session(@Req() req: any) {
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
    const token = req.cookies?.[SESSION_COOKIE];
    const data = await this.authService.getSession(token);
    if (!data) {
      this.clearSessionCookie(res);
      throw new UnauthorizedException('No active session');
    }
    return { user: data.user };
  }

  @Get('admin-overview')
  @UseGuards(AuthGuard, RolesGuard)
  @RequireRole(AUTH_ROLES.ADMIN)
  async adminOverview(@Query('practiceId') practiceId?: string) {
    return this.authService.getAdminOverview(practiceId ?? 'demo-practice');
  }
}
