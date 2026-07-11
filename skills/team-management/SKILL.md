# Skill Name: team-management

## Description
Invite people to join a practice by email and let them accept to create their own staff
account — without a shared password. Wraps the `invitations` module. Complements
`authentication` (login/sessions) and the admin-only `POST /auth/register`.

## Domain
Team & membership (staff onboarding).

## Dependencies
- **API:** `invitations` controller — base `/invitations` (`apps/api/src/modules/invitations/`)
- **Services:** `InvitationsService` (uses `SessionService` to start a session on accept,
  `EmailService` to send the invite, `renderInvite` template)
- **Tables:** `Invitation` (`email`, `role`, `tokenHash`, `status`, `expiresAt`, `acceptedUserId`)
- **Infra:** Postgres; SMTP (optional — the shareable link is always returned)

---

## 2. Capability Overview
An admin/manager invites someone (`POST /invitations`) with an email + role; the service stores
a **hashed** single-use token, emails the accept link (best-effort), and returns the link. The
invitee previews the invite (`GET /invitations/accept/:token`, public) and accepts
(`POST /invitations/accept/:token`, public) by setting a name + password — which creates their
`User` in the inviting practice with the invited role and starts a session. Admins can list and
revoke pending invites.

## 3. Step-by-Step Execution Logic
1. **Create** (admin/manager): `POST /invitations { email, role }`. Rejects if a user with that
   email already exists; supersedes any prior pending invite for that email. Returns
   `{ id, email, role, status:'pending', expiresAt, acceptUrl, emailSent }`.
2. **Preview** (public): `GET /invitations/accept/:token` → `{ email, role, practiceName }`, or
   404 (missing/revoked/accepted) / 410 (expired).
3. **Accept** (public, rate-limited): `POST /invitations/accept/:token { firstName, lastName,
   password }` → creates the `User` (invited role, same practice), marks the invite `accepted`
   (single-use — a second accept 404s), returns `{ user, sessionToken }`.
4. **Manage** (admin/manager): `GET /invitations` (pending), `POST /invitations/:id/revoke`.

## 4. Inputs & Outputs
### Inputs
- Create: `email` (valid email), `role` ∈ `{staff, manager, admin, provider, hygienist}`.
- Accept: `firstName`, `lastName`, `password` (min 8). `practiceId`/role come from the token — never the body.
### Outputs
```json
// POST /invitations → 201
{ "id": "inv_…", "email": "x@clinic.com", "role": "staff", "status": "pending",
  "expiresAt": "2026-07-17T…", "acceptUrl": "https://app/join/<token>", "emailSent": true }
```

## 5. Tools / APIs Used
- `POST /invitations`, `GET /invitations`, `POST /invitations/:id/revoke` (admin/manager)
- `GET /invitations/accept/:token`, `POST /invitations/accept/:token` (public)
- Web: admin `/admin/team`, public `/join/[token]`

## 6. Edge Cases & Failure Handling
- **Email already a user** → `409`: they should log in, not be invited.
- **Expired token** → `410`; **revoked/accepted/unknown** → `404`. Tokens are single-use.
- **SMTP down/unset** → invite still succeeds (`emailSent:false`); share the returned `acceptUrl` manually.
- **RBAC** → create/list/revoke require management (`admin`/`manager`); accept is public (token is the capability).
- **Tenancy** → the accepted user always joins the inviter's practice; the invite carries `practiceId`, not the client.

## 7. Example Usage
- **Request:** `POST /invitations {"email":"newhire@clinic.com","role":"staff"}` → share `acceptUrl`.
- **Agent reasoning:** "To add a teammate I create an invite and hand them the link; they set their
  own password and land in my practice as staff. I never set or transmit their password."
