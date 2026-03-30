# CareLoop Compliance

## HIPAA

CareLoop is a healthcare application subject to HIPAA (Health Insurance Portability and Accountability Act).

### Covered Entities & Business Associates

- The practice using CareLoop is the Covered Entity
- CareLoop (software) acts as a Business Associate — a BAA must be signed

### PHI Handling

Protected Health Information (PHI) includes:
- Patient name, date of birth, address, phone, email
- Social Security Number
- Insurance IDs, member numbers
- Clinical records, treatment history, diagnoses
- Payment information linked to a patient

PHI is:
- Encrypted at rest (AES-256)
- Encrypted in transit (TLS 1.3)
- Access-controlled via RBAC
- Audit-logged on every access/modification

### Required Safeguards

| Safeguard | Implementation |
|---|---|
| Access controls | RBAC + MFA (planned) |
| Audit controls | `AuditLog` table with tamper-evident logging |
| Integrity controls | Database constraints + checksums |
| Transmission security | TLS 1.2+ on all connections |
| Workstation security | Session timeouts, auto-logout |

## Data Retention

- Patient records: 7 years after last treatment (or age of majority + 7 for minors)
- Audit logs: minimum 6 years
- Backups: encrypted, tested quarterly

## Breach Notification

If a breach of unsecured PHI occurs:
1. Notify affected patients within 60 days
2. Notify HHS within 60 days (or annually if <500 individuals)
3. Notify media if >500 individuals in a state

## SOC 2 (Planned)

Type II audit planned once the product reaches production scale.
