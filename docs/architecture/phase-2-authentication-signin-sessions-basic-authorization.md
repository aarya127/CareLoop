# CareLoop Phase 2: Authentication, Sign-in, Sessions, and Basic Authorization

## Scope and Objective

Phase 2 secures platform access before patient workflows are enabled.

Primary objective:

- Secure by default.
- Healthcare-grade access control and traceability.
- Keep architecture simple now, SSO-ready later.

Technical baseline assumed:

- API: NestJS.
- Web: Next.js.
- Data layer: PostgreSQL.
- Phase 1 network, TLS, ingress, and environment isolation is complete.

---

## 1) Authentication Strategy

### Options considered

- Email/password only:
  - Pros: fastest delivery, minimal dependencies.
  - Cons: no enterprise federation, higher password reset burden.
- OAuth only (Google/Microsoft):
  - Pros: lower password risk, smoother user UX.
  - Cons: poor fit for clinics requiring corporate IdP policies and SAML.
- SSO-first (SAML/OIDC mandatory):
  - Pros: enterprise-ready from day one.
  - Cons: overbuilt for small team and early product phase.
- Hybrid start (local auth now, SSO-ready identity model):
  - Pros: pragmatic launch speed with clear migration path.
  - Cons: temporary dual-auth complexity during migration.

### Recommended choice

Use hybrid start:

- Start with email/password local auth for staff users.
- Design identity schema and auth service contracts to support external identity providers later (Google, Microsoft, SAML via OIDC bridge).

### Why this is best for CareLoop

- Delivers fast and safely for early deployments.
- Avoids blocking on enterprise IdP integration before product validation.
- Keeps migration path clean for larger healthcare organizations.

### Tradeoffs

- You must maintain password lifecycle controls initially.
- Later account linking and policy harmonization will require careful migration.

### Implementation outline

- User identity model:
  - users as the canonical person/account record.
  - auth_identities table with provider-local identity keys.
- Start with provider = local.
- Add provider = google, microsoft, saml when enabled.
- Require verified email before enabling privileged roles.
- Introduce account linking rules:
  - Auto-link only when email is verified by trusted IdP and no existing conflicting identity.
  - Otherwise require admin-reviewed link flow.

### Security considerations

- Never rely on email alone without verification status.
- Do not auto-link accounts from unverified social identities.
- Enforce unique provider subject key to prevent takeover.

### Decision rules

- Small team now: local email/password with SSO-ready schema.
- Enterprise clients later: enable SSO per tenant and enforce IdP login for those tenants.
- Healthcare compliance: require MFA readiness, strong session controls, and full login audit from day one.

### Database implications

- users remains stable as canonical account.
- auth_identities enables many-to-one identity linking.
- sessions references users, not provider identities.
- audit logs capture provider and auth method for all auth events.

### SSO migration path

- Step 1: Add auth_identities table and provider abstraction now.
- Step 2: Add OIDC connector for Google/Microsoft.
- Step 3: Add enterprise SAML via broker (or direct SAML if needed).
- Step 4: Per-tenant auth policy switch:
  - local only
  - local + SSO
  - SSO required
- Step 5: Sunset local passwords for enterprise tenants if contracted.

---

## 2) Password Security Design

### Options considered

- Argon2id:
  - Pros: memory-hard, strongest modern defense against GPU cracking.
  - Cons: slightly higher CPU and memory tuning complexity.
- bcrypt:
  - Pros: widely available, easy operational familiarity.
  - Cons: compute-hard only, weaker against modern parallel hardware than Argon2id.

### Recommended choice

Use Argon2id.

### Parameters

Recommended baseline:

- algorithm: Argon2id
- memory cost: 64 MB
- iterations: 3
- parallelism: 1 to 2 (based on CPU)
- output length: 32 bytes

Operational tuning rule:

- Target hash verification time around 150 ms to 350 ms per request in production.
- Re-tune upward yearly.

### Salt vs pepper

- Salt:
  - Unique per password, random, stored with hash.
  - Always required.
- Pepper:
  - Application-wide secret from secret manager, not stored in DB.
  - Optional but recommended for healthcare risk posture.

### Password policy

- Minimum length: 12.
- Block known breached passwords (k-anonymity API or local breach list).
- No forced periodic rotation unless compromise suspected.
- Require reset on suspected credential stuffing or admin risk event.

### Password reset security

- Single-use reset tokens.
- Token stored hashed (not plaintext).
- Expiry: 15 minutes.
- Invalidate all active sessions after successful password reset.
- Uniform success response to avoid account enumeration.

### Brute-force protection

- Dual throttle:
  - IP-based limit.
  - Account/email-based limit.
- Temporary lockouts with exponential backoff.
- Optional captcha only after repeated abuse signals.

### Lockout and retry strategy

- 5 failed attempts per account in rolling 15 minutes triggers soft lock.
- Soft lock progression: 1 min, 5 min, 15 min.
- Hard security review trigger after sustained abuse patterns.

### Security considerations

- Use constant-time hash verification paths.
- Return same error for unknown user and wrong password.
- Do not log plaintext credentials or reset tokens.

---

## 3) Session Architecture

### Options considered

- JWT stateless sessions:
  - Pros: no session store required for validation.
  - Cons: hard revocation, difficult logout everywhere, healthcare audit gaps.
- Database-backed opaque sessions:
  - Pros: strong revocation, clean auditability, simple incident response.
  - Cons: DB lookup cost on each authenticated request.
- Redis-backed sessions:
  - Pros: high throughput and low latency.
  - Cons: adds infrastructure dependency and persistence decisions.

### Recommended choice

Use database-backed opaque sessions as the source of truth.

Add Redis later for performance optimization only:

- Cache hot session lookups.
- Keep PostgreSQL authoritative.

### Why this is best

- Immediate support for logout everywhere and forced revocation.
- Better healthcare audit and investigation support.
- Simpler correctness than mixed token systems.

### Tradeoffs

- More write/read traffic to sessions table.
- Requires index hygiene and cleanup jobs.

### Implementation outline

- Cookie stores only opaque session token id.
- Server hashes token before DB storage.
- Request auth flow:
  - Read cookie.
  - Hash token.
  - Fetch active session.
  - Validate idle timeout and absolute timeout.
  - Load user and role claims.
- Rotate session token periodically and on privilege changes.

### Security considerations

- Support per-session revoke and revoke all sessions.
- Track created_at, last_seen_at, rotated_at, revoked_at.
- Store metadata for anomaly detection (IP prefix, user-agent fingerprint hash).

### Decision rules

- Need logout everywhere: database-backed sessions.
- Need immediate revocation: database-backed sessions.
- Healthcare auditing requirement: database-backed sessions.

---

## 4) Secure Cookie Design

### Options considered

- SameSite Strict:
  - Pros: strongest CSRF boundary.
  - Cons: can break legitimate cross-site entry flows.
- SameSite Lax:
  - Pros: strong default with better compatibility.
  - Cons: slightly broader cross-site behavior than Strict.
- SameSite None:
  - Pros: needed for cross-site embedded scenarios.
  - Cons: highest CSRF exposure if not paired with strong controls.

### Recommended choice

Use SameSite Lax for core app session cookies, with HttpOnly and Secure enabled.

### Why this is best

Balances security and practical browser compatibility for standard healthcare web workflows.

### Tradeoffs

- Strict is safer but can cause UX friction.
- None should be reserved for explicitly required cross-site architectures.

### Recommended cookie configuration

Session cookie:

- Name: careloop_session
- HttpOnly: true
- Secure: true in staging and production
- SameSite: Lax
- Path: /
- Domain: exact app host or parent domain only if required
- Max-Age: align with absolute session timeout

Optional CSRF cookie:

- Name: careloop_csrf
- HttpOnly: false
- Secure: true
- SameSite: Lax
- Path: /

### CSRF strategy

Use double-submit token for state-changing requests:

- Server issues CSRF token bound to session.
- Frontend sends token in custom header.
- Backend validates header token against session-bound value.

### Production-safe defaults

- Never set SameSite None unless cross-site embedding is required.
- Never allow non-secure cookies in production.
- Regenerate session token at login and privilege change.

### Session hijacking protections

- HttpOnly prevents script access.
- Secure prevents cleartext transit.
- Session rotation limits replay window.
- Device and IP anomaly detection can force re-authentication.

---

### Implementation outline

- Set cookie options centrally in AuthModule configuration.
- Bind CSRF secret to session record.
- Validate CSRF for all state-changing endpoints.

## 5) Database Schema Design

### Options considered

- Minimal schema (users and sessions only):
  - Pros: fastest delivery.
  - Cons: weaker role flexibility and audit maturity.
- Modular schema (users, roles, user_roles, sessions, service_accounts, audit_logs):
  - Pros: production-ready and future-proof.
  - Cons: slightly more initial migration work.

### Recommended choice

Use the modular schema now.

### Why this is best

It supports healthcare-grade traceability and avoids future breaking migrations.

### Tradeoffs

- More tables and indexes to maintain early.
- Requires clear data retention policy decisions up front.

### Recommended tables

users

- id uuid primary key
- email citext unique not null
- email_verified_at timestamptz null
- password_hash text null
- password_algo text not null default argon2id
- password_updated_at timestamptz null
- status text not null default active
- failed_login_count int not null default 0
- locked_until timestamptz null
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
- deleted_at timestamptz null

roles

- id smallint primary key
- name text unique not null
- description text
- created_at timestamptz not null default now()

user_roles

- user_id uuid not null references users(id)
- role_id smallint not null references roles(id)
- assigned_by uuid null references users(id)
- assigned_at timestamptz not null default now()
- primary key (user_id, role_id)

sessions

- id uuid primary key
- user_id uuid not null references users(id)
- session_token_hash text unique not null
- csrf_secret_hash text not null
- created_at timestamptz not null default now()
- last_seen_at timestamptz not null default now()
- expires_at timestamptz not null
- idle_expires_at timestamptz not null
- rotated_at timestamptz null
- revoked_at timestamptz null
- revoke_reason text null
- created_by_ip inet null
- created_by_user_agent_hash text null

service_accounts (future ready)

- id uuid primary key
- name text not null
- client_id text unique not null
- client_secret_hash text not null
- status text not null default active
- scopes text[] not null default {}
- last_used_at timestamptz null
- created_at timestamptz not null default now()
- rotated_at timestamptz null
- revoked_at timestamptz null

audit_logs

- id bigserial primary key
- event_time timestamptz not null default now()
- actor_user_id uuid null references users(id)
- actor_service_account_id uuid null references service_accounts(id)
- event_type text not null
- auth_method text null
- outcome text not null
- target_user_id uuid null references users(id)
- session_id uuid null references sessions(id)
- ip inet null
- user_agent_hash text null
- request_id text null
- metadata jsonb not null default {}

### Indexes

- users(email)
- users(status, locked_until)
- sessions(user_id, revoked_at)
- sessions(expires_at)
- sessions(idle_expires_at)
- sessions(session_token_hash)
- audit_logs(event_time)
- audit_logs(event_type, event_time)
- audit_logs(actor_user_id, event_time)
- audit_logs(target_user_id, event_time)

### Constraints and logic

- sessions revoked_at must be null for active session use.
- expires_at and idle_expires_at both enforced.
- on password reset: set revoked_at for all user sessions.
- on role change: revoke all sessions or force token rotation with claim refresh.

### Session invalidation strategy

- Per session revoke: by session id.
- Global revoke for user: update all active sessions.
- Incident revoke all: admin emergency command.

### Security considerations

- Store token hashes, never plaintext session tokens.
- Encrypt backups and protect audit logs from tampering.
- Consider partitioning audit_logs by month at scale.

---

### Implementation outline

- Ship migration set for all six tables in one deployment.
- Backfill role seeds.
- Add cleanup jobs for expired sessions and long-term audit archival.

## 6) Authorization Model (RBAC Foundation)

### Options considered

- RBAC only:
  - Pros: simple and auditable.
  - Cons: can be coarse for nuanced policy.
- ABAC early:
  - Pros: high flexibility.
  - Cons: high complexity and policy drift risk.
- RBAC now with ABAC-ready context:
  - Pros: practical now and extensible later.
  - Cons: phased transition work later.

### Recommended choice

RBAC now with explicit permission primitives and tenant context hooks.

### Why this is best

Provides strong clarity for Phase 2 without overengineering.

### Tradeoffs

- Some future rules may require ABAC evolution.

### Recommended roles

- staff
- manager
- admin
- service_account

### Recommended architecture

- RBAC first with role-to-permission mapping in code or table.
- Keep permissions explicit and resource-centric, for example:
  - patient.read
  - patient.write
  - schedule.manage
  - user.manage
  - audit.read

### Why RBAC first

- Clear and auditable.
- Fast to implement and reason about.
- Good match for early healthcare operations teams.

### When to move to ABAC

Move to ABAC when you need contextual policies such as:

- clinic ownership boundaries.
- time-based restrictions.
- sensitivity-based record segmentation.

### Multi-tenant clinic readiness

- Add tenant_id to users, sessions, and authorization context.
- Scope permissions by tenant and clinic.
- Enforce tenant context in all guards before business logic.

### Tradeoffs

- RBAC can become coarse if permissions are too broad.
- ABAC increases flexibility but raises policy complexity and testing burden.

### Security considerations

- Deny by default.
- Keep privileged actions admin-only with explicit checks.
- Log role changes and high-risk permission checks.

---

### Implementation outline

- Define role-to-permission matrix in one canonical module.
- Enforce matrix in backend guards.
- Use frontend only for UX gating, never for enforcement.

## 7) Backend Auth Guards

### Options considered

- Inline checks in controllers:
  - Pros: quick to start.
  - Cons: inconsistent and error-prone.
- Centralized guards and decorators:
  - Pros: consistent and testable.
  - Cons: requires initial framework setup.

### Recommended choice

Centralized NestJS guards with shared authorization utilities.

### Why this is best

Reduces security drift and keeps enforcement uniform across modules.

### Tradeoffs

- Slightly more upfront design effort for decorators and context typing.

### Middleware and guard design

- requireAuth:
  - validates session cookie.
  - loads user and active roles.
  - attaches auth context to request.
- requireRole(role):
  - verifies requested role exists in auth context.
- requireServiceAccount:
  - validates machine credential path (future table based).

### Recommended request layering

Proxy and TLS termination
-> session validation
-> role or service account guard
-> route handler

### API protection

- All non-public routes require requireAuth.
- Administrative routes require requireRole(admin).
- Sensitive operational routes also require audit context creation.

### Internal service protection

- Internal endpoints should not trust network location alone.
- Use service account auth plus scoped permissions.

### Security considerations

- Fail closed on guard errors.
- Avoid partial authorization checks in controllers.
- Keep a single central authorization library to prevent drift.

---

### Implementation outline

- Build AuthGuard, RoleGuard, ServiceAccountGuard.
- Add route decorators for roles and scopes.
- Add integration tests for guard ordering and deny-by-default behavior.

## 8) Frontend Auth Architecture

### Options considered

- Client-only auth state from local storage:
  - Pros: easy implementation.
  - Cons: weak security and session drift.
- Server-validated cookie sessions with provider state:
  - Pros: secure and aligned with backend truth.
  - Cons: requires proper bootstrap and loading states.

### Recommended choice

Server-validated cookie sessions with in-memory auth context.

### Why this is best

Keeps browser credential exposure low and aligns auth state with revocation.

### Tradeoffs

- Must handle initial loading and route transition carefully.

### Components

- Login page:
  - email/password form.
  - generic error responses.
  - rate-limit friendly UX messages.
- Auth provider:
  - bootstraps current session via session check endpoint.
  - stores minimal user context in memory.
- Protected layout:
  - blocks render until auth status resolved.
  - redirects unauthenticated users to login.
- Role-aware UI gates:
  - hide unavailable actions.
  - never rely on UI checks alone for security.

### Route policy

Public routes:

- /login
- /forgot-password
- /reset-password

Protected routes:

- /dashboard and all staff workflows.

Role-specific routes:

- /admin only for admin.
- manager routes for manager and admin as configured.

### Redirect logic

- If unauthenticated and route protected: redirect to /login with return_to.
- If authenticated and opening /login: redirect to default home.

### Security considerations

- Do not store access credentials in localStorage.
- Use cookie-based session checks from backend.
- Prevent open redirect by allow-listing return_to targets.

---

### Implementation outline

- Create AuthProvider with boot endpoint call.
- Wrap protected layout with auth resolution gate.
- Add route middleware for public versus protected path handling.

## 9) Session Lifecycle

### Options considered

- Long-lived static sessions:
  - Pros: fewer re-auth prompts.
  - Cons: larger hijack window.
- Short-lived sessions with rotation:
  - Pros: better security and revocation behavior.
  - Cons: more frequent refresh operations.

### Recommended choice

Short-lived rotating sessions with idle and absolute timeout.

### Why this is best

Minimizes replay exposure while remaining practical for staff operations.

### Tradeoffs

- More session writes and occasional user reauthentication.

### Lifecycle operations

- Login:
  - verify credentials.
  - create session record.
  - set secure cookie.
  - write audit event.
- Session check:
  - validate active session and return user profile and roles.
- Refresh session:
  - sliding idle window update and periodic token rotation.
- Logout:
  - revoke session and clear cookie.
- Expiration handling:
  - reject expired session.
  - clear cookie.
  - audit event for expiry if needed.

### Recommended timeouts

- Idle timeout: 15 minutes for privileged admin contexts, 30 minutes for standard staff.
- Absolute timeout: 8 hours.
- Remember-me extension: avoid in Phase 2 unless explicitly required.

### Rotation strategy

- Rotate session token every 15 minutes to 60 minutes of activity.
- Always rotate on privilege elevation and password change.

### Security considerations

- Mitigates fixation and replay risk.
- Supports clean revocation after incident response.

---

### Implementation outline

- Update last_seen_at on validated requests.
- Enforce idle and absolute expiry on every auth check.
- Rotate session token on interval and high-risk events.

## 10) Audit Logging

### Options considered

- Application logs only:
  - Pros: easy startup.
  - Cons: poor queryability and weak compliance posture.
- Dedicated audit table plus SIEM export:
  - Pros: durable forensic trail.
  - Cons: additional storage and pipeline management.

### Recommended choice

Dedicated audit_logs table now, with downstream SIEM export when operations scale.

### Why this is best

Meets immediate healthcare traceability needs and preserves future observability expansion.

### Tradeoffs

- More disciplined schema governance and retention management required.

### Events to log

- login success
- logout
- failed login
- password reset request
- password reset success
- role assignment or removal
- session revocation

### Recommended audit design

Use audit_logs table as append-only application trail.

Required event attributes:

- timestamp
- actor
- target
- event type
- outcome
- source IP
- request id
- metadata

### Healthcare compliance notes

- Access and auth events must be reviewable for incident investigation.
- Logs should be immutable in downstream storage (for example SIEM or WORM bucket policy).
- Restrict who can view audit data.

### Security considerations

- No PHI in free-form metadata unless strictly necessary.
- Redact credentials and tokens from logs.

---

### Implementation outline

- Emit structured audit events from auth service and guards.
- Enforce immutable append-only writes from application tier.
- Build review dashboards and alert triggers for anomalous events.

## 11) Login Rate Limiting

### Options considered

- IP-only limiting:
  - Pros: easy and cheap.
  - Cons: weak against distributed attacks and targeted account abuse.
- Account-only limiting:
  - Pros: strong account protection.
  - Cons: can be abused for denial against known users.
- Combined IP plus account plus backoff:
  - Pros: best defensive balance.
  - Cons: more state management complexity.

### Recommended choice

Combined limits with exponential backoff.

### Why this is best

Balances brute-force resistance with operational availability.

### Tradeoffs

- Requires careful tuning to avoid user lock frustration.

### Controls

- IP-based limits:
  - protects against broad brute force attempts.
- Account-based limits:
  - protects against focused attacks on one user.
- Exponential backoff:
  - slows repeated failures.

### Recommended thresholds

- IP limit: 20 attempts per 5 minutes per IP on login endpoint.
- Account limit: 5 failed attempts per 15 minutes per account.
- Backoff progression: 0 sec, 2 sec, 5 sec, 15 sec, 30 sec, then temporary lock.

### Brute force vs DoS balance

- Do not permanently block on first bursts.
- Prefer temporary lock and backoff.
- Allow password reset flow even during lock with abuse controls.

### Implementation outline

- Use Redis counters for distributed rate-limit state when multiple API replicas.
- For smaller deployments, start with DB counters plus in-memory shield, then migrate to Redis.

### Security considerations

- Return generic errors regardless of whether account exists.
- Do not reveal remaining attempts in API responses.

---

### Implementation outline

- Maintain counters in Redis for distributed deployments.
- Apply independent IP and account windows.
- Emit abuse telemetry to security monitoring.

## 12) Security Hardening

### Options considered

- Baseline controls only:
  - Pros: faster ship.
  - Cons: elevated auth attack surface.
- Layered hardening set:
  - Pros: strong defense-in-depth.
  - Cons: moderate implementation complexity.

### Recommended choice

Layered hardening set in Phase 2.

### Why this is best

Authentication is the trust boundary and must be robust before patient workflows.

### Tradeoffs

- More testing and operational tuning required.

### Required controls

- CSRF protection:
  - double-submit token on mutating endpoints.
- Session fixation protection:
  - issue new session token on login and privilege changes.
- Timing attack protection:
  - consistent response timing and constant-time compares for secrets.
- Email enumeration protection:
  - same login/reset responses for existing and non-existing users.
- Password reset token security:
  - random high-entropy token, hashed at rest, short expiry, one-time use.

### Additional recommendations

- CSP and strict security headers at proxy.
- Device and geovelocity anomaly alerts for privileged users.
- Optional MFA path design for future enterprise onboarding.

---

### Implementation outline

- Build hardening checklist into release criteria.
- Add automated tests for CSRF, fixation, and enumeration paths.
- Run periodic security review on auth endpoints.

## 13) Auth Flow Diagram

### Options considered

- Opaque diagram with minimal detail:
  - Pros: short documentation.
  - Cons: ambiguous implementation.
- Explicit stepwise flow for each auth path:
  - Pros: clear and testable.
  - Cons: longer documentation.

### Recommended choice

Explicit stepwise flow with login, request, logout, and expired-session paths.

### Why this is best

It maps directly to implementation tasks and security test cases.

### Tradeoffs

- Requires updates when auth behavior changes.

### Login flow

1. User submits email and password.
2. API normalizes email and checks lockout/rate-limit state.
3. API fetches user and verifies Argon2id hash.
4. API creates session row and CSRF secret.
5. API sets HttpOnly secure session cookie.
6. API writes login success audit event.
7. API returns authenticated user profile and roles.

### Request flow

1. Browser sends session cookie.
2. API reads and hashes session token.
3. API validates session status and timeouts.
4. API loads user roles.
5. Guard checks permissions.
6. Route executes.

### Logout flow

1. User calls logout endpoint.
2. API revokes current session.
3. API clears cookie.
4. API writes logout audit event.

### Expired session flow

1. Request arrives with expired session cookie.
2. API rejects as unauthorized.
3. API clears cookie and returns auth required response.
4. Frontend redirects to login.

---

### Implementation outline

- Translate each flow into API contract tests.
- Validate failure-path behavior in frontend redirects.

### Security considerations

- Verify no flow leaks account existence.
- Ensure logout and expiry both clear cookies.

## 14) Final Deliverables

### Options considered

- Keep recommendations fragmented across multiple docs.
- Consolidate all decisions into one phase document.

### Recommended choice

Consolidate in one phase document, with implementation sequence at the end.

### Why this is best

Improves execution clarity and reduces ambiguity for engineering and security reviews.

### Tradeoffs

- Longer single document to maintain.

### 1. Final recommended architecture

- Local email/password auth now with SSO-ready identity model.
- Argon2id password hashing with strong parameters.
- Opaque database-backed sessions in HttpOnly cookies.
- RBAC foundation with staff, manager, admin, service_account roles.

### 2. Auth flow diagram

- Included in Section 13 as login, request, logout, and expired-session flows.

### 3. Database schema

- users, roles, user_roles, sessions, service_accounts, audit_logs specified in Section 5.

### 4. Middleware structure

- requireAuth, requireRole, requireServiceAccount with strict guard order in Section 7.

### 5. Frontend auth structure

- Login page, Auth provider, protected layout, route policy in Section 8.

### 6. Cookie settings

- Exact secure production defaults in Section 4.

### 7. Security defaults

- CSRF, fixation defense, timing-safe operations, enumeration resistance, reset security in Section 12.

### 8. Future SSO migration plan

- Provider abstraction and auth_identities expansion path in Section 1.

### 9. Common mistakes

- Mixing JWT and cookie sessions without clear revocation model.
- Storing tokens in localStorage.
- Skipping account-based lockout.
- Logging sensitive auth artifacts.
- Inconsistent role checks across services.

### 10. What not to do

- Do not use long-lived bearer tokens for browser auth.
- Do not trust frontend role checks as authorization.
- Do not keep plaintext session tokens in database.
- Do not allow broad admin role by default assignment.
- Do not defer audit logging until after patient workflows launch.

---

### Security considerations

- Treat this document as a security baseline, not optional guidance.
- Any deviation should require explicit risk acceptance.

### Implementation outline

- Convert each deliverable section into tracked engineering tickets.
- Gate go-live on completion of mandatory controls.

## Implementation Sequence for Phase 2

1. Replace current mixed token flow with opaque session cookie flow as primary browser auth.
2. Introduce updated users, roles, user_roles, sessions, and audit_logs schema.
3. Add auth guards and role guards to all protected API modules.
4. Add login throttling and account lock controls.
5. Implement frontend protected layout and session bootstrap.
6. Add operational dashboards for auth failures and session revocations.
7. Add auth_identities and service_accounts scaffolding for future SSO and machine auth.
