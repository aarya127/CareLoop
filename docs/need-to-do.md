# Need To Do

This is the practical setup checklist required to run CareLoop in real environments (dev/staging/prod).

## 1) Accounts To Create

### Cloud and Infra

- [ ] Create AWS account: `careloop-prod`
- [ ] Create AWS account: `careloop-nonprod` (staging/dev)
- [ ] Create IAM admin users with MFA enabled (no root key usage)
- [ ] Create Terraform state resources (S3 + DynamoDB lock table)

### Core Platforms

- [ ] Create Docker registry access (ECR or equivalent)
- [ ] Create GitHub org/repo secrets for CI/CD
- [ ] Create domain registrar account access for `careloop.company.com`

### Required External Services

- [ ] Stripe account (payments)
- [ ] Twilio account (SMS/voice)
- [ ] ElevenLabs account (voice synthesis, if AI phone assistant is enabled)
- [ ] Google Cloud project + OAuth consent setup (Google Calendar integration)
- [ ] Email delivery provider (SES, SendGrid, or Postmark)

### Optional but Recommended

- [ ] Sentry account (error tracking)
- [ ] PagerDuty/Opsgenie account (incident alerting)
- [ ] Datadog/New Relic account (advanced observability)

---

## 2) DNS and Domain Setup

- [ ] Create/confirm public hosted zone: `careloop.company.com`
- [ ] Create private hosted zones:
  - [ ] `dev.careloop.company.internal`
  - [ ] `staging.careloop.company.internal`
  - [ ] `careloop.company.internal`
- [ ] Add subdomain records:
  - [ ] `app.staging.careloop.company.com`
  - [ ] `api.staging.careloop.company.com`
  - [ ] `app.careloop.company.com`
  - [ ] `api.careloop.company.com`
- [ ] Validate TLS cert issuance and DNS validation in ACM/cert-manager

---

## 3) Infrastructure Setup (AWS)

- [ ] Provision VPC + subnets for non-prod
- [ ] Provision VPC + subnets for prod
- [ ] Provision EKS clusters (non-prod + prod)
- [ ] Install cluster add-ons:
  - [ ] ingress-nginx
  - [ ] cert-manager
  - [ ] AWS Load Balancer Controller
  - [ ] ExternalDNS
  - [ ] metrics-server
- [ ] Provision managed data services:
  - [ ] PostgreSQL (RDS)
  - [ ] Redis (ElastiCache)
- [ ] Configure backup policies (RDS snapshots, retention rules)

---

## 4) Secrets and API Keys

Store all secrets in AWS Secrets Manager or equivalent secret store. Do not commit to git.

### Mandatory App Secrets

- [ ] `DATABASE_URL`
- [ ] `REDIS_URL`
- [ ] `JWT_SECRET`
- [ ] `ENCRYPTION_KEY`
- [ ] `APP_BASE_URL`
- [ ] `BASE_URL`

### Google Calendar Integration

- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_REDIRECT_URI`
- [ ] `DEMO_USER_ID` (if demo workflows are used)

### Twilio / Voice Assistant

- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_PHONE_NUMBER`
- [ ] `ELEVENLABS_API_KEY`
- [ ] `ELEVENLABS_VOICE_ID`

### Payments

- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (web)

### General Security/Operations

- [ ] `LOG_LEVEL`
- [ ] SMTP or provider email API key

---

## 5) AI Models and Providers

If AI features are enabled, decide one primary provider and one fallback provider.

### Decision Needed

- [ ] Select primary LLM provider (OpenAI / Anthropic / Azure OpenAI)
- [ ] Select fallback provider for outage resilience
- [ ] Define approved models per feature:
  - [ ] Scheduling assistant model
  - [ ] Intake summarization model
  - [ ] Transcript cleanup model
  - [ ] Analytics insight model

### Minimum Model Governance

- [ ] Set token/cost budgets per feature
- [ ] Configure PII redaction before model calls
- [ ] Disable provider data retention where available
- [ ] Add model/version pinning in config

### Typical Secrets (Provider-dependent)

- [ ] `OPENAI_API_KEY` or equivalent
- [ ] `ANTHROPIC_API_KEY` or equivalent
- [ ] `AZURE_OPENAI_ENDPOINT` + `AZURE_OPENAI_KEY` (if Azure)

---

## 6) Application Runtime Setup

- [ ] Build and push container images:
  - [ ] web
  - [ ] api
  - [ ] worker
- [ ] Create Kubernetes namespaces:
  - [ ] `careloop-dev`
  - [ ] `careloop-staging`
  - [ ] `careloop-prod`
- [ ] Apply base manifests and ingress
- [ ] Create `careloop-secrets` in each namespace
- [ ] Run DB migrations and seed scripts
- [ ] Verify health endpoints:
  - [ ] `/health` API
  - [ ] web root availability

---

## 7) Security and Compliance Baseline

- [ ] Enforce MFA for all cloud/admin accounts
- [ ] Enforce least-privilege IAM roles (no shared admin role)
- [ ] Enable audit logging (CloudTrail + app audit logs)
- [ ] Enable WAF on public ingress
- [ ] Enforce HTTPS redirects + HSTS
- [ ] Add security headers (CSP, X-Frame-Options, X-Content-Type-Options)
- [ ] Set request size limits and rate limits
- [ ] Configure data retention and backup restore test

---

## 8) Monitoring and Alerting

- [ ] Centralize logs (CloudWatch or equivalent)
- [ ] Add request IDs and trace IDs in API logs
- [ ] Set alerts for:
  - [ ] API 5xx spike
  - [ ] High latency
  - [ ] Pod crash loops
  - [ ] DB connectivity errors
  - [ ] Cert expiration warning
- [ ] Configure on-call destination (Slack/PagerDuty/Opsgenie)

---

## 9) CI/CD and Deployment Controls

- [ ] Configure GitHub Actions secrets and environment protection rules
- [ ] Add branch protections (`main` + release branches)
- [ ] Add deploy pipeline for staging
- [ ] Add manual approval gate for prod deploy
- [ ] Add rollback procedure in runbook

---

## 10) Final Go-Live Readiness Checks

- [ ] Staging smoke tests pass end-to-end
- [ ] External integrations tested (Stripe/Twilio/Google)
- [ ] API/web DNS and TLS validated from public internet
- [ ] Incident runbook tested (at least one tabletop)
- [ ] Backup restore test completed successfully
- [ ] Cost budget alarms enabled

---

## Suggested Ownership (Small Team)

- Platform/DevOps owner: AWS, DNS, TLS, ingress, CI/CD
- Backend owner: API secrets, migrations, webhooks, queue workers
- Frontend owner: web env vars, API URL alignment, auth flow checks
- Product/ops owner: vendor accounts, billing, incident contacts

---

## Notes

- Keep this checklist versioned and update it when new integrations are added.
- For same-account staging/prod Route53 setup, only one environment should create the public zone.
- Prefer separate prod and non-prod AWS accounts for safer blast-radius control.
