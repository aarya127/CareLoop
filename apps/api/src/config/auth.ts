import { env } from './env';

export const authConfig = {
  jwtSecret: env.jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS ?? 28800),
};
