# Skill Name: audit-and-compliance

## Description

Query the immutable audit trail of security- and data-access events (logins, session changes,
record access, admin actions). Wraps the `audit` module. Read-only by design.

## Domain

Audit & compliance.

## Dependencies

- **API:** `audit` controller — base `/audit` (`apps/api/src/modules/audit/audit.controller.ts`)
- **Tables:** `AuditLog` (`eventType`, `outcome`, `actorUserId`, `targetUserId`, `sessionId`, `ip`, `userAgentHash`, `metadata`, `eventTime`)
- **Infra:** Postgres (append-only usage pattern)

---

## 2. Capability Overview

Lets an agent answer "who did what, when?" — filter audit entries by actor, target, event
type, outcome, and time window for investigations, access reviews, and compliance reporting.
It reasons over an append-only log: it can read and correlate, but must never alter entries.

## 3. Step-by-Step Execution Logic

1. Receive a filter `{ practiceId?, actorUserId?, targetUserId?, eventType?, outcome?, from?, to?, limit? }`.
2. GET `/audit` with the filter as query params.
3. Receive a time-ordered page of `AuditLog` rows (newest first); paginate via `from`/`to`/cursor.
4. Correlate: group by `actorUserId` or `sessionId` to reconstruct a session timeline.
5. Return the structured findings. For PHI access reviews, focus on `eventType` values that touch patient records or sensitive notes.

## 4. Inputs & Outputs

### Inputs

All optional filters: `practiceId`, `actorUserId`, `targetUserId`, `eventType`, `outcome` (`success|failure`), `from`, `to`, `limit`.

### Outputs

```json
// GET /audit → 200
[
  {
    "id": "12345",
    "eventTime": "2026-03-10T09:01:22Z",
    "eventType": "auth.login",
    "outcome": "success",
    "actorUserId": "usr_…",
    "ip": "203.0.113.4",
    "sessionId": "ses_…",
    "metadata": {}
  }
]
```

## 5. Tools / APIs Used

- `GET /audit` (filtered list)
- Indexed by `eventTime`, `(eventType, eventTime)`, `(actorUserId, eventTime)`, `(targetUserId, eventTime)` — filter on these for performance.

## 6. Edge Cases & Failure Handling

- **Append-only** → there is no update/delete endpoint and there must not be; never attempt to modify or "clean up" audit rows.
- **Large ranges** → unbounded queries are slow; always pass a bounded `from`/`to` and a `limit`, and page.
- **PII minimization** → `userAgentHash` and IPs are sensitive; include them only when the investigation requires it, and never export beyond the compliance context.
- **Gaps ≠ proof of inaction** → absence of an event means it wasn't logged, not that it didn't happen; corroborate with operational tables when material.
- **Tenant scoping** → filter by `practiceId` for per-practice reviews.

## 7. Example Usage

- **Request:** `GET /audit?actorUserId=usr_9&from=2026-03-01&to=2026-03-31&eventType=auth.login`.
- **Output:** that user's March logins with outcomes and IPs.
- **Agent reasoning:** "Investigating a suspected compromised account → pull failed then successful logins for the actor, correlate by `sessionId` and `ip`, and report the timeline; I do not modify anything."

## 8. Optional Resources Folder

Optional `resources/event-types.md`: the catalog of `eventType` values (see `apps/api/src/modules/audit/action-types.ts`) and their compliance relevance.
