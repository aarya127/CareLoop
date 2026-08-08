import { ForbiddenException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionAuthGuard } from './session-auth.guard';

const session = {
  sessionId: 'session-A',
  user: {
    id: 'user-A',
    email: 'user@example.com',
    role: 'ADMIN',
    roles: ['ADMIN'],
    firstName: 'Ada',
    lastName: 'Lovelace',
    practiceId: 'practice-A',
  },
};

function context(request: Record<string, unknown>) {
  return {
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
}

describe('SessionAuthGuard CSRF protection', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalWebUrl = process.env.WEB_URL;
  const validateSession = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = 'production';
    process.env.WEB_URL = 'https://app.careloop.example';
    validateSession.mockResolvedValue(session);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.WEB_URL = originalWebUrl;
  });

  it('rejects a cross-site mutation authenticated by cookie', async () => {
    const guard = new SessionAuthGuard({ validateSession } as any);
    const request = {
      method: 'POST',
      cookies: { cl_session: 'cookie-token' },
      headers: { origin: 'https://attacker.example' },
    };

    await expect(guard.canActivate(context(request))).rejects.toBeInstanceOf(ForbiddenException);
    expect(validateSession).not.toHaveBeenCalled();
  });

  it('accepts a cookie mutation from the configured web origin', async () => {
    const guard = new SessionAuthGuard({ validateSession } as any);
    const request: Record<string, any> = {
      method: 'PATCH',
      cookies: { cl_session: 'cookie-token' },
      headers: { origin: 'https://app.careloop.example' },
    };

    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(request.user.practiceId).toBe('practice-A');
    expect(request.user.sessionId).toBe('session-A');
    expect(request.user).not.toHaveProperty('sessionToken');
    expect(request.sessionToken).toBe('cookie-token');
  });

  it('allows non-browser bearer mutations without an Origin header', async () => {
    const guard = new SessionAuthGuard({ validateSession } as any);
    const request: Record<string, any> = {
      method: 'DELETE',
      cookies: {},
      headers: { authorization: 'Bearer service-token' },
    };

    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(request.user).not.toHaveProperty('sessionToken');
    expect(request.sessionToken).toBe('service-token');
  });
});
