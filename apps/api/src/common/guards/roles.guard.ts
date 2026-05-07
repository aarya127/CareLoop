import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
<<<<<<< HEAD
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLE_METADATA_KEY = 'careloop:roles';
export const RequireRole = (...roles: string[]) => SetMetadata(ROLE_METADATA_KEY, roles);

type RequestWithAuth = {
  user?: {
    roles: string[];
  };
};

=======
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@careloop/shared';

export const ROLES_KEY = 'roles';

/** ADMIN bypasses all role requirements. */
>>>>>>> auth
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
<<<<<<< HEAD
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLE_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const userRoles = req.user?.roles ?? [];
    const authorized = requiredRoles.some((role) => userRoles.includes(role));

    if (!authorized) {
=======
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<{ user?: { role: string } }>();
    const role = req.user?.role;

    if (!role) throw new ForbiddenException('Access denied');
    if (role === 'ADMIN') return true;

    if (!required.includes(role as UserRole)) {
>>>>>>> auth
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
