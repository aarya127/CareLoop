# Skill Name: analytics-reporting

## Description
Query practice analytics: overview/dashboard, KPIs, revenue, payments, patient and appointment
metrics, no-show rates, and AI decision/phase metrics. Wraps the `analytics` module, which
reads precomputed KPI rows produced by the worker.

## Domain
Analytics & reporting (read-mostly).

## Dependencies
- **API:** `analytics` controller — base `/analytics` (`apps/api/src/modules/analytics/analytics.controller.ts`)
- **Worker:** `compute-kpis`, `analytics-refresh.processor` (populate KPIs on a schedule)
- **Tables:** `PracticeKPI` (`metricName`, `metricValue`, `kpiDate`, `dimensions`), `AnalyticsResult`

---

## 2. Capability Overview
Lets an agent retrieve dashboards and specific metrics for a practice and date range, and
trigger automation/seed jobs. It reasons over precomputed KPIs (fast reads) rather than
scanning raw tables. Decisions: choose the right metric endpoint and window; detect threshold
breaches (e.g. high no-show) for downstream action.

## 3. Step-by-Step Execution Logic
1. Receive `{ practiceId, from?, to? }`.
2. Pick the endpoint matching the question (e.g. `/analytics/no-show` for no-show rate, `/analytics/revenue` for revenue).
3. GET with `practiceId` + range query params.
4. Read the structured metric payload (values come from `PracticeKPI`, not live aggregation).
5. If a metric is missing/stale → optionally `POST /analytics/automation/trigger` to refresh, then re-read. (`POST /analytics/seed-phase1` seeds demo data — non-prod only.)
6. Return the metric; for thresholds, compare against the practice's `AlertThreshold`.

## 4. Inputs & Outputs
### Inputs
Required: `practiceId`. Optional: `from`, `to` (ISO dates), metric-specific dimensions.
### Outputs
```json
// GET /analytics/dashboard?practiceId=p1 → 200
{ "kpis": { "revenueCents": 1234500, "noShowRate": 0.07, "appointments": 412 },
  "range": { "from": "2026-02-01", "to": "2026-02-28" } }
```

## 5. Tools / APIs Used
- `GET /analytics/overview`, `/dashboard`, `/kpis`, `/revenue`, `/payments`, `/patients`, `/appointments`, `/no-show`, `/decision-actions`, `/phases`
- `POST /analytics/automation/trigger`, `POST /analytics/seed-phase1` (non-prod)

## 6. Edge Cases & Failure Handling
- **Stale/empty KPIs** → metrics are precomputed by the worker; if the worker hasn't run, values may be missing or old. Trigger a refresh rather than computing client-side.
- **Empty range** → returns zeros, not an error; distinguish "no activity" from "no data".
- **`seed-phase1` is destructive demo data** → never call in production.
- **Read-only intent** → analytics endpoints must not be used to mutate operational state; for actions, branch to the relevant operational skill.
- **Tenant scoping** → always pass `practiceId`; never aggregate across practices.

## 7. Example Usage
- **Request:** `GET /analytics/no-show?practiceId=p1&from=2026-02-01&to=2026-02-28`.
- **Output:** `{ "noShowRate": 0.07, … }`.
- **Agent reasoning:** "No-show rate exceeds the practice threshold → I'll hand off to notifications-and-reminders to schedule pre-visit confirmations."

## 8. Optional Resources Folder
Optional `resources/metric-catalog.md`: maps each `metricName` in `PracticeKPI` to its endpoint and meaning.
