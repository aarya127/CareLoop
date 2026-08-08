import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../../modules/auth/auth.service';
import { SESSION_COOKIE } from '../../modules/auth/session.service';
import type { FastifyRequest } from 'fastify';

export const IS_PUBLIC_KEY = 'isPublic';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  // Explicit @Inject token: the tsx/esbuild dev runtime does not emit
  // design:paramtypes metadata, so plain constructor injection resolves to
  // undefined here. Matches the pattern used in AuthController.
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  private assertTrustedCookieOrigin(req: FastifyRequest): void {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) return;

    const origin = req.headers.origin;
    if (!origin) throw new ForbiddenException('Origin header required');

    const configuredOrigins = (process.env.WEB_URL ?? 'http://localhost:3000')
      .split(',')
      .map((value) => value.trim().replace(/\/$/, ''))
      .filter(Boolean);
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isDevelopmentOrigin =
      process.env.NODE_ENV !== 'production' &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalizedOrigin);

    if (!configuredOrigins.includes(normalizedOrigin) && !isDevelopmentOrigin) {
      throw new ForbiddenException('Untrusted request origin');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Use Reflect.getMetadata directly — avoids Reflector DI issues with tsx/esbuild
    const isPublic =
      Reflect.getMetadata(IS_PUBLIC_KEY, context.getHandler()) ||
      Reflect.getMetadata(IS_PUBLIC_KEY, context.getClass());
    if (isPublic) return true;

    const req = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: unknown; sessionToken?: string }>();

    // Accept session token from: 1) HTTP-only cookie, 2) Authorization Bearer header
    const cookieToken: string | undefined = ((req as any).cookies as Record<string, string>)[
      SESSION_COOKIE
    ];
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    const token = cookieToken ?? bearerToken;

    if (!token) throw new UnauthorizedException('No session cookie');
    if (cookieToken && !bearerToken) this.assertTrustedCookieOrigin(req);

    const session = await this.authService.validateSession(token);
    if (!session) throw new UnauthorizedException('Session invalid or expired');

    req.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      // Full role set so RolesGuard evaluates every assigned role, not just the first.
      roles: session.user.roles,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      practiceId: session.user.practiceId,
      sessionId: session.sessionId,
    };
    // Keep credentials separate from the serializable user object. Endpoints
    // such as /auth/me return req.user directly and must never echo the token.
    req.sessionToken = token;

    return true;
  }
}
