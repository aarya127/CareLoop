import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';

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
  canActivate(context: ExecutionContext): boolean {
    // Use Reflect.getMetadata directly — avoids Reflector DI issues with tsx/esbuild
    const requiredRoles =
      Reflect.getMetadata(ROLE_METADATA_KEY, context.getHandler()) ||
      Reflect.getMetadata(ROLE_METADATA_KEY, context.getClass());

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<RequestWithAuth>();
    const userRoles = req.user?.roles ?? (req.user?.role ? [req.user.role] : []);

    if (userRoles.includes('ADMIN')) return true;

    const authorized = requiredRoles.some((role: string) => userRoles.includes(role));

    if (!authorized) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
