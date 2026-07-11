# CareLoop — AI Agent Skill Library

Domain-clustered, AI-executable capability modules derived from the actual CareLoop
codebase (NestJS API on `:3001`, Next.js web/BFF on `:3000`, BullMQ worker, Prisma/Postgres,
Redis, S3). One skill = one meaningful capability, not one-per-file.

> **Grounding rule:** every skill references real routes (`apps/api/src/modules/**`),
> real Prisma models (`packages/db/prisma/schema.prisma`), and real services. Where a
> capability is **modeled but not wired** (Stripe payment processor, real-time chat, LLM
> summarization), the skill says so explicitly under *Edge Cases & Failure Handling* —
> agents must not assume those endpoints exist. (Now wired: insurance **claims** — `claims`
> module, minus a real clearinghouse — plus self-serve **signup** and team **invitations**.)

## 1. Codebase map → domains

| Domain | Source modules | Primary tables |
|---|---|---|
| Authentication & sessions | `auth` | `User`, `Session`, `UserRole`, `AuditLog` |
| Team & membership | `invitations` (+ `auth` signup/register) | `Invitation`, `User`, `Practice` |
| Scheduling & availability | `appointments` (+ `availability.service`) | `Appointment`, `AppointmentHold`, `ProviderSchedule`, `AvailabilityBlock` |
| Patient intake & records | `intake`, `patients` | `IntakeDraft`, `IntakeSubmission`, `Patient` |
| Document handling | `documents` | `Document` (S3) |
| Billing & payments | `billing`, `payments`, `treatments` | `Invoice`, `PaymentRecord`, `TreatmentRecord` |
| Insurance & claims | `insurance`, `claims` | `PatientInsurance`, `Claim`, `ClaimLine`, `ClaimStatusEvent` |
| Notifications & reminders | `messaging`, `reminders` + worker | `Reminder`, `WebhookLog` |
| Voice AI assistant | web `app/api/voice/**`, worker transcript processors | `CallTranscript`, `CallTranscriptSegment` |
| Analytics & reporting | `analytics` + worker KPI processors | `PracticeKPI`, `AnalyticsResult` |
| Audit & compliance | `audit` | `AuditLog` |

**Clustering logic:** modules that share a table cluster and a single user-facing outcome
are merged into one skill (e.g. `billing` + `payments` + `treatments` → one
*billing-and-payments* skill, because an invoice's lifecycle spans all three). Modules with
distinct outcomes stay separate even when they share infrastructure (e.g. *notifications*
and *voice-assistant* both use Twilio but serve different capabilities).

## 2. Skill inventory

| Skill | Purpose | System dependency |
|---|---|---|
| [authentication](authentication/SKILL.md) | Log users in/out, self-serve signup, manage sessions, enforce RBAC | `auth` API, bcrypt, Redis, Postgres |
| [team-management](team-management/SKILL.md) | Invite people to a practice by email; accept → new staff account | `invitations` API, SMTP, Postgres |
| [scheduling](scheduling/SKILL.md) | Find open slots and book/reschedule/cancel appointments | `appointments` API, Redis cache, Postgres |
| [patient-intake](patient-intake/SKILL.md) | Capture/submit new-patient intake and create patient records | `intake`/`patients` API, Postgres |
| [document-handling](document-handling/SKILL.md) | Upload/retrieve patient documents via presigned S3 URLs | `documents` API, S3/MinIO |
| [billing-and-payments](billing-and-payments/SKILL.md) | Issue invoices and record payments | `billing`/`payments` API, Postgres |
| [insurance-verification](insurance-verification/SKILL.md) | Store/look up coverage, structured benefits, and file/track claims | `insurance`/`claims` API, Postgres |
| [notifications-and-reminders](notifications-and-reminders/SKILL.md) | Send/schedule SMS + email reminders | `messaging`/`reminders` API, Twilio, SMTP, BullMQ |
| [voice-assistant](voice-assistant/SKILL.md) | Drive AI phone calls: availability, booking, transcripts | web voice API, ElevenLabs, Twilio |
| [analytics-reporting](analytics-reporting/SKILL.md) | Query practice KPIs and dashboards | `analytics` API, Postgres |
| [audit-and-compliance](audit-and-compliance/SKILL.md) | Query the immutable audit trail | `audit` API, Postgres |

## 3. Architecture insights
See [ARCHITECTURE-INSIGHTS.md](ARCHITECTURE-INSIGHTS.md).

## Conventions used by every skill
- **Base URL:** API skills target the NestJS service (`API_BASE_URL`, default `http://localhost:3001`). Some are also reachable via the Next.js BFF on `:3000`.
- **Auth:** send the `cl_session` httpOnly cookie; mutations also require `X-CSRF-Token`. Lockout returns `423`; unauthenticated returns `401`.
- **Tenancy:** every request is scoped by `practiceId`. An agent must never act across practices.
- **Idempotency:** POSTs that create money/side-effects accept `X-Idempotency-Key`.
