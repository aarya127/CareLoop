import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { RolesGuard, ROLE_METADATA_KEY } from './roles.guard';

/**
 * Builds a fake ExecutionContext with role metadata on the handler and/or class,
 * and a req.user carrying the given roles — mirroring how the global guards run.
 */
function ctx(opts: {
  handlerRoles?: string[];
  classRoles?: string[];
  userRoles?: string[];
  userRole?: string;
}): ExecutionContext {
  const handler = () => undefined;
  if (opts.handlerRoles) Reflect.defineMetadata(ROLE_METADATA_KEY, opts.handlerRoles, handler);
  class FakeController {}
  if (opts.classRoles) Reflect.defineMetadata(ROLE_METADATA_KEY, opts.classRoles, FakeController);

  const user = opts.userRoles !== undefined ? { roles: opts.userRoles } : { role: opts.userRole };
  return {
    getHandler: () => handler,
    getClass: () => FakeController,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const guard = new RolesGuard();

  it('allows any authenticated user when no role is required', () => {
    expect(guard.canActivate(ctx({ userRoles: ['staff'] }))).toBe(true);
  });

  it('allows when the user has one of the required roles', () => {
    expect(
      guard.canActivate(ctx({ handlerRoles: ['manager', 'staff'], userRoles: ['staff'] })),
    ).toBe(true);
  });

  it('denies (403) when the user has none of the required roles', () => {
    expect(() =>
      guard.canActivate(ctx({ handlerRoles: ['manager'], userRoles: ['staff'] })),
    ).toThrow(ForbiddenException);
  });

  it('grants admin a blanket bypass', () => {
    expect(guard.canActivate(ctx({ handlerRoles: ['manager'], userRoles: ['admin'] }))).toBe(true);
  });

  it('compares roles case-insensitively', () => {
    expect(guard.canActivate(ctx({ handlerRoles: ['ADMIN'], userRoles: ['admin'] }))).toBe(true);
    expect(guard.canActivate(ctx({ handlerRoles: ['Manager'], userRoles: ['MANAGER'] }))).toBe(
      true,
    );
  });

  it('handler metadata overrides class metadata (method-level wins)', () => {
    // Class allows front-office; the method restricts to management. staff must be denied.
    expect(() =>
      guard.canActivate(
        ctx({
          classRoles: ['admin', 'manager', 'staff'],
          handlerRoles: ['admin', 'manager'],
          userRoles: ['staff'],
        }),
      ),
    ).toThrow(ForbiddenException);
    // ...but a manager passes the method-level requirement.
    expect(
      guard.canActivate(
        ctx({
          classRoles: ['admin', 'manager', 'staff'],
          handlerRoles: ['admin', 'manager'],
          userRoles: ['manager'],
        }),
      ),
    ).toBe(true);
  });

  it('falls back to the singular user.role when roles[] is absent', () => {
    expect(guard.canActivate(ctx({ handlerRoles: ['staff'], userRole: 'staff' }))).toBe(true);
  });
});
