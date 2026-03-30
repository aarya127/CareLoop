# CareLoop API Design

## Conventions

- Base URL: `/api/v1`
- Authentication: Session cookie (HTTP-only) + Bearer token for machine clients
- Date format: ISO 8601 (`2024-01-15T10:00:00Z`)
- IDs: UUIDs (v4)
- Pagination: `?page=1&limit=20` → `{ data, meta: { total, page, limit, totalPages } }`
- Errors: `{ statusCode, message, code?, details? }`

## Modules

| Route prefix | Module | Description |
|---|---|---|
| `/health` | HealthModule | Liveness/readiness check |
| `/auth` | AuthModule | Login, register, session |
| `/users` | UsersModule | User profile management |
| `/intake` | IntakeModule | Patient intake forms |
| `/patients` | PatientsModule | Patient CRUD |
| `/insurance` | InsuranceModule | Insurance plans & eligibility |
| `/appointments` | AppointmentsModule | Scheduling & availability |
| `/treatments` | TreatmentsModule | Treatment plans & charting |
| `/billing` | BillingModule | Invoices |
| `/payments` | PaymentsModule | Payment processing |
| `/documents` | DocumentsModule | File upload/download |
| `/messaging` | MessagingModule | SMS, email, reminders |
| `/analytics` | AnalyticsModule | KPIs & reports |
| `/audit` | AuditModule | Activity log |
| `/search` | SearchModule | Global search |
| `/webhooks` | WebhooksModule | Stripe & Twilio callbacks |
| `/admin` | AdminModule | System administration |

## Authentication Flow

1. `POST /auth/login` → sets `session` HTTP-only cookie, returns `accessToken` + `refreshToken`
2. All protected routes require `Authorization: Bearer <accessToken>` or valid session cookie
3. `POST /auth/refresh` → exchanges `refreshToken` for new `accessToken`
4. `POST /auth/logout` → invalidates server-side session
