import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { authConfig } from '../../config/auth';

@Controller('auth')
export class AuthController {
  private readonly authService: AuthService;

  constructor(authService?: AuthService) {
    // Some local dev setups in this repo run without decorator metadata;
    // fall back to a direct service instance so auth endpoints remain usable.
    this.authService = authService ?? new AuthService();
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: any) {
    const { accessToken, refreshToken, user } = await this.authService.login(dto);
    // set httpOnly refresh token cookie
    try {
      res.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: authConfig.sessionTtlSeconds,
      });
    } catch (e) {
      // ignore if cookie helper not available
      res.header('Set-Cookie', `refreshToken=${refreshToken}; HttpOnly; Path=/; Max-Age=${authConfig.sessionTtlSeconds}`);
    }
    return { accessToken, user };
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const token = req.cookies?.refreshToken ?? null;
    await this.authService.logout(token);
    try {
      res.setCookie('refreshToken', '', { path: '/', expires: new Date(0) });
    } catch (e) {
      res.header('Set-Cookie', 'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    }
    return { ok: true };
  }

  @Post('refresh')
  async refresh(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const token = req.cookies?.refreshToken ?? null;
    const data = await this.authService.refresh(token);
    if (data.refreshToken) {
      try {
        res.setCookie('refreshToken', data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: authConfig.sessionTtlSeconds,
        });
      } catch (e) {
        res.header('Set-Cookie', `refreshToken=${data.refreshToken}; HttpOnly; Path=/; Max-Age=${authConfig.sessionTtlSeconds}`);
      }
    }
    return { accessToken: data.accessToken, user: data.user };
  }
}
