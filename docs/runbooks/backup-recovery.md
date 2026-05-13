# Backup & Recovery Runbook

## Overview

CareLoop stores PHI in PostgreSQL (primary source of truth) and binary files in S3-compatible storage (MinIO / AWS S3). Both must be backed up independently. Redis is ephemeral (cache + queues) and does not need point-in-time recovery.

---

## PostgreSQL Backup Strategy

### Continuous WAL archiving (target: RPO < 5 min, RTO < 30 min)

Use **WAL-G** (or AWS RDS automated backups if running on RDS).

#### Configuration (self-hosted)

```bash
# In postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'wal-g wal-push %p'
archive_timeout = 300   # force segment every 5 min
```

```bash
# Environment variables for wal-g (inject via secrets manager)
WALG_S3_PREFIX=s3://careloop-backups/postgres/
AWS_REGION=us-east-1
PGPASSWORD=<from secrets manager>
```

#### Base backup schedule (cron on the DB host or backup pod)

```cron
# Full base backup — daily at 01:00 UTC
0 1 * * *  wal-g backup-push /var/lib/postgresql/data >> /var/log/wal-g.log 2>&1

# Retain 30 daily backups + 4 weekly backups
0 2 * * *  wal-g delete retain FULL 30 --confirm >> /var/log/wal-g.log 2>&1
```

#### On AWS RDS

Enable automated backups with 7-day (minimum, recommend 30-day) retention:
```
aws rds modify-db-instance \
  --db-instance-identifier careloop-postgres \
  --backup-retention-period 30 \
  --preferred-backup-window "01:00-02:00" \
  --apply-immediately
```

Enable Point-in-Time Recovery (PITR) — on by default with RDS automated backups.

---

### Manual pg_dump (secondary, for cross-region restore testing)

```bash
# Run weekly from a separate pod / CI job
pg_dump \
  --host "$PGHOST" \
  --username careloop_api \
  --dbname careloop \
  --format custom \
  --file /backups/careloop-$(date +%Y%m%d).dump

# Upload to S3
aws s3 cp /backups/careloop-$(date +%Y%m%d).dump \
  s3://careloop-backups/pg-dumps/ \
  --sse aws:kms \
  --sse-kms-key-id alias/careloop-backups
```

---

## S3 / MinIO Document Storage

### Versioning

Enable S3 bucket versioning so accidental deletes can be recovered:

```bash
aws s3api put-bucket-versioning \
  --bucket careloop-documents \
  --versioning-configuration Status=Enabled
```

### Cross-region replication (production)

```bash
aws s3api put-bucket-replication \
  --bucket careloop-documents \
  --replication-configuration file://s3-replication-config.json
```

Replicate to a secondary region (e.g. `ca-west-1` if primary is `ca-central-1`).

### Lifecycle policy (retention + cost)

```json
{
  "Rules": [
    {
      "Id": "TransitionToIA",
      "Status": "Enabled",
      "Filter": { "Prefix": "" },
      "Transitions": [
        { "Days": 90, "StorageClass": "STANDARD_IA" }
      ],
      "NoncurrentVersionExpiration": { "NoncurrentDays": 365 }
    }
  ]
}
```

---

## Restore Procedures

### Restore PostgreSQL to a point-in-time (WAL-G)

```bash
# 1. Stop all API and worker pods
kubectl scale deployment careloop-api --replicas=0 -n careloop-staging
kubectl scale deployment careloop-worker --replicas=0 -n careloop-staging

# 2. Restore base backup
wal-g backup-fetch /var/lib/postgresql/data LATEST

# 3. Create recovery signal
touch /var/lib/postgresql/data/recovery.signal

# 4. Set target time in postgresql.conf
echo "recovery_target_time = '2026-05-13 14:30:00 UTC'" >> /var/lib/postgresql/data/postgresql.conf
echo "recovery_target_action = 'promote'" >> /var/lib/postgresql/data/postgresql.conf

# 5. Start PostgreSQL (will replay WAL to target time)
pg_ctl start -D /var/lib/postgresql/data

# 6. After verifying data integrity, scale workloads back up
kubectl scale deployment careloop-api --replicas=2 -n careloop-staging
kubectl scale deployment careloop-worker --replicas=1 -n careloop-staging
```

### Restore from pg_dump

```bash
createdb careloop_restore
pg_restore \
  --host "$PGHOST" \
  --username careloop_admin \
  --dbname careloop_restore \
  --no-owner \
  /backups/careloop-20260513.dump
```

---

## Recovery Testing Schedule

| Test | Frequency | Owner |
|---|---|---|
| Verify daily backup exists + size > 0 | Daily (automated alert) | DevOps |
| Restore to staging and run smoke tests | Monthly | On-call engineer |
| Full DR drill (restore to isolated environment) | Quarterly | Engineering lead |

---

## Monitoring & Alerts

- Alert if no backup completed in the last 25 hours (CloudWatch / Grafana)
- Alert if backup size drops > 20% vs 7-day average (unexpected data loss signal)
- Alert on WAL archiving lag > 10 minutes

---

## Encryption at Rest

| Storage | Mechanism |
|---|---|
| PostgreSQL (self-hosted) | OS-level disk encryption (LUKS / dm-crypt) or cloud volume encryption |
| PostgreSQL (AWS RDS) | `StorageEncrypted: true` with KMS CMK — enable at creation time |
| S3 documents | SSE-S3 (default) or SSE-KMS with `alias/careloop-documents` |
| Redis (AWS ElastiCache) | Enable `at-rest-encryption-enabled` at cluster creation |

**Note:** Prisma-level column encryption (e.g. via `pgcrypto`) for high-sensitivity fields (SSN, insurance numbers) is a future phase item tracked in `docs/need-to-do.md`.
