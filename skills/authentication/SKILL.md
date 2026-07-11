# Skill Name: authentication

## Description

Authenticate clinic staff, manage server-side sessions, and enforce role-based access
control (RBAC). Wraps the `auth` module so an agent can log a user in, check the current
identity, refresh/rotate a session, list and revoke sessions, and register staff accounts.

## Domain

Authentication & session management.

## Dependencies

- **API:** NestJS `auth` controller — base `/auth` (`apps/api/src/modules/auth/auth.controller.ts`)
- **Password hashing:** **bcrypt** via `auth.utils.ts` (`hashPassword`/`verifyPassword`) is the live
  login path. `BCRYPT_ROUNDS` (default 12) is tunable; a successful login **rehashes in the background**
  to the configured cost (`passwordNeedsRehash`). A separate argon2 `PasswordService` exists but is NOT
  on the login path.
- **Services:** `SessionService` (hashed token + CSRF secret, idle + absolute expiry, rotation)
- **Tables:** `User`, `Session`, `UserRole`, `Role`, `Practice`, `AuditLog` (every auth event is audited)
- **Infra:** Redis (session cache + throttling), Postgres

---

## 2. Capability Overview

Lets an agent: establish an authenticated session (`POST /auth/login`), read the active
user (`GET /auth/me`), rotate a session before expiry (`POST /auth/refresh`), enumerate a
user's sessions and revoke one or all (`GET`/`DELETE /auth/sessions`), and create staff
users (`POST /auth/register`). It interacts with Postgres (users/sessions), argon2 (verify),
and Redis (rate limits). Decisions it can make: whether credentials are valid, whether an
account is locked, and whether a session is still live (idle + absolute expiry).

## 3. Step-by-Step Execution Logic

**Login (`POST /auth/login`):**

1. Receive `{ email, password }`.
2. Validate shape (`email` is an email, `password` non-empty).
3. POST to `/auth/login`. The service looks up the `User` by email, checks `status` and `lockedUntil`.
4. If locked → stop, surface `423` (do not retry).
5. On `bcrypt.compare` success → service creates a `Session` (hashed token + CSRF secret, idle + absolute expiry), resets `failedLoginCount`, and **rehashes the password in the background** if its cost differs from `BCRYPT_ROUNDS` (non-blocking).
6. Capture the `cl_session` cookie and the returned `user`. Store the cookie for subsequent calls.
7. On failure → service increments `failedLoginCount`; surface `401`. Never reveal which of email/password was wrong.

**Authenticated call pattern:** attach `cl_session` cookie; for mutations also attach `X-CSRF-Token` from the session.

**Refresh (`POST /auth/refresh`):** call before `idleExpiresAt`; the service rotates the token (sets `rotatedAt`) and returns a new cookie. Replace the stored cookie.

## 4. Inputs & Outputs

### Inputs

- Login (required): `email: string`, `password: string`.
- Register (required): `email`, `password (min 8)`, `firstName`, `lastName`, `practiceId`; optional `role` — the DTO accepts the uppercase set `{STAFF, MANAGER, ADMIN, SERVICE_ACCOUNT}` (default STAFF), but the service **lowercases and stores it**, so the persisted/returned role name is lowercase (`staff`, `manager`, `admin`, `service_account`).

### Outputs

```json
// POST /auth/login → 200
{ "user": { "id": "usr_…", "email": "a@b.com", "practiceId": "prac_…", "roles": ["staff"] } }
// + Set-Cookie: cl_session=…; HttpOnly
```

```json
// GET /auth/me → 200
{ "id": "usr_…", "email": "a@b.com", "practiceId": "prac_…", "roles": ["manager"] }
```

> **Role-name casing caveat:** `roles` are **not normalized** at rest. Users created via `POST /auth/register` get **lowercase** names (`staff`…); older seeded/demo data may still carry **uppercase** names and roles outside the register set (`ADMIN`, `PROVIDER`, `HYGIENIST`). The RBAC guard now compares **case-insensitively**, so both resolve correctly — but any client-side role check must also compare case-insensitively. See ARCHITECTURE-INSIGHTS for details.

## 5. Tools / APIs Used

- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `GET /auth/session`, `POST /auth/refresh`
- `POST /auth/signup` — **public** self-serve org signup: creates a new `Practice` + first admin
  `User` + session in one atomic step (rate-limited). Distinct from `register`, which needs an
  admin session and an existing `practiceId`.
- `GET /auth/sessions`, `DELETE /auth/sessions` (all), `DELETE /auth/sessions/:id` (one)
- `POST /auth/register`, `GET /auth/admin-overview`
- Adding teammates without a shared password: use the **invitations** flow (`POST /invitations`
  → `/join/<token>`), not `register`. See the `team-management` skill.
- Internal: `verifyPassword`/`hashPassword` (bcrypt), `SessionService.create/rotate/revoke`

### RBAC role groups (enforced by the global RolesGuard + `@RequireRole`)

- **management** = `admin`, `manager` → analytics, audit log, destructive/void actions.
- **front office** = `admin`, `manager`, `staff` → billing, payments, insurance writes.
- **clinical** = `admin`, `manager`, `provider`, `hygienist` → EMR, treatments.
- Endpoints with no `@RequireRole` are open to any authenticated staff (tenant-scoped).

## 6. Edge Cases & Failure Handling

- **Locked account** → `423 Locked`: stop; do not brute-force. Inform the operator to wait for `lockedUntil`.
- **Invalid credentials** → `401`: generic message only.
- **Rate limited** → `429` (Redis throttler): back off, do not loop.
- **Expired/rotated session** → `401`: re-login; a rotated token's old value is dead.
- **Missing CSRF on mutation** → `403`: re-read CSRF from session and retry once.
- **No JWT here:** this system uses opaque server-side sessions, _not_ bearer JWTs. Do not synthesize `Authorization: Bearer` headers.
- **Roles are STAFF/MANAGER/ADMIN/SERVICE_ACCOUNT** — there is **no patient login**. Patients are records, not users.

## 7. Example Usage

- **Request:** `POST /auth/login {"email":"dr@clinic.com","password":"…"}`
- **Output:** `200 { user… }` + `cl_session` cookie.
- **Agent reasoning:** "I need to act as staff → login → store cookie → on `423` stop and report lockout → otherwise proceed to call protected endpoints with the cookie + CSRF token."

## 8. Optional Resources Folder

Not required. (A `resources/csrf-helper.md` could document extracting `X-CSRF-Token` from the session payload.)
