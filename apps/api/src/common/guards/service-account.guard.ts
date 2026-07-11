import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTH_SERVICE_ACCOUNT_HEADER } from '../../modules/auth/auth.constants';
import { prisma } from '@careloop/db';
import { hashToken } from '../../modules/auth/auth.utils';

type RequestWithHeaders = {
  headers: Record<string, string | string[] | undefined>;
  serviceAccount?: {
    id: string;
    clientId: string;
    scopes: string[];
  };
};

@Injectable()
export class ServiceAccountGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithHeaders>();
    const raw =
      req.headers[AUTH_SERVICE_ACCOUNT_HEADER] ??
      req.headers[AUTH_SERVICE_ACCOUNT_HEADER.toLowerCase()];

    if (!raw || Array.isArray(raw)) {
      throw new UnauthorizedException('Missing service account credential');
    }

    const parts = raw.split(':');
    if (parts.length !== 2) {
      throw new ForbiddenException('Invalid service account credential format');
    }

    const [clientId, secret] = parts;
    const account = await prisma.serviceAccount.findUnique({
      where: { clientId },
      select: {
        id: true,
        clientId: true,
        clientSecretHash: true,
        status: true,
        scopes: true,
      },
    });

    if (!account || account.status !== 'active') {
      throw new ForbiddenException('Service account not active');
    }

    if (account.clientSecretHash !== hashToken(secret)) {
      throw new ForbiddenException('Invalid service account credential');
    }

    req.serviceAccount = {
      id: account.id,
      clientId: account.clientId,
      scopes: account.scopes,
    };

    return true;
  }
}
