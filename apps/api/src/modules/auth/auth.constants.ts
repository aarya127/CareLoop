// Unified session cookie name — must match SESSION_COOKIE in session.service.ts
// and the web app (cl_session). Previously 'careloop_session', which was never
// set on login, so AuthGuard-protected routes always 401'd.
export const AUTH_SESSION_COOKIE = 'cl_session';
export const AUTH_SERVICE_ACCOUNT_HEADER = 'x-careloop-service-account';

export const AUTH_ROLES = {
  STAFF: 'staff',
  MANAGER: 'manager',
  ADMIN: 'admin',
  SERVICE_ACCOUNT: 'service_account',
} as const;

// Roles permitted to write clinical/EMR data. `admin` is included explicitly for
// clarity though RolesGuard already grants admin a blanket bypass.
export const EMR_CLINICAL_ROLES = ['admin', 'manager', 'provider', 'hygienist'] as const;

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
