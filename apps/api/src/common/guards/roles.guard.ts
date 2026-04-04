import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@careloop/shared';

export const ROLES_KEY = 'roles';

/** ADMIN bypasses all role requirements. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
