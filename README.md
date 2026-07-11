# CareLoop

Multi-tenant dental practice-management platform: scheduling and availability,
patient intake, documents, billing, reminders/notifications, an AI phone
assistant (Twilio + ElevenLabs), Google Calendar sync, and analytics.

## Architecture

This is a **pnpm + Turborepo monorepo**.

| Path                                          | Package            | What it is                                                              |
| --------------------------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `apps/web`                                    | `@careloop/web`    | Next.js 15 / React 19 UI + BFF route handlers (port **3000**)           |
| `apps/api`                                    | `@careloop/api`    | NestJS 10 on Fastify — core domain API (port **3001**)                  |
| `apps/worker`                                 | `@careloop/worker` | BullMQ background workers (reminders, calendar sync, transcripts, KPIs) |
| `packages/db`                                 | `@careloop/db`     | Prisma schema, migrations, seed, generated client                       |
| `packages/shared`                             | `@careloop/shared` | Shared types/utilities                                                  |
| `packages/ui`                                 | `@careloop/ui`     | Shared UI components                                                    |
| `packages/tsconfig`, `packages/eslint-config` | —                  | Shared tooling config                                                   |

Backing services: **PostgreSQL** (data), **Redis** (sessions, throttling, BullMQ
queues), and **S3-compatible storage** (documents; MinIO locally).

Deeper docs live in [`docs/architecture/`](docs/architecture) — start with
[`overview.md`](docs/architecture/overview.md). A full review and roadmap is in
[`docs/architecture/careloop-review-and-roadmap.md`](docs/architecture/careloop-review-and-roadmap.md).

## Key flows

| Flow                                        | Entry point                                                 | Notes                                                                                                                                                                                       |
| ------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Practice signup** (new org + first admin) | web `/signup` → `POST /auth/signup`                         | Public, rate-limited; atomically creates the `Practice` + admin `User` + session.                                                                                                           |
| **Team invitations** ("join a team")        | admin `/admin/team`; invitee `/join/<token>`                | Admin/manager invite by email+role → single-use, 7-day token → invitee sets a password and joins the same practice. See [onboarding-and-team.md](docs/architecture/onboarding-and-team.md). |
| **Patient intake** (public form)            | web `/intake?practice=<id>` → `/intake/drafts/*`            | Multi-step, autosaved, idempotent submit; creates the patient + insurance. No staff login required.                                                                                         |
| **Insurance & claims**                      | `insurance` + `claims` modules; web patient → Insurance tab | Structured coverage (annual max, category %s, remaining benefit) + claims lifecycle (draft→submitted→adjudicated) with a status-event trail.                                                |
| **Reminders / notifications**               | `messaging` + `reminders` modules; worker scan              | Templated SMS/email; per-practice tenant-scoped; delivery status tracked on `Reminder`.                                                                                                     |

**RBAC.** All authenticated staff are scoped to one `Practice`. Role groups gate
sensitive endpoints: **management** (`admin`, `manager`) for analytics, audit, and
destructive/void actions; **front office** (`admin`, `manager`, `staff`) for billing,
payments, and insurance; **clinical** (`admin`, `manager`, `provider`, `hygienist`) for
EMR and treatments. Enforced by the global `RolesGuard` + `@RequireRole`.

## Prerequisites

- **Node.js 20 LTS or newer** (the repo requires `>=20`)
- **pnpm 10** — this is a pnpm workspace using the `workspace:*` protocol, so
  npm/yarn cannot install it. Enable via `corepack enable`.
- **Docker** (recommended) for Postgres, Redis, and MinIO.

## Quick start (local dev)

```bash
# 1) Install dependencies (also generates the Prisma client via postinstall)
pnpm install

# 2) Start backing services (Postgres, Redis, MinIO)
docker compose up -d postgres redis minio

# 3) Configure environment — copy the example and fill in values
cp .env.example .env

# 4) Apply database migrations (and optionally seed)
pnpm db:migrate
pnpm db:seed        # optional sample data

# 5) Run the whole stack in dev (web + api + worker via Turborepo)
pnpm dev
```

Open http://localhost:3000. If port 3000 is busy, Next.js picks the next free
port and prints it.

## Configuration

All configuration comes from the environment (`.env` locally; a secrets manager
in deployed environments). **Never commit secrets.** See
[`.env.example`](.env.example) for the full list. Commonly needed:

```env
# Core
DATABASE_URL=postgresql://careloop:careloop@localhost:5432/careloop?schema=public
REDIS_URL=redis://localhost:6379
APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# API (required by apps/api in production — see apps/api/src/main.ts)
COOKIE_SECRET=a_long_random_32+_char_secret
SESSION_TTL_SECONDS=28800
# bcrypt work factor for password hashing. Lower (e.g. 10) on constrained CPUs
# such as Render's free tier; existing users are migrated via rehash-on-login.
BCRYPT_ROUNDS=12

# Secrets / crypto
ENCRYPTION_KEY=a_long_random_secret
# JWT_SECRET is legacy/unused — auth uses opaque server-side sessions, not JWTs.

# S3-compatible storage (MinIO locally)
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=careloop
STORAGE_REGION=us-east-1
STORAGE_ACCESS_KEY_ID=careloop
STORAGE_SECRET_ACCESS_KEY=careloop_dev_secret
STORAGE_FORCE_PATH_STYLE=true
```

Optional integrations:

```env
# Google Calendar sync
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/google/callback
DEMO_USER_ID=demo-user

# AI phone assistant (Twilio + ElevenLabs)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+15555555555
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

LOG_LEVEL=info
```

## Run with Docker (full stack)

`docker-compose.yml` builds and runs web, api (behind an nginx load balancer),
worker, Postgres, Redis, and MinIO:

```bash
docker compose up --build
```

Ports: web `3000`, api (via nginx) `3001`, Postgres `5432`, Redis `6379`,
MinIO `9000` (API) / `9001` (console).

## Common commands

```bash
pnpm dev            # run all apps in watch mode (Turborepo)
pnpm build          # build all packages
pnpm start          # run built apps
pnpm lint           # lint all packages
pnpm typecheck      # typecheck all packages
pnpm test           # run all test suites
pnpm format         # Prettier write

pnpm db:migrate     # apply Prisma migrations
pnpm db:seed        # seed sample data
pnpm db:studio      # open Prisma Studio
```

Run a single workspace, e.g. the API tests:

```bash
pnpm --filter @careloop/api test
```

## Testing

Unit tests run on **Vitest**. Suites live next to the code as `*.spec.ts` and
cover tenant isolation, RBAC (`roles.guard.spec.ts`), the claims lifecycle,
webhook-signature verification, notification templates, and coverage math. CI
runs `turbo run test` against Postgres + Redis service containers — see
[`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Deployment

Container images: [`infrastructure/docker/`](infrastructure/docker).
Kubernetes manifests: [`infrastructure/kubernetes/`](infrastructure/kubernetes/README.md).
AWS Terraform: [`infrastructure/terraform/`](infrastructure/terraform/README.md).
Operational runbooks: [`docs/runbooks/`](docs/runbooks/README.md).
