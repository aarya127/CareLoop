import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTH_SESSION_COOKIE } from '../../modules/auth/auth.constants';
import { SessionService } from '../../modules/auth/session.service';
import { prisma } from '@careloop/db';

type RequestWithAuth = {
  cookies?: Record<string, string>;
  user?: {
    id: string;
    email: string;
    practiceId: string;
    roles: string[];
    sessionId: string;
  };
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const rawSessionToken = req.cookies?.[AUTH_SESSION_COOKIE];

    if (!rawSessionToken) {
      throw new UnauthorizedException('Authentication required');
    }

    const session = await this.sessionService.validateSession(rawSessionToken);

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        practiceId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    req.user = {
      id: user.id,
      email: user.email,
      practiceId: user.practiceId,
      roles: session.roles,
      sessionId: session.sessionId,
    };

    return true;
  }
}
