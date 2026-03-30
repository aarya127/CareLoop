# CareLoop — System Design

> AI-Powered Dental Practice Management Platform  
> Stack: Next.js 15 · React 19 · PostgreSQL · Prisma · Twilio · ElevenLabs · Google Calendar

---

## Table of Contents
1. [Overview](#1-overview)
2. [Architecture Diagram](#2-architecture-diagram)
3. [Frontend](#3-frontend)
4. [API Layer](#4-api-layer)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Database Schema](#6-database-schema)
7. [Voice AI Subsystem](#7-voice-ai-subsystem)
8. [Google Calendar Integration](#8-google-calendar-integration)
9. [Vector Search](#9-vector-search)
10. [Analytics Pipeline](#10-analytics-pipeline)
11. [Audit & Compliance](#11-audit--compliance)
12. [Multi-Tenancy](#12-multi-tenancy)
13. [Data Flow Walkthroughs](#13-data-flow-walkthroughs)
14. [Environment & Deployment](#14-environment--deployment)
15. [Known Gaps & Roadmap](#15-known-gaps--roadmap)

---

## 1. Overview

CareLoop is a multi-tenant SaaS platform for dental practices. It unifies:

| Capability | Description |
|---|---|
| **AI Voice Receptionist** | Answers inbound calls, detects intent, books appointments via Twilio + ElevenLabs |
| **Appointment Scheduling** | Provider/room availability engine synced bidirectionally with Google Calendar |
| **Patient Management** | HIPAA-encrypted records, insurance, periodontal charting, X-rays |
| **Call Analytics** | Sentiment scoring, treatment-acceptance tracking, per-practice KPI dashboards |
| **Omni-Channel Messaging** | Conversations between staff and patients (SMS/web — in progress) |
| **RBAC Admin Portal** | Role-scoped dashboards for Admin, Doctor, Hygienist, Receptionist, Billing |

---

## 2. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React 19 / Next.js 15)                 │
│                                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │  /admin     │  │  /admin/     │  │ /admin/    │  │ /admin/       │  │
│  │  Dashboard  │  │  patients    │  │ calendar   │  │ analytics     │  │
│  └─────────────┘  └──────────────┘  └────────────┘  └───────────────┘  │
│                                                                          │
│        TanStack Query · Zustand · Framer-motion · FullCalendar           │
└─────────────────────────────┬────────────────────────────────────────────┘
                              │ HTTPS (REST)
┌─────────────────────────────▼────────────────────────────────────────────┐
│                       NEXT.JS API ROUTES (app/api/)                     │
│                                                                          │
│  /calendar/*   /availability/slots   /analytics/overview                 │
│  /patients/*   /voice/*              /settings/*                         │
│  /audit/logs   /vector/*             /oauth/google/*                     │
└────────────────┬──────┬──────────────────────────┬────────────────────┬─┘
                 │      │                          │                    │
       ┌─────────▼──┐  ┌▼──────────────────┐  ┌───▼────────┐  ┌───────▼──────┐
       │ Prisma ORM │  │  Google Calendar  │  │  Twilio    │  │ ElevenLabs   │
       │ PostgreSQL │  │  API v3 (OAuth2)  │  │  (Telephony│  │ (TTS / Voice │
       │            │  │                   │  │   Webhooks)│  │  Orchestrate)│
       └─────────┬──┘  └───────────────────┘  └────────────┘  └──────────────┘
                 │
       ┌─────────▼──────────────────────────────────────────────┐
       │               PostgreSQL Database                       │
       │  Practice · User · Patient · Provider · Room            │
       │  Appointment · ProviderSchedule · AvailabilityBlock     │
       │  AppointmentHold · GoogleCalendarConnection             │
       │  CallTranscript · CallTranscriptSegment                 │
       │  AnalyticsResult · PracticeKPI                          │
       │  AIPromptVersion · AlertThreshold · RoutingPolicy       │
       │  Conversation · Participant · Message                   │
       └────────────────────────────────────────────────────────┘

Side services (same process):
  ┌─────────────────────┐   ┌──────────────────────────────┐
  │ Vector Index        │   │ Audit Logger (Pino)          │
  │ .next/cache/        │   │ HIPAA/PHIPA action buffer    │
  │ vector-index.json   │   │ 30+ tracked action types     │
  │ Cosine similarity   │   │                              │
  └─────────────────────┘   └──────────────────────────────┘
```

---

## 3. Frontend

### Tech
- **Next.js 15** App Router — all pages under `app/`
- **React 19** with `'use client'` components throughout
- **TanStack React Query 5** for server state / cache
- **Zustand 5** for ephemeral UI state
- **Tailwind CSS 4** + custom CSS variables for theming

### Route Structure

```
/                        → Landing / demo role selector
/login                   → Email + password login
/admin                   → Dashboard (stats tiles)
/admin/patients          → Patient list + detail drawer
/admin/calendar          → FullCalendar (day/week/month) synced to Google
/admin/analytics         → KPI charts (Recharts), call sentiment trends
/admin/messaging         → Conversation inbox
/admin/ai-assistant      → Active call monitor + transcript viewer
/admin/settings          → AI prompt editor, routing policies, thresholds
/patient-record          → Deep patient record (dental, perio, X-rays)
```

### Performance Strategy
- **FullCalendar** (~300 KB) lazy-loaded via `next/dynamic` with `ssr: false`
- **Recharts** analytics dashboard lazy-loaded via `next/dynamic` with `ssr: false`
- `lucide-react`, `recharts`, `framer-motion` in `optimizePackageImports` for tree-shaking

### Auth Flow
`AuthProvider` wraps the entire app (in `Providers`). On load it reads a mock JWT from `localStorage`, decodes it, and hydrates `user` state. `AdminLayout` redirects to `/login` if `user` is null after hydration completes.

---

## 4. API Layer

All routes live under `app/api/` and run as **Next.js Route Handlers** (Node.js edge-compatible functions).

### Calendar

| Route | Method | Description |
|---|---|---|
| `/api/calendar/events` | GET | Fetch events from connected Google Calendar for a date range |
| `/api/calendar/events` | POST | Create appointment in DB + insert Google Calendar event |
| `/api/calendar/events/[id]` | PATCH | Update appointment + sync to Google |
| `/api/calendar/list` | GET | List user's available Google calendars |
| `/api/calendar/freebusy` | POST | Query provider free/busy windows |
| `/api/calendar/watch` | POST | Register Google push-notification watch channel |
| `/api/calendar/webhook` | POST | Receive incremental sync notifications from Google |

### Availability

| Route | Method | Description |
|---|---|---|
| `/api/availability/slots` | GET | Compute open slots: schedule − appointments − blocks − holds |

### Voice (AI Receptionist)

| Route | Method | Description |
|---|---|---|
| `/api/voice/telephony/webhook` | POST | Twilio inbound call entry point (TwiML) |
| `/api/voice/telephony/gather` | POST | Process speech → intent → AI response |
| `/api/voice/telephony/audio/[id]` | GET | Serve synthesized TTS audio |
| `/api/voice/elevenlabs/tts` | POST | Convert text to speech |
| `/api/voice/elevenlabs/assistant` | POST | Intent detection + response generation |
| `/api/voice/tools/calendar-availability` | POST | Tool: get next open slots (called by AI) |
| `/api/voice/tools/patient-context` | POST | Tool: get patient summary for AI context |
| `/api/voice/tools/create-appointment` | POST | Tool: book appointment from voice call |
| `/api/voice/tools/transcripts/segment` | POST | Store per-utterance transcript segment |
| `/api/voice/tools/transcripts/finalize` | POST | Finalize transcript + extract KPIs |
| `/api/voice/webhook` | POST | Post-call webhook (analytics trigger) |
| `/api/voice/calls/start` | POST | Initiate outbound call |
| `/api/voice/overtake/control` | POST | Switch AI → human (and back) |
| `/api/voice/overtake/state/[callId]` | GET | Query live call state |

### Analytics

| Route | Method | Description |
|---|---|---|
| `/api/analytics/overview` | GET | Aggregate KPIs + transcript counts by date range |

### Settings

| Route | Method | Description |
|---|---|---|
| `/api/settings/ai-prompt` | GET / POST | Read / create versioned AI system prompts |
| `/api/settings/routing-policies` | GET / POST | Call routing rules by patient type |
| `/api/settings/thresholds` | GET / POST | Alert thresholds (sentiment floor, escalation rules) |

---

## 5. Authentication & Authorization

### Mechanism
Currently a **mock JWT** system (production-ready structure, mock signature):  
1. User submits email/password → `login()` in `auth-context.tsx`  
2. Role inferred from email domain (`admin@`, `doctor@`, …)  
3. JWT constructed client-side with 24-hour expiry → stored in `localStorage`  
4. On reload: JWT decoded → user hydrated → `AdminLayout` enforces auth guard

> **Production TODO:** Replace with server-issued signed JWTs (e.g. via `jose`) and HTTP-only cookie storage.

### Roles & Scopes

```
Role          │ Scopes
──────────────┼─────────────────────────────────────────────────────────────
admin         │ PATIENT_READ/WRITE · APPT_READ/WRITE · COMMS_READ/WRITE
              │ VOIP_CALL · VOIP_RECORD · AUDIT_READ · ADMIN_ACCESS · PII_REVEAL
doctor        │ PATIENT_READ/WRITE · APPT_READ/WRITE · COMMS_READ/WRITE
              │ VOIP_CALL · VOIP_RECORD · PII_REVEAL
hygienist     │ PATIENT_READ · APPT_READ · COMMS_READ
receptionist  │ APPT_READ/WRITE · COMMS_READ/WRITE
billing       │ (scoped to billing data only)
```

Patient-level access: Doctors are restricted to their `assignedPatientIds`; admins and receptionists have practice-wide access.

---

## 6. Database Schema

All tables are practice-scoped (multi-tenant) via `practiceId`.

### Entity Relationship Overview

```
Practice
  ├── User (staff)
  ├── Patient
  │     └── PatientInsurance
  ├── Provider
  │     ├── ProviderSchedule (recurring availability)
  │     └── AvailabilityBlock (one-off blocks)
  ├── Room
  ├── Appointment  ──── (Provider, Room, Patient, User)
  │     └── AppointmentHold (temp booking lock, TTL'd)
  ├── GoogleCalendarConnection (per User)
  ├── CallTranscript  ──── (Patient, Appointment)
  │     ├── CallTranscriptSegment (per utterance)
  │     └── AnalyticsResult
  ├── PracticeKPI (time-series metrics)
  ├── Conversation
  │     ├── Participant (User or Patient)
  │     └── Message
  ├── AIPromptVersion
  ├── AlertThreshold
  └── RoutingPolicy
```

### Key Design Decisions

| Decision | Rationale |
|---|---|
| `memberIdEnc` / `groupNumberEnc` encrypted at rest | HIPAA PHI protection for insurance identifiers |
| `transcriptEmbedding` on `CallTranscript` | Enables vector similarity search without a separate vector DB |
| `googleEventId` + `calendarId` on `Appointment` | Idempotent upsert on Google webhook sync |
| `AppointmentHold` with `expiresAt` | Prevents double-booking during concurrent voice + web sessions |
| `syncToken` + `resourceId` on `GoogleCalendarConnection` | Incremental sync (only delta changes, not full re-fetch) |
| Separate `CallTranscriptSegment` table | Enables per-speaker analytics and partial streaming writes |

---

## 7. Voice AI Subsystem

### Call Flow (Inbound)

```
Patient phone call
        │
        ▼
   Twilio PSTN
        │  webhook
        ▼
POST /api/voice/telephony/webhook
  └─ Returns TwiML <Gather> (speech input)
        │
        ▼
POST /api/voice/telephony/gather
  ├─ Speech → text
  ├─ Intent detection (via ElevenLabs assistant endpoint)
  │     Intents: availability · next_checkup · records · general
  ├─ Loads patient context (by phone number)
  ├─ Calls AI tool endpoints as needed:
  │     • /voice/tools/patient-context
  │     • /voice/tools/calendar-availability
  │     • /voice/tools/create-appointment
  ├─ Generates TTS response via ElevenLabs
  ├─ Stores transcript segment
  └─ Returns TwiML <Play> (audio URL)
        │
        ▼
POST /api/voice/tools/transcripts/finalize  (on call end)
  ├─ Merges all segments
  ├─ Runs sentiment analysis
  ├─ Writes AnalyticsResult
  └─ Upserts PracticeKPI rows
```

### Orchestrator Support
CareLoop is designed to swap between four voice AI orchestrators:

| Orchestrator | Mode | Status |
|---|---|---|
| **ElevenLabs** | TTS + intent within Twilio flow | Active (primary) |
| **Vapi** | Managed voice pipeline | Stubbed |
| **Retell** | Managed voice pipeline | Stubbed |
| **Pipecat** | Self-hosted pipeline | Stubbed |

### Human Overtake
`/api/voice/overtake/control` allows a logged-in staff member to take over an active AI call. State is tracked per `callId` on `CallTranscript`.

---

## 8. Google Calendar Integration

### OAuth Flow

```
Staff clicks "Connect Google Calendar"
        │
        ▼
POST /api/oauth/google/start
  └─ Generates OAuth2 URL (scopes: calendar.events, calendar.readonly)
        │  redirect
        ▼
Google OAuth consent screen
        │  callback with ?code=
        ▼
GET /api/oauth/google/callback
  ├─ Exchanges code for access + refresh tokens
  ├─ Upserts GoogleCalendarConnection (practiceId, userId, calendarId)
  └─ Redirects to /admin/calendar
```

### Bidirectional Sync

| Direction | Mechanism |
|---|---|
| **Write** | On appointment create/update → `google.calendar.insertEvent()` / `updateEvent()` |
| **Read** | `/api/calendar/events` proxies `google.calendar.listEvents()` |
| **Push** | Google calls `/api/calendar/webhook` on any calendar change → upserts local Appointment |

Incremental sync uses `syncToken` (stored on `GoogleCalendarConnection`) — only changed events are fetched, not the full calendar.

---

## 9. Vector Search

A lightweight in-process vector search system (no external vector DB required):

```
Build:  POST /api/vector/build
  ├─ Loads documents from datasets/ + transcripts
  ├─ Embeds each document via embedText()
  └─ Saves index to .next/cache/vector-index.json

Search: GET /api/vector/search?q=<query>&k=<n>
  ├─ Embeds query text
  ├─ Computes cosine similarity against all doc vectors
  └─ Returns top-k results with scores
```

**Used for:** Retrieving relevant patient context, dental records, and X-ray notes during AI voice calls.

**Limitation:** In-process JSON file — not suitable for high concurrency or large corpora. Production path → pgvector or Pinecone.

---

## 10. Analytics Pipeline

```
Voice call ends
      │
      ▼
POST /api/voice/tools/transcripts/finalize
  ├─ Aggregates CallTranscriptSegments
  ├─ Scores sentiment (-1.0 → 1.0)
  ├─ Detects treatmentAcceptance (boolean)
  ├─ Flags risk conditions
  ├─ Writes → AnalyticsResult (one per call)
  └─ Upserts → PracticeKPI (time-series)
        • avg_sentiment
        • treatment_acceptance_rate
        • call_volume
        • handoff_rate

GET /api/analytics/overview?start=&end=
  ├─ Aggregates PracticeKPI rows for date range
  └─ Returns summary + recent CallTranscripts

Frontend: PracticeKpiDashboard (Recharts)
  ├─ Line chart: sentiment trend over time
  └─ Bar chart: treatment acceptance by week
```

---

## 11. Audit & Compliance

`lib/services/audit-service.ts` provides HIPAA/PHIPA-compliant activity logging.

### Tracked Actions (30+)
`user_login`, `user_logout`, `session_restored`, `view_patient`, `create_appointment`, `update_appointment`, `cancel_appointment`, `view_dental_record`, `view_xray`, `view_insurance`, `reveal_pii`, `send_message`, `initiate_call`, `export_data`, …

### Log Entry Structure
```ts
{
  timestamp:  ISO8601,
  actor_id:   string,       // Staff user ID
  action:     AuditAction,
  patient_id?: string,      // If PHI involved
  resource_id?: string,
  result:     'success' | 'failure' | 'blocked',
  source:     string,       // Component / endpoint
  metadata:   Record<string, unknown>
}
```

Writes are buffered and flushed periodically. In this demo, entries are logged to console; production path → append to a dedicated audit table or SIEM.

---

## 12. Multi-Tenancy

Every DB table (except `User`) carries a `practiceId` foreign key. All queries are scoped to `practiceId` at the service layer.

```
Practice (root tenant)
  ├── All data is isolated by practiceId
  ├── Google Calendar connections are per (practiceId, userId)
  ├── AI prompts, routing policies, thresholds are per practiceId
  └── KPIs are per (practiceId, kpiDate, metricName)
```

Currently single-practice in the demo (hard-coded `prac_001`). The schema is production-ready for multi-practice SaaS billing.

---

## 13. Data Flow Walkthroughs

### A. Patient Books Via AI Voice Call

```
1. Patient calls practice → Twilio receives PSTN
2. Twilio POSTs to /api/voice/telephony/webhook
3. System returns TwiML <Gather> for speech
4. Patient speaks: "I need a cleaning next week"
5. Twilio POSTs speech to /api/voice/telephony/gather
6. System calls /voice/tools/patient-context (lookup by phone)
7. System calls /voice/tools/calendar-availability (next 5 slots)
8. ElevenLabs assistant selects time, generates response text
9. Response synthesized to audio via /voice/elevenlabs/tts
10. Audio URL returned via TwiML <Play>
11. Patient confirms → /voice/tools/create-appointment
    → Creates Appointment in DB
    → Inserts Google Calendar event
12. Call ends → /voice/tools/transcripts/finalize
    → Sentiment scored → AnalyticsResult written → PracticeKPI upserted
```

### B. Staff Views Patient Record

```
1. Staff navigates to /admin/patients
2. React Query fetches /api/patients (demo data)
3. Staff clicks patient → EnhancedPatientProfileDrawer opens
4. Drawer tabs:
   - Overview:    PatientSummary from kb-service-client
   - Insurance:   InsuranceDetails (member ID masked unless PII_REVEAL scope)
   - Dental:      DentalRecord + XRayImages
   - Perio:       PeriodontalChartingData + visual chart
   - History:     VisitRecord[] with procedure codes + costs
5. Every tab open emits audit log: action='view_patient' or 'view_dental_record'
```

### C. Staff Creates Appointment (Web)

```
1. Staff opens /admin/calendar
2. FullCalendar loads (lazy-loaded chunk)
3. Calendar calls /api/calendar/events → Google Calendar API
4. Staff clicks a time slot → selection handler fires
5. Staff fills appointment modal → POST /api/calendar/events
6. Server:
   a. Checks /api/availability/slots (no conflicts)
   b. Writes Appointment to PostgreSQL
   c. Calls google.calendar.insertEvent()
7. Calendar refreshes events
```

---

## 14. Environment & Deployment

### Required Environment Variables

```bash
# App
APP_BASE_URL=https://your-domain.com
DATABASE_URL=postgresql://user:pass@host:5432/careloop

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-domain.com/api/oauth/google/callback

# Encryption (for PHI fields)
ENCRYPTION_KEY=<32-byte hex>

# Voice AI
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Telephony
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# Logging
LOG_LEVEL=info
```

### Setup Commands

```bash
npm install
npm run db:setup      # prisma migrate dev && seed
npm run vector:build  # Build semantic search index
npm run dev           # Start dev server
```

### Production Checklist
- [ ] Replace mock JWT with server-signed tokens (e.g. `jose`) in HTTP-only cookies
- [ ] Move vector index from local JSON → pgvector extension on PostgreSQL
- [ ] Implement real audit log table (not console)
- [ ] Add Twilio webhook signature validation (`validateRequest`)
- [ ] Rotate `ENCRYPTION_KEY` procedure documented
- [ ] Set `ignoreBuildErrors: false` in `next.config.ts`
- [ ] Add rate limiting to `/api/voice/*` endpoints
- [ ] Enable Row Level Security (RLS) on PostgreSQL for practiceId isolation

---

## 15. Known Gaps & Roadmap

| Area | Current State | Production Path |
|---|---|---|
| **Auth** | Mock JWT in localStorage | Server-signed JWT in HTTP-only cookie, refresh token rotation |
| **Vector Search** | In-process JSON file | pgvector or Pinecone for concurrent access |
| **Audit Logs** | Console output + memory buffer | Dedicated `audit_logs` DB table or SIEM sink |
| **Messaging** | Schema + UI exist, no API wiring | Implement conversation CRUD API, add websocket for real-time |
| **Voice Orchestrators** | ElevenLabs active, Vapi/Retell/Pipecat stubbed | Implement adapter pattern per orchestrator |
| **Billing / Billing role** | Role defined, no billing UI | Add billing dashboard, procedure code pricing, EOB parsing |
| **Twilio Security** | No webhook signature check | Add `twilio.validateRequest()` on all `/api/voice/telephony/*` |
| **Multi-practice** | Schema ready, demo uses `prac_001` | Add practice selection post-login, tenant provisioning flow |
| **Test Coverage** | `tests/` directory empty | Unit tests for availability engine + analytics pipeline |
