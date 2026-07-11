# Onboarding, accounts & team

> How a practice gets created, how staff accounts are provisioned, and how
> role-based access control (RBAC) gates the API. Companion to
> [`security.md`](security.md) and the `authentication` / `team-management` skills.

## Three ways an account is created

| Path | Endpoint | Auth | Creates |
|---|---|---|---|
| **Self-serve signup** | `POST /auth/signup` (web `/signup`) | Public, rate-limited (5/min) | A **new `Practice` + first admin `User` + session**, atomically. |
| **Invite → accept** | `POST /invitations` then `POST /invitations/accept/:token` (web `/admin/team` → `/join/<token>`) | create = admin/manager; accept = public (token) | A `User` in the **inviting** practice with the invited role. No shared password. |
| **Direct register** | `POST /auth/register` | Admin session | A `User` in the admin's existing practice. Back-office provisioning. |

Signup is the only way to create a brand-new practice; the other two add members to
an existing one. All three store passwords with **bcrypt** (`BCRYPT_ROUNDS`, default 12);
login rehashes to the configured cost in the background (see
[`login-latency.md`](login-latency.md)).

## Signup (new practice + first admin)

`auth.service.signup` runs a single `$transaction`: create `Practice` → upsert the `admin`
role → create the `User` (admin) → assign the role. Then it issues a session (same
`{ user, sessionToken }` shape as login) and the BFF sets the `cl_session` httpOnly cookie.
Duplicate email → `409`; weak input → `400` (validated `SignupDto`).

## Invitations (joining a team)

- Token is random and stored **hashed** (`Invitation.tokenHash`, like `Session`); the raw
  token lives only in the `/join/<token>` link. 7-day expiry, single-use.
- Creating an invite supersedes any prior pending invite for the same email; if that email
  already has a user, it's rejected (they should log in).
- Accepting creates the user in the invite's practice with the invited role, marks the invite
  `accepted` (a second accept 404s), and starts a session.
- Email delivery is best-effort (`EmailService` + `renderInvite`); the shareable link is always
  returned so onboarding works even without SMTP.

## RBAC

Every authenticated user belongs to exactly one `Practice` (tenant). Beyond tenancy, three role
groups (`auth.constants.ts`) gate sensitive endpoints via the global `RolesGuard` + `@RequireRole`:

| Group | Roles | Gates |
|---|---|---|
| **management** | `admin`, `manager` | analytics, audit log, destructive/void (delete patient/document/treatment/insurance, void invoice), admin module, seed |
| **front office** | `admin`, `manager`, `staff` | billing, payments, insurance writes, claims |
| **clinical** | `admin`, `manager`, `provider`, `hygienist` | EMR (encounters/allergies/…), treatments |

Notes:
- `admin` has a blanket bypass in `RolesGuard`; role comparison is case-insensitive.
- Endpoints with no `@RequireRole` are open to any authenticated staff, but are still
  **tenant-scoped** — a user can only ever act on their own practice's rows.
- Method-level `@RequireRole` overrides a class-level one (e.g. a front-office `billing`
  controller whose `void` method is restricted to management).

## Tested by

`roles.guard.spec.ts` (enforcement, admin bypass, case-insensitivity, method-overrides-class),
plus per-module tenant-isolation specs (`*.tenant.spec.ts`) and `claims.service.spec.ts`.
