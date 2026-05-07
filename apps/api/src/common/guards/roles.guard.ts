import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLE_METADATA_KEY = 'careloop:roles';
export const ROLES_KEY = 'roles';
export const RequireRole = (...roles: string[]) => SetMetadata(ROLE_METADATA_KEY, roles);

type RequestWithAuth = {
  user?: {
    roles?: string[];
    role?: string;
  };
};


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLE_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const userRoles = req.user?.roles ?? (req.user?.role ? [req.user.role] : []);

    if (userRoles.includes('ADMIN')) return true;

    const authorized = requiredRoles.some((role) => userRoles.includes(role));

    if (!authorized) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
