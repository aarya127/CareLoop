# CareLoop Data Model

## Database: PostgreSQL 16 via Prisma ORM

Schema lives at `packages/db/prisma/schema.prisma`.

## Core Entities

### User
Represents a practice staff member (dentist, hygienist, admin, front-desk).

### Patient
Represents a patient. Contains PII — all fields are encrypted at rest.

### Appointment
A scheduled visit linking a Patient to a Provider at a specific time.

### Treatment
A clinical treatment or procedure performed during an appointment.

### InsurancePlan
A patient's insurance coverage details (primary/secondary/tertiary).

### Invoice
A billing record for services rendered; may contain multiple LineItems.

### Payment
A recorded payment against an Invoice.

### Document
Metadata for uploaded files (X-rays, consent forms, etc.) stored in S3-compatible storage.

### AuditLog
Immutable record of every data-modifying action for HIPAA compliance.

### Message
An outbound SMS or email communication log entry.

## Relationships (simplified)

```
User (provider) ──< Appointment >── Patient
Patient ──< InsurancePlan
Appointment ──< Treatment
Patient ──< Invoice ──< LineItem
Invoice ──< Payment
Patient ──< Document
```

## Indexing Strategy

- All foreign key columns are indexed
- `appointments`: composite index on `(providerId, startTime)`
- `patients`: full-text index on `firstName || lastName || email`
- `auditLog`: index on `(userId, createdAt)`
