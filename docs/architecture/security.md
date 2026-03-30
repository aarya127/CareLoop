# CareLoop Security Architecture

## Authentication & Authorization

- Sessions: HTTP-only signed cookies + short-lived JWT access tokens
- Passwords: bcrypt (cost factor 12)
- MFA: TOTP (future)
- RBAC: roles = `ADMIN | PROVIDER | HYGIENIST | FRONT_DESK | BILLING`

## Data Protection

- Encryption at rest: AES-256 (PostgreSQL TDE or application-level for PII columns)
- Encryption in transit: TLS 1.2+ enforced via nginx
- PII fields encrypted: SSN, DOB, address, phone, insurance IDs

## HIPAA Compliance

- Access audit log on every PHI read/write (`AuditLog` table)
- Minimum necessary access enforce via RBAC
- Session timeout: 30 minutes idle
- Automatic logout on browser close (session cookies, not persistent)
- Employee training records maintained separately

## Infrastructure Security

- No secrets in code — all via environment variables / Kubernetes secrets
- Private subnets for database and Redis (not exposed to internet)
- Security groups / network policies restrict inter-service traffic
- Images run as non-root users

## OWASP Top 10 Mitigations

| Risk | Mitigation |
|---|---|
| Injection | Prisma parameterized queries; input validation with Zod |
| Broken Auth | Short-lived tokens; secure session cookies; bcrypt |
| Sensitive Data | Encrypted PII; TLS everywhere |
| XXE | Not applicable (no XML parsing) |
| Broken Access Control | RBAC guards on every endpoint |
| Security Misconfiguration | Hardened Docker images; automated SAST |
| XSS | Next.js escaping; CSP headers |
| Insecure Deserialization | JSON only; no eval |
| Known Vulnerabilities | Dependabot; snyk in CI |
| Insufficient Logging | Structured audit log; centralized observability |
