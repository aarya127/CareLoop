import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../../modules/auth/auth.service';
import { SESSION_COOKIE } from '../../modules/auth/session.service';
import type { FastifyRequest } from 'fastify';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<FastifyRequest & { user?: unknown }>();

    // Accept session token from: 1) HTTP-only cookie, 2) Authorization Bearer header
    const cookieToken: string | undefined = (req.cookies as Record<string, string>)[SESSION_COOKIE];
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const token = cookieToken ?? bearerToken;

    if (!token) throw new UnauthorizedException('No session cookie');

    const session = await this.authService.validateSession(token);
    if (!session) throw new UnauthorizedException('Session invalid or expired');

    req.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      practiceId: session.user.practiceId,
      sessionToken: token,
    };

    return true;
  }
}
