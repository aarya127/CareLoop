import { env } from './env';

export const authConfig = {
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS ?? 28800),
  sessionIdleTtlSeconds: Number(process.env.SESSION_IDLE_TTL_SECONDS ?? 1800),
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? 'careloop_session',
  cookieDomain: process.env.SESSION_COOKIE_DOMAIN || undefined,
};
