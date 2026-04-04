import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
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
  constructor(private readonly authService: AuthService) {}

  /** 10 attempts per minute per IP to prevent brute-force */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const meta = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    };

    const { sessionToken, user } = await this.authService.login(dto, meta);

    reply.setCookie(SESSION_COOKIE, sessionToken, COOKIE_OPTS);

    // Return sessionToken in body so proxy clients (Next.js) can relay it
    return { user, sessionToken };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
    @CurrentUser() user: { sessionToken: string },
  ) {
    const token: string | undefined = (req.cookies as Record<string, string>)[SESSION_COOKIE];
    if (token) await this.authService.logout(token);
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
  }

  @Get('me')
  me(@CurrentUser() user: unknown) {
    return user;
  }
}
