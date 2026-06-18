# CareLoop — Architecture Review, Scope Decision & Production Roadmap

> **Status:** Review (2026-06) · Author: Staff-level architecture review · Scope: whole monorepo
>
> **Reality check.** This is **not** an incomplete scaffold. CareLoop is a mature, multi-tenant
> dental practice-management SaaS: NestJS+Fastify API (~20 modules), a BullMQ worker (10
> processors), a Next.js 15 / React 19 web app, a strong Prisma model, and full
> k8s/Terraform/nginx infra with ADRs and runbooks. The real risks are **(1) a green CI that
> runs zero tests, (2) an inconsistent web↔API boundary, (3) capabilities modeled in the schema
> but never integrated, and (4) a product-scope question the code can't answer.** Every claim
> below is tied to a file in the repo.

---

## 0. SCOPE & SEQUENCING DECISION (gates everything else)

The brief assumes a **patient-facing** product (patient accounts, patient↔doctor chat,
patient-submitted requests). The code models **patients as records, not users**: only clinic
staff authenticate (`User` is scoped to a `Practice`; `Patient` has no `email`/`passwordHash` —
`packages/db/prisma/schema.prisma:201`). So patient-facing flows are **net-new product**, not
bug fixes. This is a product/go-to-market decision, not an architecture one.

### Discovery outcome
- **Buyer/user:** both sides eventually (two-sided vision).
- **Core outcome:** "all of them" — fill schedule, cut phone load, get paid faster, engagement.
- **Patient behavior today:** *little/none — patients call or walk in.* ← the only hard market signal.
- **Wedge:** "all of them" — not yet chosen.

### Why these answers resolve to "staff-first hybrid"
Three of the four desired outcomes already live entirely on the **staff/clinic side**:

| Outcome | Where it lives | Status |
|---|---|---|
| Fill schedule / fewer no-shows | Staff-side (availability, reminders, GCal) | ✅ Strongest part of the codebase |
| Cut front-desk phone/admin load | Staff-side (ElevenLabs + Twilio voice intake) | ✅ Real, substantial |
| Get paid faster | Staff-side (billing, claims, payments) | ⚠️ Modeled, **not** wired (no Stripe, no claims) |
| Patient engagement / retention | **Patient-side (portal/chat)** | ❌ Not built — *and demand is unproven (Q3)* |

"All of them" therefore does **not** mean "build both sides now." Only the *engagement* outcome
needs a patient portal, and it's the one the market isn't asking for yet. A two-sided product
with no chosen wedge and no proven patient demand is the classic way to ship two mediocre halves.

### Decision
**Hybrid — staff-first, patient portal deferred to an evidence-gated Phase 2.**

- **Phase 1 (now):** harden + complete the staff-facing product → tests, BFF boundary, then
  **Stripe + claims** (highest-value new build; serves "get paid faster"; depends on zero
  unproven patient demand).
- **Phase 2 (triggered, not scheduled):** patient portal — separate auth realm, self-serve
  intake/booking, patient↔provider messaging.

### Triggers that flip Phase 2 "on" (watch signals, don't guess a date)
- Clinics start asking "can patients book/pay/message online?" in sales calls (Q3 flips from
  "call/walk-in" → "table-stakes").
- A measurable share of AI phone calls are routine self-serve actions (booking, reschedule,
  balance check) — measurable today from `CallTranscript` data you already capture.
- A design-partner clinic commits to driving its patients to the portal. Don't build a
  two-sided product with only one side present.

---

## 1. SYSTEM DIAGNOSIS

### 1.1 CI is green but tests do not exist (biggest finding)
- `.github/workflows/ci.yml:57` defines a full `test` job (Postgres + Redis services,
  `prisma migrate deploy`, then `turbo run test`).
- **Zero test files exist** (`*.spec.ts` / `*.test.ts` / `*.e2e-spec.ts` = 0 outside
  `node_modules`) and **no test runner** is installed (no Jest/Vitest/Playwright in any
  `package.json`; `@nestjs/testing` is present but unused).
- `turbo run test` passes **vacuously** — no workspace defines a `test` script, so Turbo finds
  nothing and reports success. This manufactures false confidence for a system handling clinical
  and payment data. **Worse than no CI.**

### 1.2 Inconsistent backend boundary
Two HTTP surfaces exist:
- **NestJS API** (`apps/api/src`): auth, appointments, billing, payments, insurance, documents,
  intake, treatments, analytics, audit.
- **Next.js route handlers** (`apps/web/app/api`): voice/telephony, Google Calendar, analytics
  dashboard, vector search, settings.

The boundary is **inconsistent**, not duplicated. `apps/web/app/api/auth/login/route.ts:18` is a
thin BFF proxy (`fetch(${API_URL}/auth/login)`) — good. But other web routes (voice tools,
calendar, analytics) talk to **Prisma directly**, bypassing NestJS guards, the audit
interceptor, idempotency service, and rate limiter. Clinical writes can enter through two doors
with two security postures.

### 1.3 "Modeled but not wired" integrations
Dependency + code probe = 0 hits each in any `package.json`: **Stripe, socket.io/ws,
@modelcontextprotocol, @sendgrid / SES, openai, anthropic, firebase, web-push.**
- **Payments:** `Invoice`/`PaymentRecord` (`schema.prisma:671-724`) model `method`,
  `transactionRef`, `status` — but no Stripe SDK. A ledger with no processor; PCI scope unmet.
- **Secure messaging (brief's "core feature"):** `Conversation`/`Participant`/`Message` are
  marked `// FUTURE` (`schema.prisma:547`). The `messaging` module is *outbound notifications*
  (`email.service.ts`, `twilio.service.ts`, `reminders.service.ts`) — not chat. No WebSocket
  gateway. "Real-time" = Google Calendar push webhooks + polling.
- **Push:** `Reminder.channel` allows `"push"` (`schema.prisma:764`) but no FCM/web-push transport.
- **Email:** `nodemailer` (raw SMTP) — no managed deliverability / bounce handling.
- **AI/LLM:** `CallTranscript.transcriptEmbedding` + `/api/vector/search` exist, but no
  LLM/embeddings SDK. Summarization / smart replies / document interpretation / MCP scheduling
  are aspirational. (ElevenLabs voice + Twilio telephony **are** real.)

### 1.4 Product-scope mismatch
See §0. CareLoop today is a staff-facing PMS with AI phone intake; the brief describes a
patient marketplace. Resolved as **staff-first hybrid**.

### 1.5 Smaller but real
- **Secret-handling smell:** `README.md:28-29` reads secrets "from `key.txt` first" — a
  plaintext secrets file is a HIPAA red flag and contradicts the Secrets-Manager guidance in
  `docs/need-to-do.md:68`.
- **Stale README:** hardcodes a `/Users/.../Desktop` path and a single-app `localhost:3000`
  model that doesn't match the multi-service compose file.
- **Config drift:** `apps/api/src/main.ts:38-43` validates `COOKIE_SECRET`/`SESSION_TTL_SECONDS`;
  docs list `JWT_SECRET`/`ENCRYPTION_KEY`. Required-secret set isn't single-sourced.
- **Global roles:** `Role`/`UserRole` (`schema.prisma:92-113`) aren't practice-scoped — fine for
  now, but the cross-tenant invariant must be documented and tested.
- **`.next/` build output is committed** — should be gitignored.

---

## 2. FULL SYSTEM ARCHITECTURE DESIGN

### As-built vs target

| Layer | As-built (verified) | Verdict / target |
|---|---|---|
| Frontend | Next.js 15, React 19, Tailwind v4, TanStack Query, Zustand, FullCalendar, Recharts | Keep; add design-token layer (§3.8) |
| BFF | Next.js route handlers — mix of proxy + direct-Prisma | Make it a **pure BFF**: proxy only, no DB writes |
| Core API | NestJS 10 on Fastify; auth/roles/service-account/session guards, `ValidationPipe`, `HttpExceptionFilter`, `LatencyInterceptor`, Redis throttler, idempotency service | Strong; make it the **single** write path |
| Worker | BullMQ, 10 processors + `FailedJob` DLQ | Strong; add DLQ-depth alerting |
| DB | Postgres 16, Prisma, multi-tenant by `Practice`, FTS + composite indexes | Strong; add tenant-scoping guard (§6) |
| Cache/Queue | Redis 7 (sessions, throttling, BullMQ) | Keep |
| Storage | S3 (`@aws-sdk/client-s3`) + presigned URLs; MinIO locally | Keep |
| Auth | Server-side sessions (hashed token + CSRF secret, idle+absolute expiry, rotation, revocation), lockout, `AuthIdentity` OAuth, argon2+bcrypt | Strong, healthcare-grade; confirm bcrypt→argon2 migration complete |
| Infra | k8s (deployments, HPA, default-deny ingress/egress NetworkPolicies, cert-manager, ingress-nginx), Terraform per-env, nginx LB | Strong |
| CI/CD | GH Actions: lint+typecheck+format, build, "test" | **Test stage is a no-op — fix first** |
| Payments | Ledger only | **Add Stripe** |
| Messaging (chat) | `// FUTURE` stub | Build in Phase 2 (or descope) |
| AI/LLM | ElevenLabs voice real; LLM absent | Add LLM provider — **default Claude** (`claude-opus-4-8` reasoning/summarization; `claude-haiku-4-5` cheap classify/redact); pin model IDs, per-feature token budgets, PII-redact before calls, disable provider retention |
| Observability | `LatencyInterceptor`, pino; Sentry/Datadog referenced in docs | Wire Sentry + Prometheus/OTel for real |

### Target topology
`Browser → Next.js (BFF, proxy-only) → NestJS API (all auth/RBAC/audit/idempotency) →
Postgres / Redis / S3`; `NestJS → BullMQ → Worker`; external webhooks (Twilio/Stripe/Google) →
dedicated NestJS webhook controllers → `WebhookLog` (idempotent) → enqueue jobs.

---

## 3. MODULE-BY-MODULE FIX PLAN

### 3.0 Coverage of all 15 brief modules

| # | Module | Status in code | Action | Phase |
|---|---|---|---|---|
| 1 | Auth & accounts | ✅ Strong (sessions, lockout, OAuth) | Tune hashing, add tests | P0 |
| 2 | Onboarding / role home | ⚠️ Staff roles only | Role-based routing; patient realm later | P1/P2 |
| 3 | Scheduling / doctor tracking | ✅ Availability strong | Add check-in status + live push | P1 |
| 4 | Patient request / intake | ✅ Intake + drafts wired | Harden; expose to patients in P2 | P1/P2 |
| 5 | Secure messaging (chat) | ❌ `// FUTURE` | Build WS gateway + persistence | P2 |
| 6 | Automated messaging / reminders | ✅ BullMQ + DLQ | Templates, retry metrics, tests | P1 |
| 7 | Notifications | ⚠️ SMS ok; email SMTP; push none | SES/SendGrid; push only if portal | P1/P2 |
| 8 | UI/UX | ⚠️ `packages/ui` underused | Token system, zod validation, a11y | P1 |
| 9 | Email | ⚠️ raw SMTP | Provider + bounce handling | P1 |
| 10 | Insurance & claims | ⚠️ Coverage yes, **claims no** | Add `Claim` models + endpoints | P1 |
| 11 | Payments | ⚠️ Ledger only | Stripe + webhooks | P1 |
| 12 | AI agent layer | ⚠️ Voice yes; LLM/MCP no | Claude summarization; MCP later | P2 |
| 13 | Testing | ❌ none | Full pyramid | P0 |
| 14 | Performance | ⚠️ measured, not tuned | Pool, SLAs, DLQ alerts | P0/P1 |
| 15 | Documentation | ✅ Good; stale README | OpenAPI/Swagger; fix README | P1 |

### 3.1 Auth & Accounts
- **Problem:** Solid session auth already exists. "Login latency" is most likely *inherent*
  (argon2/bcrypt are deliberately slow ~100-300 ms) plus the double hop
  browser→Next→Nest→DB — not a bug. No tests guard any of it.
- **Solution:** Confirm argon2 params are tuned (not maxed); ensure failed-login lookups use
  `@@index([status, lockedUntil])`; keep the proxy hop but measure via `LatencyInterceptor`;
  add the missing tests (login, lockout, session rotation, CSRF).
- **Stack:** NestJS, argon2, Prisma, Redis, Vitest + Supertest.
- **Steps:** instrument → benchmark hash cost → tune → unit+integration tests → document SLA
  (p95 login < 400 ms).

### 3.2 Onboarding & Role-based Home
- **Problem:** Brief wants Patient/Doctor/Office signup; code has staff `User` + global roles, no
  patient identity.
- **Solution:** Implement role-based landing routing off `UserRole` now (P1). Patient signup is a
  **separate `patient_portal` auth realm** in Phase 2 — do **not** overload the staff `User` table.

### 3.3 Scheduling & "when is the doctor coming in?"
- **Problem:** Availability is well-modeled (`ProviderSchedule`, `AvailabilityBlock`,
  `AppointmentHold` with `expiresAt`, GCal sync). "Real-time arrival" isn't a concept yet.
- **Solution:** Add a provider check-in/status event (arrived / running-late / in-room) pushed
  over the live transport chosen in §3.5. MCP/AI scheduling layers on `availability.service.ts`
  later — not a rewrite.

### 3.4 Patient Request / Intake
- **Problem:** `IntakeSubmission` + `IntakeDraft` (with `idempotencyKey`) exist and are wired;
  document attach (`Document` + S3 presign) exists.
- **Solution:** Keep + harden; add tests for draft→submit idempotency. Expose to patient realm in
  Phase 2.

### 3.5 Communication / Secure Messaging (Phase 2)
- **Problem:** `Conversation/Participant/Message` are `// FUTURE`; no WS transport.
- **Solution:** Build a chat service: NestJS WebSocket gateway (`@nestjs/websockets` +
  `socket.io` or native `ws`) with a **Redis adapter** for multi-replica fan-out (you already
  run 2 API replicas); persist via existing models; file-share reusing `Document` + S3 presign;
  audit via `AuditLog`; AI assist (summarize/suggest) via Claude.
- **Steps:** gateway + Redis pub/sub → persistence/pagination → file attach → audit → AI assist.

### 3.6 Automated Messaging / Reminders (keep + harden)
`reminders.processor.ts` + `reminder-scan.processor.ts` + `Reminder` + DLQ are in place and
event-driven. Add: templated content store, per-channel retry/backoff metrics, tests.

### 3.7 Notifications
- **Problem:** SMS (Twilio) real; email = raw SMTP; push unimplemented.
- **Solution:** Swap nodemailer for **SES or SendGrid** behind the existing `email.service.ts`
  interface; handle bounces/complaints via webhook → `WebhookLog`. Add web-push/FCM only if the
  patient portal ships (Phase 2).

### 3.8 UI/UX
- **Problem:** color/validation inconsistency; `packages/ui` exists but adoption isn't enforced.
- **Solution:** Centralize Tailwind v4 tokens in `packages/ui`, enforce via lint; standardize
  form validation on the `zod` already in deps; a11y pass (labels, focus, contrast).

### 3.9 Email System
See §3.7 — provider swap + retry + logging via `WebhookLog`.

### 3.10 Insurance & Claims (OHIP)
- **Problem:** `PatientInsurance` (encrypted `memberIdEnc`, `memberIdHash` lookup,
  `coverageSummary`) = eligibility/coverage, good. **No `Claim` model** — submission /
  adjudication / rejection tracking absent.
- **Solution:** Add `Claim` + `ClaimLine` + `ClaimStatusEvent` (audit trail, rejection codes) on
  an OHIP-compatible structure; submit/status endpoints in the `insurance` module; treat the
  clearinghouse as a webhook source (`WebhookLog`).

### 3.11 Payments
- **Problem:** Ledger without a processor.
- **Solution:** Integrate **Stripe** (PaymentIntents + webhooks → `WebhookLog`, idempotent via
  the existing `idempotency.service.ts`). Never touch raw PAN — Stripe Elements/tokenization
  keeps you out of PCI scope. Reconcile `PaymentRecord.transactionRef` to Stripe IDs.
- **Stack:** `stripe` (server) + Stripe.js (web).

### 3.12 AI Agent Layer (Phase 2)
Add an LLM provider (**Claude**, model IDs pinned) for transcript + intake summarization and
analytics insights; generate `transcriptEmbedding` for the existing `/api/vector/search`. MCP is
a legitimate orchestration choice for agentic scheduling but ships **after** deterministic
scheduling + tests.

### 3.13 Testing
See §4 (P0).

### 3.14 Performance
See §6.

### 3.15 Documentation
ADRs/architecture/runbooks are genuinely good. Fix the stale README + `key.txt` guidance,
single-source the required-secret list, and add **OpenAPI/Swagger** (`@nestjs/swagger`) —
currently absent.

---

## 4. TESTING STRATEGY (P0)

| Level | Tool | First targets (highest risk) |
|---|---|---|
| Unit | **Vitest** | `auth` (lockout, session rotation, CSRF); `payments` (amount/idempotency); `availability.service` (slot/conflict math); `idempotency.service` |
| Integration | Vitest + **Supertest** against NestJS, real Postgres+Redis (Testcontainers or the CI services already configured) | login flow; intake draft→submit idempotency; reminder enqueue→send; webhook dedup via `WebhookLog`; **tenant isolation** (cross-`Practice` access must 403) |
| E2E | **Playwright** | staff login → patient → appointment lifecycle; intake submission; (patient journey *if* Phase 2 ships) |
| Contract | typed client / OpenAPI snapshot | guard the Next.js BFF ↔ NestJS boundary |

**First steps:** add Vitest + a real `test` script to each workspace (so `turbo run test` stops
being a no-op) → write auth + tenant-isolation suites → gate merges on coverage of
`auth`/`payments`/`availability` → add Playwright smoke to the staging deploy. Target: meaningful
coverage on money/PHI/auth paths before *any* new feature.

---

## 5. PRIORITY ROADMAP

### P0 — correctness & trust (do first)
1. Real test runner + tests; make CI `test` non-vacuous and merge-gating (§4).
2. Tenant-isolation tests + a Prisma middleware/guard asserting `practiceId` scoping on every query.
3. Close the BFF boundary: Next.js routes that write must proxy to NestJS (no direct Prisma writes).
4. Remove `key.txt` secret path; single-source required-secret validation; gitignore `.next/`.

### P1 — promised features that are stubs (staff-side)
5. Stripe integration (§3.11).
6. Email provider swap + bounce handling (§3.7).
7. Claims model for insurance (§3.10).
8. Provider check-in / live status (§3.3).
9. OpenAPI/Swagger + README fix; UI token system + a11y.

### P2 — patient-facing + intelligence (evidence-gated; see §0 triggers)
10. Patient auth realm + portal (§3.2).
11. Secure messaging + WebSocket gateway (§3.5).
12. LLM layer (Claude) for summarization/insights/embeddings (§3.12).
13. MCP agentic scheduling; push notifications.
14. Sentry / Prometheus / OTel wired for real.

---

## 6. SCALABILITY & PRODUCTION READINESS

- **Already good:** stateless API/worker replicas; Redis-backed sessions + throttling (safe
  horizontal scaling); HPAs; default-deny NetworkPolicies; `FailedJob` DLQ; presigned-URL
  uploads; fail-fast secret validation (`apps/api/src/main.ts:27`).
- **Bottlenecks to watch:** (a) **DB connection pool** under multi-replica Prisma — add PgBouncer
  / RDS Proxy; (b) the double-hop BFF adds latency — fine, but measure and set SLAs; (c) BullMQ
  throughput + **DLQ-depth alerting** (table exists, alert doesn't).
- **Security/reliability:** eliminate plaintext secrets (`key.txt`); enforce CSP/HSTS/security
  headers at ingress (manifests exist — verify applied); WAF on public ingress;
  encryption-at-rest audit for PHI columns (insurance encrypted; confirm `PatientSensitiveNote`,
  documents, transcripts policy); **test the backup-restore runbook** (documented — prove it);
  end-to-end request/trace IDs (the API already supports `X-Request-ID`).
- **Compliance:** the bones of HIPAA-grade design are present (audit log, sensitive-note vertical
  partition, lockout, session hygiene). The gaps are **operational** — BAAs with
  Twilio/Stripe/LLM provider, retention enforcement, access reviews — not architectural.

---

*End of review.*
