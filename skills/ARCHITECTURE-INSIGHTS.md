# Architecture Insights — from building the skill library

Observations surfaced while mapping CareLoop's code into agent skills.

## Missing abstractions (skills that can't be fully realized today)
- **No payment processor.** `billing-and-payments` records a ledger only — no `stripe` dependency. A `PaymentGateway` abstraction (charge / refund / webhook reconcile) is missing; until it exists, no skill can truthfully "charge a card."
- **No claims layer.** `insurance-verification` stops at coverage records — there is no `Claim`/`ClaimLine`/`ClaimStatusEvent` model, so claim submission/adjudication can't be skilled. This is the biggest gap vs. an "OHIP-compatible" goal.
- **No LLM/agent runtime.** `transcriptEmbedding` and `/api/vector/search` exist, but no OpenAI/Anthropic SDK populates them. The `voice-assistant` skill is voice + rule-based tools, not LLM reasoning. Adding a single `LlmService` (default **Claude** — `claude-opus-4-8` for reasoning, `claude-haiku-4-5` for cheap classify/redact) would unlock summarization, intent parsing, and smart suggestions across several skills.
- **No real-time messaging transport.** `Conversation/Message` tables are `// FUTURE` and there is no WebSocket gateway, so a "secure-messaging" skill was intentionally **not** generated — it would be fiction.
- **No push transport.** `Reminder.channel` permits `"push"` with no FCM/web-push behind it.

## Overlapping / duplicated surfaces
- **Two HTTP front doors.** The NestJS API (`:3001`) and Next.js route handlers (`:3000`) both expose functionality; some web routes proxy to NestJS, others hit Prisma directly (voice, calendar, analytics dashboard). Skills target the NestJS API as the source of truth; agents should avoid the direct-Prisma web routes for writes (they bypass guards/audit/idempotency).
- **Reminders appear in two modules.** `messaging` (send + `reminders/schedule`) and a dedicated `reminders` controller overlap. They're unified into one `notifications-and-reminders` skill, but the API itself would benefit from collapsing these into one service to avoid divergent status handling.
- **Email lives in `messaging` but is raw SMTP** while SMS is a first-class Twilio service — asymmetric maturity.

## Correctness bug — RBAC role-name casing (✅ fixed)
Role names were **not normalized** and the guard compared case-sensitively:
- `POST /auth/register` **lowercases** the role before storing, and `AUTH_ROLES` values are lowercase (`staff`, `manager`, `admin`, `service_account`).
- The DB **seed** previously stored **uppercase** names and roles outside the register set: `ADMIN`, `PROVIDER`, `HYGIENIST`, `STAFF`.
- `roles.guard.ts` hard-coded the admin bypass as `userRoles.includes('ADMIN')` (uppercase) and matched `@RequireRole(AUTH_ROLES.X)` (lowercase) via exact `includes`.

Net effect (before the fix): a **registered** admin (`admin`) missed the uppercase `'ADMIN'` bypass; a **seeded** admin (`ADMIN`) missed lowercase `@RequireRole('admin')` matches; seeded `PROVIDER`/`HYGIENIST` users failed every role-gated route.

**Fix applied:** `roles.guard.ts` now lowercases both `userRoles` and the required roles before comparing (case-insensitive), and `seed.ts` stores lowercase role names to match `register()`/`AUTH_ROLES`. Already-seeded DBs with uppercase rows still resolve correctly thanks to the case-insensitive guard; re-seed to also normalize the stored `Role.name` values.

## Opportunities for skill merging / splitting
- **Merge realized:** `billing` + `payments` + `treatments` → one `billing-and-payments` skill (shared invoice lifecycle). `intake` + `patients` → one `patient-intake` skill.
- **Keep separate:** `voice-assistant` and `notifications-and-reminders` both use Twilio but serve distinct outcomes (inbound conversational vs. outbound transactional) — merging would create an over-broad skill.
- **Future split:** once a `Claim` model lands, split `insurance-verification` into `insurance-coverage` and `insurance-claims`.

## AI-agent execution reliability suggestions
1. **Idempotency everywhere money/PHI is written.** The `X-Idempotency-Key` + `IdempotencyService` pattern exists — make every create-side skill require it so agent retries are safe.
2. **Single write path.** Route all agent mutations through the NestJS API so RBAC, the audit interceptor, and rate limiting always apply — never let an agent write via the Next.js direct-Prisma routes.
3. **Tenant guard.** Add a Prisma middleware asserting `practiceId` on every query; agents that hallucinate cross-tenant access then fail closed rather than leaking.
4. **Capability discovery.** Generate an OpenAPI/Swagger spec (`@nestjs/swagger` is not yet wired) and let agents load it as a tool catalog — keeps skills in sync with real routes automatically.
5. **Explicit "not implemented" contracts.** Each skill above flags missing backends (Stripe, claims, LLM, push). Keep these flags accurate so an agent degrades gracefully (hand off / report) instead of fabricating success.
6. **Confidence-gated handoff.** The voice `overtake` mechanism is the right pattern — extend the same "hand to human on low confidence" rule to any skill making clinical or financial commitments.

## Coverage note
Skills were generated for every meaningful domain found. Modules deliberately **not** turned into standalone skills: `health` (liveness probe), `search` (thin FTS wrapper — fold into the domain being searched), `admin`/`users` (administrative CRUD — low agent value), `webhooks` (inbound infra, not an agent capability), and Google Calendar sync (an integration of `scheduling`, surfaced there rather than as its own skill).
