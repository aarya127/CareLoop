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

// ── Role groups for RBAC (used with @RequireRole) ───────────────────────────
// RolesGuard grants `admin` a blanket bypass, but admin is listed explicitly in
// each group for readability. Roles are compared case-insensitively.

// Roles permitted to write clinical/EMR data.
export const EMR_CLINICAL_ROLES = ['admin', 'manager', 'provider', 'hygienist'] as const;

// Management — analytics, audit log, and destructive actions (delete/void).
export const MANAGEMENT_ROLES = ['admin', 'manager'] as const;

// Front office — money handling (billing + payments) and insurance verification.
// Clinical roles (provider/hygienist) are intentionally excluded from money ops.
export const FRONT_OFFICE_ROLES = ['admin', 'manager', 'staff'] as const;

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
