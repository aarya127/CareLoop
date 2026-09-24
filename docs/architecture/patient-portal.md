# Patient portal

> Status: 2026-09 · Scope: how patients get their own login, distinct from staff
> accounts. Companion to [`onboarding-and-team.md`](onboarding-and-team.md) (staff
> accounts) and [`security.md`](security.md).

## Why a second, separate principal type

Before this, CareLoop had exactly one account system: practice staff (`User` +
`Session`, scoped by `practiceId`, RBAC via `Role`/`UserRole`). Patients existed only
as clinical/demographic data rows (`Patient`) — no email, password, or session of
their own. The only patient-facing flow was `/intake`, a capability-token form that
collects data but never issues a login.

The patient portal adds a **second, structurally separate** principal type rather than
reusing `User`/`Session`:

|                       | Staff                       | Patient portal                        |
| --------------------- | --------------------------- | ------------------------------------- |
| Credential table      | `User`                      | `PatientCredential`                   |
| Session table         | `Session`                   | `PatientSession`                      |
| Session cookie        | `cl_session`                | `cl_patient_session`                  |
| Guard                 | `SessionAuthGuard` (global) | `PatientAuthGuard` (opt-in per route) |
| Request property      | `req.user`                  | `req.patient`                         |
| Redis cache namespace | `sess:v1:`                  | `psess:v1:`                           |

This follows a convention already in the codebase: `ServiceAccountGuard` sets
`req.serviceAccount`, never unioned into `req.user`, and `AuthIdentity` (OAuth linking)
is its own table off `User` rather than columns bolted onto it. For a PHI-handling app,
keeping the two principal types structurally incapable of being confused — a
TypeScript/Prisma type error, not a runtime bug, if the code paths ever cross — is
worth the duplication. `PatientAuthGuard` reads **only** the patient cookie (or a
Bearer token for the web BFF's server-to-server calls); it has no fallback to the staff
cookie, and vice versa.

## Enrollment: practice-invited only

There is no open self-serve patient signup — a staff member (front-office role or
above) invites an **existing** `Patient` record, mirroring the staff
`/join/<token>` flow:

| Step    | Endpoint                                                                               | Auth                                                                                                       |
| ------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Invite  | `POST /patient-auth/invitations` (web: "Invite to Portal" button on the patient chart) | Staff session, `FRONT_OFFICE_ROLES` (`admin`\|`manager`\|`staff`), scoped to the caller's own `practiceId` |
| Preview | `GET /patient-auth/invitations/accept/:token`                                          | Public (token)                                                                                             |
| Accept  | `POST /patient-auth/invitations/accept/:token` (web `/portal/join/<token>`)            | Public (token)                                                                                             |

`Patient` has no `email` field of its own (it's a pure clinical/demographic record) —
staff supply the address at invite time; it becomes the portal login email on accept.
The invite token is random, stored **hashed** (`PatientInvitation.tokenHash`, same
approach as `Session`), 7-day expiry, single-use — a second accept 404s. Creating an
invite rejects (409) if the target patient doesn't belong to the caller's practice
(forged-`patientId` protection) or if the email is already used by another portal
account. `PatientCredential.email` is globally unique (mirrors `User.email`), because
`/portal/login` has no practice context up front — so the same email can't be used for
two different patients' portal accounts, even across practices.

## Login

`POST /patient-auth/login` — email + password, bcrypt (same `hashPassword`/
`verifyPassword` utilities as staff), lockout after 5 failed attempts for 15 minutes
(`PATIENT_AUTH_LIMITS`, deliberately a separate constant from staff's `AUTH_LIMITS` so
tuning one can't accidentally affect the other). `GET /patient-auth/me` and
`POST /patient-auth/logout` round out the session lifecycle.

## Password reset

Symmetric with staff (see [`onboarding-and-team.md`](onboarding-and-team.md#password-reset)),
using its own token table (`PatientPasswordResetToken`, not shared with staff's
`PasswordResetToken`):

| Step    | Endpoint                                   |
| ------- | ------------------------------------------ |
| Request | `POST /patient-auth/forgot-password`       |
| Preview | `GET /patient-auth/reset-password/:token`  |
| Reset   | `POST /patient-auth/reset-password/:token` |

`forgotPassword` always resolves the same way whether or not the email matches a
portal account (no enumeration — same principle as login's identical error for
"unknown email" vs "wrong password"). Tokens are hashed, 1-hour TTL, single-use.
A successful reset calls `PatientSessionService.revokeAllPatientSessions` (revokes
every existing session for that patient, mirroring
`SessionService.revokeAllUserSessions`) before issuing a fresh one, so a leaked old
session cookie can't survive a reset.

## Tenant / record isolation

`req.patient.patientId` and `req.patient.practiceId` come only from the validated
`PatientSession` row — never client input. There's no other patient-facing data
endpoint yet (see Out of scope below), so `GET /patient-auth/me` is currently the only
reference implementation of this pattern; any future one should follow the existing
manual `where: { practiceId, ... }` convention already used everywhere else
(`patients.service.ts`'s `assertPatientInPractice`), scoped further to the patient's
own `patientId`.

## Out of scope (v1)

- Real patient-facing data views (appointments, documents, billing) — `/portal/dashboard`
  is a static placeholder.
- Self-serve patient signup (excluded by product decision — see Enrollment above).
- MFA, OAuth/social login, magic links.
- Guardian/multi-patient accounts — one `PatientCredential` per one `Patient` only.
- "Sign out everywhere" / session-list UI for patients (staff has this at
  `GET`/`DELETE /auth/sessions`; not mirrored here yet).

## Tested by

`patient-auth.service.spec.ts` and `patient-password-reset.spec.ts` (invite/accept/
login/reset business logic — mocked Prisma, security-relevant edge cases: forged
`patientId`, expired/reused/revoked tokens, lockout, no-enumeration), plus
`patient-auth.tenant.spec.ts` (guard derives `req.patient` only from the session, never
client input; a disabled portal account is rejected outright).
