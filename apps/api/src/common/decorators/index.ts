import { SetMetadata } from '@nestjs/common';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../guards/session-auth.guard';
import { ROLES_KEY } from '../guards/roles.guard';
import type { UserRole } from '@careloop/shared';

/** Mark a route as publicly accessible (no session required). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Require one or more roles to access a route. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

/** Extract the current user from the request. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ user?: unknown }>();
    return req.user;
  },
);
