import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../guards/session-auth.guard';
import { ROLE_METADATA_KEY } from '../guards/roles.guard';
import type { UserRole } from '@careloop/shared';

/** Mark a route as publicly accessible (no session required). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Require one or more roles to access a route. Writes the SAME metadata key that
 * RolesGuard reads (`careloop:roles`) — previously it used a different key, so
 * @Roles() was silently ignored (fail-open). Prefer RequireRole from the guards
 * module; this alias is kept for existing call sites.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLE_METADATA_KEY, roles);

/** Extract the current user from the request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ user?: unknown }>();
    return req.user;
  },
);
