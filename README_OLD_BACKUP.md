# 🦷 CareLoop - AI-Powered Dental Practice Management# CareLoop - AI Dental Practice Management



> **Interactive Demo** - Experience the future of patient care with intelligent automation, real-time communication, and enterprise-grade security.A premium, Apple.com-inspired web application for dental practices featuring AI-powered call handling, appointment management, and comprehensive patient profiles.



![CareLoop Demo](https://img.shields.io/badge/Status-Demo%20Ready-brightgreen?style=for-the-badge)## 🚀 Features

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)

![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)- **AI Receptionist**: Handles inbound/outbound calls 24/7

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)- **Smart Calendar**: Drag-drop scheduling with provider/room management

- **Patient Profiles**: Rich demographics, clinical records, insurance, and billing

## 🚀 Quick Start- **Real-time Updates**: Live call status and appointment notifications

- **Premium UI**: Apple.com-level design with tactile micro-interactions

```bash- **HIPAA Ready**: Enterprise-grade security and compliance

# Install dependencies

npm install## 🛠️ Tech Stack



# Run development server### Frontend

npm run dev- **Next.js 14+** with App Router

- **React 18** for SSR/ISR

# Open http://localhost:3000- **TypeScript** for type safety

```- **Tailwind CSS** for styling

- **shadcn/ui** for component primitives

**🎭 Demo Login:** Choose any role on the landing page  - **Framer Motion** for animations

- Password for all accounts: `demo123`- **FullCalendar** for scheduling

- **TanStack Query** for data fetching

## ✨ What's Included- **Zustand** for state management



### 📊 **15 Sample Patients**### Key Features

Realistic patient data with names, ages, contact info, medical flags, and avatars- PWA support (installable, offline-capable)

- Vercel Analytics for telemetry

### 🎭 **4 User Roles**- WCAG 2.2 AA accessibility

- **Admin** - Full system access- Role-based access control (RBAC)

- **Doctor** - Clinical + patient management  

- **Nurse** - Limited patient access## 📦 Installation

- **Receptionist** - Scheduling + messaging

\`\`\`bash

### 🏗️ **8,000+ Lines of Production Code**# Install dependencies

- Patient Profile Drawer (900 lines)npm install

- Calendar Mini-Modal (650 lines)

- Phone/VoIP Call Panel (850 lines)# Run development server

- Messaging Drawer (950 lines)npm run dev

- Enhanced Patient Card (600 lines)

- 4 API Clients (2,151 lines)# Build for production

- Auth & RBAC (652 lines)npm run build



### 📚 **3,500+ Lines of Documentation**# Start production server

Complete guides, API references, and implementation notesnpm start

\`\`\`

## 🎯 Key Features

## 🏗️ Project Structure

### 1. Patient Management

- **Comprehensive Profiles** with 5 interactive tabs\`\`\`

- **PII Masking** - click to reveal sensitive dataCareLoop/

- **Periodontal Charts** - visual gap test results├── app/                    # Next.js App Router pages

- **Insurance Details** - coverage and eligibility│   ├── calendar/          # Calendar page

- **Visit History** - procedures and costs│   ├── globals.css        # Global styles

│   ├── layout.tsx         # Root layout

### 2. Smart Scheduling│   └── page.tsx           # Home page

- **AI-Powered Booking** - automated appointment creation├── components/            # React components

- **Coverage Estimates** - insurance calculations before booking│   ├── layout/           # Layout components (nav, footer)

- **Status Management** - scheduled → confirmed → completed│   ├── pages/            # Page-level components

- **Multi-Source** - AI, manual, and rescheduled appointments│   ├── sections/         # Section components

│   ├── ui/               # UI primitives

### 3. VoIP Integration│   └── providers/        # Context providers

- **Click-to-Call** - E.164 phone validation├── lib/                   # Utilities and configs

- **Call History** - AI vs human agent indicators│   ├── hooks/            # Custom React hooks

- **Recording Player** - consent-validated playback│   ├── api-config.ts     # API endpoints

- **Transcripts** - ASR segments with timestamps│   ├── auth.ts           # Auth utilities

- **Call Stats** - duration, status, summaries│   ├── schemas.ts        # Zod schemas

│   └── utils.ts          # Helper functions

### 4. Omni-Channel Messaging└── public/               # Static assets

- **Unified Inbox** - SMS, voice, web chat, email\`\`\`

- **Thread View** - message bubbles with attachments

- **Escalation** - transfer to human agents## 🎨 Design System

- **Convert to Appointment** - smart datetime parsing

- **Unread Badges** - real-time message counts### Colors

- Primary: Blue (#3b82f6)

## 🏗️ Technical Stack- Background: White/Gray

- Accent: System colors for status

```

Frontend:  Next.js 15 + React 18 + TypeScript### Typography

Styling:   Tailwind CSS + Shadcn UI  - Font: Inter (system fallback)

Icons:     Lucide React- Hierarchy: Bold headlines, clear content

State:     React Query (TanStack)

Forms:     React Hook Form + Zod### Spacing

Auth:      JWT with RBAC (11 scopes, 5 roles)- Grid: 12/16px rhythm

Security:  HIPAA-compliant audit logging- Cards: rounded-2xl with subtle shadows

```- Generous whitespace



## 📁 Project Structure### Motion

- Duration: 150-250ms

```- Easing: Spring on hover

CareLoop/- Respects `prefers-reduced-motion`

├── app/

│   ├── page.tsx                 # 🎨 Beautiful demo landing page## 🔐 Security & Compliance

│   ├── patients/page.tsx        # 📋 Patient list view

│   └── layout.tsx               # Root with AuthProvider- **Authentication**: JWT-based with Bearer tokens

├── components/- **Authorization**: Role-based access control (RBAC)

│   ├── patient-profile/         # Profile drawer (900 lines)- **Encryption**: At rest and in transit

│   ├── patient-calendar/        # Calendar modal (650 lines)- **Audit Logs**: Complete access history

│   ├── patient-phone/           # Phone panel (850 lines)- **HIPAA**: Compliant infrastructure ready

│   ├── patient-messaging/       # Messaging drawer (950 lines)

│   └── patients/### User Roles

│       ├── patient-card.tsx     # Enhanced card (600 lines)- **Tenant Admin**: Full access

│       └── patients-list.tsx    # Searchable patient list- **Provider**: Schedule + clinical view

├── lib/- **Front Desk**: Schedule + demographics/insurance

│   ├── auth/                    # JWT auth + RBAC- **Billing**: Financial + insurance data

│   ├── services/                # 4 API clients (2,151 lines)

│   └── demo/## 🔌 API Integration

│       └── sample-data.ts       # 15 patients + 4 users

└── docs/                        # 3,500+ lines of docs### Services

```- `voice-brain`: LLM call logic via WebSocket/WebRTC

- `telephony-gateway`: Call logs and recordings (REST/SSE)

## 🔐 RBAC & Security- `booking-service`: Appointments CRUD (REST/GraphQL)

- `kb-service`: Patient search and suggestions

### 11 Permission Scopes- `EHR/Practice Mgmt`: Patient records bridge

```typescript

PATIENT_READ, PATIENT_WRITE, PATIENT_DELETE### WebSocket Events

APPT_READ, APPT_WRITE, APPT_DELETE- `CALL_STARTED`

INSURANCE_READ, COMMS_READ, COMMS_WRITE- `CALL_ENDED`

VOIP_CALL, ADMIN- `INTENT_APPOINTMENT_BOOK`

```- `INSURANCE_VERIFY_REQUEST`

- `CALL_SUMMARY_READY`

### 5 Role Presets- `APPOINTMENT_CREATED`

| Role | Permissions | Use Case |- `APPOINTMENT_UPDATED`

|------|------------|----------|

| **Admin** | All scopes | System administration |## 📱 PWA Support

| **Doctor** | Patient + Appointments + Comms | Clinical care |

| **Nurse** | Patient (no delete) + Appointments | Patient support |The app is installable as a Progressive Web App:

| **Receptionist** | Appointments + Comms | Front desk |- Offline shell for read-only schedules

| **Billing** | Insurance + Patient (read-only) | Billing dept |- App-like experience on mobile/desktop

- Background sync capabilities

### Security Features

- ✅ JWT authentication with auto-refresh## 🧪 Development

- ✅ SSR-safe localStorage access  

- ✅ HIPAA-compliant audit logging\`\`\`bash

- ✅ Request correlation (x-request-id)# Run linter

- ✅ Idempotency keys on mutationsnpm run lint

- ✅ E.164 phone validation

- ✅ Consent checks for recordings# Type check

npx tsc --noEmit

## 🚧 API Clients\`\`\`



### KB Service Client (544 lines)## 📊 Telemetry

**Patient data backend wrapper**

- 11 methods: getPatientSummary, getInsuranceDetails, getDentalRecords, etc.- **Vercel Analytics**: Page performance metrics

- 5-minute caching with invalidation- **OpenTelemetry**: Browser traces

- Retry logic: 3 attempts, exponential backoff (1s → 2s → 4s)- **Custom Metrics**: Booking success rate, calendar interactions, etc.



### Booking Service Client (495 lines)## 🌍 Internationalization

**Appointment management**

- 8 methods: createAppointment, updateAppointment, getCoverageEstimate, etc.- Time zone support

- Coverage estimates before booking- Locale-based date formatting

- Separate reschedule vs cancel endpoints- Currency: USD/CAD support



### Telephony Gateway Client (472 lines)## 📝 License

**VoIP call management**

- 10 methods: initiateCall, getCallTranscript, getRecordingUrl, etc.Proprietary - All rights reserved

- E.164 phone validation

- Consent checks before recording access## 🤝 Contributing



### Voice Brain Client (640 lines)This is a private project. For questions or support, contact the development team.

**AI messaging & conversations**

- 13 methods: sendMessage, escalateConversation, convertToAppointment, etc.---

- Rate limiting (10 messages/minute)

- Smart datetime parsing for appointmentsBuilt with ❤️ for dental practices


## 📚 Documentation

Comprehensive guides in `/docs`:
- **COMPLETE_SESSION_SUMMARY.md** (800 lines) - Full project overview
- **PHASE_4_COMPLETION.md** (700 lines) - API clients detailed guide
- **AUTHPROVIDER_FIX.md** (200 lines) - SSR safety implementation
- Plus 6 more docs covering all phases

## 🎨 Demo Features

### Landing Page
- **Beautiful Hero** with gradient background
- **Feature Cards** showcasing 4 main capabilities
- **Role Selection** - 4 clickable demo account cards
- **Tech Stack** badges
- **Included Features** checklist

### Patient List
- **Search** by name, email, or phone
- **Filter** by primary doctor
- **Medical Flags** - allergies, pre-medication, outstanding balance
- **Hover Effects** for better UX
- **Responsive Grid** layout

### Patient Card (Enhanced)
- **4 Action Buttons:** Open Profile, Calendar, Phone, Message
- **Badge Counters:** Appointment count, unread messages
- **Last Call Indicator:** Shows time since last call
- **RBAC Hiding:** Buttons disappear if no permission
- **Optimistic UI:** Instant feedback

## 📊 Code Statistics

| Category | Lines | Description |
|----------|-------|-------------|
| **UI Components** | 4,550 | 5 major patient management features |
| **API Clients** | 2,151 | 4 service wrappers with 42 methods |
| **Infrastructure** | 652 | Auth, audit, API types |
| **Demo Setup** | 500 | Landing, sample data, patient list |
| **Documentation** | 3,500+ | Complete guides and references |
| **TOTAL** | **11,353+** | Production-ready TypeScript code |

## 🎯 What's Next?

### Phase 5: WebSocket Client (~250 lines)
- Real-time sync for appointments, messages, notes
- Auto-reconnect with exponential backoff
- React hook: `useWebSocket(eventTypes, handlers)`

### Phase 6: Telemetry & Analytics (~150 lines)
- Performance metrics (TTI, FCP, LCP)
- API latency monitoring (p50, p95, p99)  
- UX tracking (clicks, drawer duration)

## 🤝 Contributing

This is a demo/portfolio project showcasing enterprise patterns. Feel free to:
- Fork and customize
- Use as a reference
- Report issues or suggestions

## 📄 License

MIT License - use freely for your projects!

## 👨‍💻 Author

Built with ❤️ using **GitHub Copilot** and **VS Code**

**Technologies:** Next.js 15, React 18, TypeScript, Tailwind CSS, Shadcn UI

---

### ⭐ Star this repo if you found it helpful!

**Questions?** Open an issue or reach out.

**Demo URL:** Run `npm run dev` and open `http://localhost:3000`
