export const AUTH_SESSION_COOKIE = 'careloop_session';
export const AUTH_SERVICE_ACCOUNT_HEADER = 'x-careloop-service-account';

export const AUTH_ROLES = {
  STAFF: 'staff',
  MANAGER: 'manager',
  ADMIN: 'admin',
  SERVICE_ACCOUNT: 'service_account',
} as const;

export const AUTH_LIMITS = {
  LOGIN_IP_WINDOW_MS: 5 * 60 * 1000,
  LOGIN_IP_MAX_ATTEMPTS: 20,
  LOGIN_ACCOUNT_WINDOW_MS: 15 * 60 * 1000,
  LOGIN_ACCOUNT_MAX_ATTEMPTS: 5,
} as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid credentials',
  ACCOUNT_LOCKED: 'Account temporarily locked',
} as const;
