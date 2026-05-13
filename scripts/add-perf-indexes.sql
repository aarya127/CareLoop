-- Performance indexes for CareLoop
-- Safe to run on a live database: all use CREATE INDEX CONCURRENTLY.
-- Run as the careloop_admin role (or superuser) via:
--   psql $DATABASE_URL -f scripts/add-perf-indexes.sql
--
-- Each index targets a specific slow-query pattern identified from the
-- analytics, audit, and availability workloads.
-- ============================================================================

-- 1. Appointment status filter
--    Needed by: analytics no-show trend queries that filter by (practiceId, status, start)
--    Query pattern: WHERE "practiceId" = $1 AND status = 'no_show' AND start BETWEEN $2 AND $3
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Appointment_practiceId_status_start_idx"
  ON "Appointment" ("practiceId", "status", "start");

-- 2. Invoice paidAt filter
--    Needed by: analytics payments trend (getPayments) that filters by (practiceId, paidAt)
--    Query pattern: WHERE "practiceId" = $1 AND "paidAt" >= $2
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Invoice_practiceId_paidAt_idx"
  ON "Invoice" ("practiceId", "paidAt");

-- 3. AuditLog outcome filter
--    Needed by: audit log queries with ?outcome= filter
--    Query pattern: WHERE outcome ILIKE $1 AND "eventTime" >= $2
CREATE INDEX CONCURRENTLY IF NOT EXISTS "AuditLog_outcome_eventTime_idx"
  ON "AuditLog" ("outcome", "eventTime");

-- 4. Reminder scheduled delivery
--    Needed by: worker queries for due reminders: WHERE status = 'pending' AND "scheduledAt" <= NOW()
--    (practiceId, status, scheduledAt already exists — add scheduledAt-only for cross-practice worker scan)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Reminder_status_scheduledAt_idx"
  ON "Reminder" ("status", "scheduledAt");

-- 5. Session idle expiry cleanup
--    Needed by: background job that purges expired sessions
--    (revokedAt IS NULL AND idleExpiresAt < NOW())
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Session_revokedAt_idleExpiresAt_idx"
  ON "Session" ("revokedAt", "idleExpiresAt");

-- 6. Patient search by practiceId + createdAt (analytics patient growth queries)
--    Query pattern: WHERE "practiceId" = $1 AND "createdAt" >= $2
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Patient_practiceId_createdAt_idx"
  ON "Patient" ("practiceId", "createdAt");
