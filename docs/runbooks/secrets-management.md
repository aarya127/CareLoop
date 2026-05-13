# Secrets Management Runbook

## Overview

CareLoop uses environment variables injected at runtime as the primary secrets delivery mechanism. This runbook documents the required secrets, how to rotate them, and the target state for production (a dedicated secrets manager).

---

## Required Secrets by Service

### API (`apps/api`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/careloop?sslmode=require` |
| `REDIS_URL` | Redis connection string | `rediss://user:pass@host:6380` |
| `COOKIE_SECRET` | 32-byte random key for cookie signing | `openssl rand -hex 32` |
| `SESSION_TTL_SECONDS` | Session lifetime in seconds | `28800` (8h) |
| `SESSION_IDLE_TTL_SECONDS` | Idle session timeout | `3600` (1h) |
| `STORAGE_BUCKET` | S3 bucket name | `careloop-documents-prod` |
| `STORAGE_REGION` | AWS region | `ca-central-1` |
| `STORAGE_ACCESS_KEY_ID` | S3 access key (use IAM role in production) | — |
| `STORAGE_SECRET_ACCESS_KEY` | S3 secret key (use IAM role in production) | — |
| `WEB_URL` | Allowed CORS origin(s), comma-separated | `https://app.careloop.company.com` |
| `API_PORT` | Port the API binds to | `3001` |

### Worker (`apps/worker`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Same as API |
| `REDIS_URL` | Same as API |
| `TWILIO_ACCOUNT_SID` | Twilio account SID for SMS |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Outbound Twilio phone number |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (`587` or `465`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | From address |

---

## Generating New Secrets

```bash
# 32-byte hex key (COOKIE_SECRET)
openssl rand -hex 32

# 64-byte key (database passwords)
openssl rand -base64 48
```

---

## Secrets Storage (current: .env files)

Local development uses `.env` files at the repo root and in each app. **These files must never be committed.** Verify `.gitignore` includes:

```
.env
.env.*
!.env.example
```

---

## Target State: Secrets Manager (production)

Use **AWS Secrets Manager** or **HashiCorp Vault** to:

1. Store all secrets centrally with versioning
2. Rotate automatically (Secrets Manager supports RDS rotation natively)
3. Deliver via pod annotations (AWS IRSA + CSI driver, or Vault Agent Injector)

### Example: AWS Secrets Manager + Kubernetes

```yaml
# In k8s pod spec (using AWS Secrets Store CSI Driver)
volumes:
  - name: secrets
    csi:
      driver: secrets-store.csi.k8s.io
      readOnly: true
      volumeAttributes:
        secretProviderClass: careloop-secrets

# SecretProviderClass
apiVersion: secrets-store.csi.x-k8s.io/v1
kind: SecretProviderClass
metadata:
  name: careloop-secrets
spec:
  provider: aws
  parameters:
    objects: |
      - objectName: careloop/prod/api
        objectType: secretsmanager
        jmesPath:
          - path: DATABASE_URL
            objectAlias: DATABASE_URL
          - path: COOKIE_SECRET
            objectAlias: COOKIE_SECRET
```

---

## Secret Rotation Procedures

### COOKIE_SECRET rotation

1. Generate a new secret: `openssl rand -hex 32`
2. Deploy a new secret version to the secrets manager
3. Trigger a rolling restart: `kubectl rollout restart deployment careloop-api -n careloop-prod`
4. All active sessions will be invalidated (users must re-login) — this is acceptable for a security rotation event
5. Audit: the API startup log will confirm the new secret loaded

### DATABASE_URL password rotation

1. Use AWS RDS password rotation (Secrets Manager) or rotate manually:
   ```sql
   ALTER ROLE careloop_api PASSWORD '<new-password>';
   ```
2. Update the secret in Secrets Manager
3. Trigger rolling restart of API and worker pods
4. Verify connectivity with `GET /health`

### Twilio / SMTP credential rotation

1. Generate new credentials in the respective provider dashboard
2. Update in Secrets Manager
3. Trigger rolling restart of worker pods
4. Verify reminder delivery with a test job

---

## Least-Privilege Access Review

| Service | DB Role | Permissions |
|---|---|---|
| API (`careloop_api`) | `SELECT, INSERT, UPDATE` on all app tables | NO DDL, NO DROP |
| Worker (`careloop_worker`) | `SELECT, INSERT, UPDATE` on relevant tables only | NO DDL, NO DROP |
| Migrations (CI only) | `careloop_admin` | Full DDL — CI/CD only, never in running pods |

### Create least-privilege DB roles

```sql
-- API role (run as superuser during provisioning)
CREATE ROLE careloop_api WITH LOGIN PASSWORD '<from-secrets-manager>';
GRANT CONNECT ON DATABASE careloop TO careloop_api;
GRANT USAGE ON SCHEMA public TO careloop_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO careloop_api;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO careloop_api;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO careloop_api;

-- Worker role (more restricted — only needs certain tables)
CREATE ROLE careloop_worker WITH LOGIN PASSWORD '<from-secrets-manager>';
GRANT CONNECT ON DATABASE careloop TO careloop_worker;
GRANT USAGE ON SCHEMA public TO careloop_worker;
GRANT SELECT, INSERT, UPDATE ON "Reminder", "AuditLog", "FailedJob", "Patient",
  "Appointment", "Invoice", "WebhookLog", "Document" TO careloop_worker;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO careloop_worker;
```

---

## Startup Validation

The API will **refuse to start** in `NODE_ENV=production` if any of these are missing or set to known insecure defaults:

- `COOKIE_SECRET`
- `DATABASE_URL`
- `REDIS_URL`
- `SESSION_TTL_SECONDS`

This is enforced in `apps/api/src/main.ts` via `validateSecrets()`.

---

## Incident Response: Suspected Secret Compromise

1. **Immediately** rotate the compromised secret (follow rotation procedure above)
2. If `COOKIE_SECRET` is compromised: force-revoke all sessions via DB:
   ```sql
   UPDATE "Session" SET "revokedAt" = NOW(), "revokeReason" = 'security_incident'
   WHERE "revokedAt" IS NULL;
   ```
3. If `DATABASE_URL` credentials are compromised: rotate DB password + audit recent `AuditLog` entries for unauthorized access
4. File an incident report and notify affected practices per HIPAA Breach Notification Rule
