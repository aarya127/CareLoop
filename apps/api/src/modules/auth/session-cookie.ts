import { authConfig } from '../../config/auth';
import { SESSION_COOKIE } from './session.service';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: (process.env.SESSION_COOKIE_SAME_SITE ?? 'lax') as 'lax' | 'strict' | 'none',
  path: '/',
  secure: process.env.NODE_ENV === 'production' || process.env.SESSION_COOKIE_SAME_SITE === 'none',
  domain: authConfig.cookieDomain,
};

export function setSessionCookie(response: any, token: string): void {
  response.setCookie(SESSION_COOKIE, token, {
    ...COOKIE_OPTS,
    maxAge: authConfig.sessionTtlSeconds,
  });
}

export function clearSessionCookie(response: any): void {
  response.setCookie(SESSION_COOKIE, '', {
    ...COOKIE_OPTS,
    expires: new Date(0),
    maxAge: 0,
  });
}
