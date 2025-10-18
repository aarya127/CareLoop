# CareLoop — Service-Based Application Architecture
## Professional Dental Practice Management System

---

## 🎯 Core Philosophy

**CareLoop is an operational service dashboard, NOT a marketing website.**

This is a professional tool designed for daily use by:
- 👨‍⚕️ **Dentists** — Managing patients and procedures
- 👥 **Administrators** — Overseeing practice operations
- 💼 **Receptionists** — Scheduling and coordination
- 🤖 **AI System** — Automated booking and patient communication

**Inspiration:** Apple's native applications (Calendar, Contacts, Health)  
**Design Language:** Clean, minimal, functional — every pixel serves a purpose

---

## 🚀 Startup Behavior

### Direct-to-Workspace Launch

**When users access the application:**
```
1. User navigates to careloop.com
2. Authentication check (if not logged in → login)
3. IMMEDIATELY redirected to /patients (primary workspace)
4. NO landing pages, NO marketing content, NO splash screens
```

**Default Routes:**
- **Primary:** `/patients` (Clientele List — main operational view)
- **Alternate:** `/calendar` (Master Schedule — booking and appointments)

**Route Configuration:**
```typescript
// app/page.tsx
export default function Home() {
  redirect('/patients'); // Direct workspace access
}
```

---

## 🧭 Navigation Architecture

### Top Navigation Bar (Sticky, Always Visible)

**Layout:**
```
┌────────────────────────────────────────────────────────────────┐
│  [CareLoop Logo]  [Patients] [Calendar] [Messages]  [🔍][🔔][👤] │
└────────────────────────────────────────────────────────────────┘
```

**Components:**

#### 1. Logo (Left)
- **Design:** Sky-blue gradient circle with "C" or Sparkles icon
- **Clickable:** Returns to `/patients` (not homepage)
- **Size:** 32px × 32px
- **Animation:** Subtle rotation on hover (5deg)

#### 2. Primary Navigation Tabs
- **Patients** → `/patients` (Clientele management)
- **Calendar** → `/calendar` (Appointment scheduling)
- **Messages** → `/engagement` (Coming soon — AI communications)

**Active State:**
- Sky-blue background (#87CEEB/10)
- 3px bottom border (sky-blue)
- Smooth 200ms transition

#### 3. Right-Side Actions

**Search Button (`🔍`):**
- Click → Slide-in search overlay from top
- Backdrop blur (backdrop-filter: blur(8px))
- Auto-focus input field
- Keyboard shortcut: `⌘K` or `Ctrl+K`
- Search scope: Patients, appointments, insurance providers

**Notifications (`🔔`):**
- Red dot indicator (unread count)
- Click → Dropdown with recent activity:
  - Upcoming appointments
  - AI booking confirmations
  - Patient messages
  - Insurance updates

**Profile Dropdown (`👤`):**
- User avatar (circular, 32px)
- Name + Role badge (Dr. Smith • Administrator)
- Menu items:
  - Settings
  - Preferences
  - Dark Mode Toggle
  - Sign Out (red text)

---

## 📊 Workspace Views

### 1. Patient List (`/patients`)

**Purpose:** Primary operational view for managing patient records

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Top Navigation]                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Clientele List                                             │
│  28 patients                                                │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🔍 Search by Name, Phone, or Insurance Provider…     │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [Sort: Last Visit ↓] [View: Grid] [Filter]                │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ Patient │  │ Patient │  │ Patient │  │ Patient │      │
│  │  Card   │  │  Card   │  │  Card   │  │  Card   │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Patient Card Features:**
- **Hover:** 3D lift animation (translateY: -4px) + shadow expansion
- **Click:** Slide-in detail panel from right
- **Design:** White background, rounded corners (16px), subtle border
- **Data Displayed:**
  - Full name + age
  - Insurance provider + coverage %
  - Last visit date
  - Outstanding balance (if any)
  - Allergy indicators (red badge)

**Detail Panel (Right Slide-in):**
- **Width:** 480px (desktop), 100% (mobile)
- **Animation:** Slide + fade (300ms cubic-bezier)
- **Tabs:**
  1. **Overview** — Demographics, contact, emergency
  2. **Medical History** — Allergies, conditions, medications
  3. **Dental Records** — X-rays, procedures, notes
  4. **Insurance** — Coverage details, claims history
  5. **Visits** — Timeline of appointments and procedures
  6. **Billing** — Lifetime spend, outstanding balance

**Interactions:**
- **Search:** Real-time filtering (debounced 300ms)
- **Sort Options:**
  - Last Visit (default)
  - Name A–Z
  - Lifetime Spend ↓
  - Outstanding Balance ↓
- **View Modes:**
  - Grid (4 columns, responsive)
  - List (table view with expanded data)

### 2. Master Calendar (`/calendar`)

**Purpose:** Appointment scheduling and doctor availability management

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Top Navigation]                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📊 Quick Metrics (Collapsible)                      │   │
│  │ [Total: 42] [AI: 28] [Manual: 14] [Pending: 5]     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Oct 2025 ▼] [◀ Today ▶] [Day] [Week] [Month]            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │             CALENDAR VIEW AREA                      │   │
│  │                                                     │   │
│  │  Color-coded appointments:                          │   │
│  │  🟦 AI Bookings (Sky Blue)                          │   │
│  │  🟩 Manual Bookings (Green)                         │   │
│  │  🟧 Rescheduled (Orange)                            │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [➕ Book Appointment] ← FAB (bottom-right)                 │
└─────────────────────────────────────────────────────────────┘
```

**View Modes:**

#### Day View
- **Hourly Timeline:** 8 AM – 6 PM (configurable)
- **Current Time Indicator:** Red line (today only)
- **Appointment Cards:** Positioned absolutely by time
- **Click Empty Slot:** Opens booking modal

#### Week View
- **7-Column Grid:** Monday – Sunday
- **Compact Cards:** Show time + patient name
- **Weekend Styling:** Gray background
- **Today Indicator:** Sky-blue highlight

#### Month View (To Build)
- **7×6 Grid:** Full calendar layout
- **Day Cells:** Show appointment count dots
- **Color-Coded Dots:** AI (blue), Manual (green), Rescheduled (orange)
- **Click Day:** Switch to day view

**Interactions:**
- **Drag & Drop:** Reschedule appointments (with conflict detection)
- **Click Appointment:** Opens patient detail panel
- **FAB (Floating Action Button):** Quick booking (bottom-right, gradient sky-blue)

---

## 🎨 Design System

### Visual Language

**Inspired by Apple's design philosophy:**
- Clarity through simplicity
- Depth through layers and motion
- Purposeful animations
- Breathable white space

### Color Palette

**Primary:**
```css
Sky Blue:        #87CEEB  /* Primary actions, AI indicators */
Sky Blue Dark:   #6BA8D9  /* Hover states */
Sky Blue Light:  #B0E0F6  /* Backgrounds, gradients */
```

**Semantic:**
```css
Success:         #34C759  /* Manual bookings, confirmations */
Warning:         #FF9500  /* Pending, rescheduled */
Error:           #FF3B30  /* Alerts, cancellations */
Info:            #5856D6  /* Informational */
```

**Neutrals:**
```css
Background:      #FFFFFF  /* Pure white */
Surface:         #F5F5F7  /* Light gray cards */
Border:          #E5E5E7  /* Subtle dividers */
Text Primary:    #1D1D1F  /* Almost black */
Text Secondary:  #86868B  /* Medium gray */
```

### Typography

**Font Stack:**
```css
Primary: 'SF Pro Display', 'Inter', -apple-system, sans-serif
Monospace: 'SF Mono', 'Roboto Mono', monospace
```

**Scale:**
```css
Heading 1:  32px / 700 / -1.5% letter-spacing
Heading 2:  24px / 600 / -1% 
Heading 3:  20px / 600 / -0.5%
Body:       15px / 400 / 0
Small:      13px / 400 / 0
Caption:    12px / 400 / 0.5px
Label:      11px / 500 / 1px (uppercase)
```

### Spacing System

**8px Base Grid:**
```css
--space-1:  8px
--space-2:  16px
--space-3:  24px
--space-4:  32px
--space-5:  40px
--space-6:  48px
--space-8:  64px
```

### Shadows & Depth

**Elevation Levels:**
```css
Level 0: none                                    /* Flat elements */
Level 1: 0 2px 8px rgba(0,0,0,0.04)             /* Cards */
Level 2: 0 4px 16px rgba(0,0,0,0.08)            /* Hover cards */
Level 3: 0 8px 24px rgba(0,0,0,0.12)            /* Modals */
Level 4: 0 16px 48px rgba(0,0,0,0.16)           /* Dropdown menus */
```

### Border Radius

```css
Small:   8px   /* Buttons, inputs */
Medium:  12px  /* Cards, smaller panels */
Large:   16px  /* Main cards */
XLarge:  24px  /* Modals, major sections */
Round:   9999px /* Pills, avatars */
```

---

## 🎬 Motion & Animation

### Design Principles

1. **Purposeful:** Every animation serves a functional purpose
2. **Fast:** 150-300ms for most transitions
3. **Natural:** Easing functions mimic real-world physics
4. **Respectful:** Honor `prefers-reduced-motion`

### Timing Functions

**Standard Easing:**
```css
ease-out:     cubic-bezier(0.4, 0, 0.2, 1)  /* Most transitions */
ease-in:      cubic-bezier(0.4, 0, 1, 1)    /* Exits */
ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1)  /* Complex motions */
spring:       cubic-bezier(0.34, 1.56, 0.64, 1) /* Bouncy effects */
```

### Animation Library

#### 1. Card Hover (3D Lift)
```css
.card {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
```

#### 2. Slide-in Panel (Right)
```typescript
// Framer Motion variant
const panelVariants = {
  hidden: { 
    x: '100%', 
    opacity: 0 
  },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 30 
    }
  }
}
```

#### 3. Fade + Scale (Modals)
```typescript
const modalVariants = {
  hidden: { 
    scale: 0.95, 
    opacity: 0 
  },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.2 }
  }
}
```

#### 4. Staggered Children (List Items)
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 }
}
```

#### 5. Number Counter Animation
```typescript
// Animated count-up for metrics
<motion.span
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.8 }}
>
  {animatedValue}
</motion.span>
```

### Loading States

**Skeleton Screens:**
- Shimmer effect (left-to-right gradient animation)
- Preserve layout (no content shift)
- 1200ms duration, infinite loop

**Spinners:**
- Only for actions <2 seconds
- Sky-blue color
- Size: 24px (buttons), 48px (page loads)

---

## 🔒 Security & Compliance

### Healthcare Standards (HIPAA/PHIPA)

**Data Protection:**
- ✅ End-to-end encryption (TLS 1.3+)
- ✅ Data at rest encryption (AES-256)
- ✅ Encrypted database backups
- ✅ Secure session management (httpOnly cookies)

**Privacy Features:**
- **Masked Identifiers:** Phone numbers, policy IDs hidden by default
- **Click-to-Reveal:** Requires authentication for sensitive data
- **Auto-Logout:** 30 minutes of inactivity
- **Audit Logs:** Every view/edit action logged with timestamp + user ID

**Role-Based Access Control (RBAC):**

| Role          | Permissions                                    |
|---------------|------------------------------------------------|
| Administrator | Full access (all patients, all actions)        |
| Doctor        | Own patients only, full medical access         |
| Receptionist  | Scheduling, basic patient info (no medical)    |
| AI System     | Read appointments, write booking confirmations |

### Audit Trail Example

```typescript
interface AuditLog {
  id: string;
  action: 'view' | 'create' | 'update' | 'delete';
  resource: 'patient' | 'appointment' | 'insurance';
  resourceId: string;
  userId: string;
  userRole: 'admin' | 'doctor' | 'receptionist';
  timestamp: Date;
  ipAddress: string;
  changes?: Record<string, any>; // Before/after values
}
```

---

## ♿ Accessibility (WCAG 2.2 AA)

### Standards Compliance

**Keyboard Navigation:**
- ✅ All actions accessible via keyboard
- ✅ Logical tab order (top → bottom, left → right)
- ✅ Focus visible (3px sky-blue ring)
- ✅ Skip links to main content
- ✅ Escape key closes modals/overlays

**Screen Reader Support:**
- ✅ ARIA labels on all interactive elements
- ✅ ARIA live regions for dynamic content
- ✅ Alt text for images and icons
- ✅ Role attributes (navigation, main, complementary)
- ✅ Semantic HTML (header, nav, main, footer)

**Color Contrast:**
```
Text on white:        #1D1D1F  (21:1 ratio) ✓
Secondary text:       #86868B  (4.6:1 ratio) ✓
Sky-blue on white:    Use white text (4.5:1) ✓
Error text:           #C41E3A  (5.8:1 ratio) ✓
```

**Focus Management:**
- Focus trapped in modals
- Focus returns to trigger on close
- First focusable element auto-focused

---

## 📱 Responsive Design

### Breakpoints

```css
Mobile:   0-767px    (Single column, slide-over panels)
Tablet:   768-1023px (Adaptive 2-column, collapsible sidebars)
Laptop:   1024-1439px (Full layout, compact spacing)
Desktop:  1440px+    (Expanded layout, max 1920px width)
```

### Mobile Adaptations

**Navigation:**
- Bottom tab bar (iOS-style)
- Hamburger menu for secondary actions
- Simplified search (full-screen overlay)

**Patient List:**
- Single column cards
- Swipe gestures (left: delete, right: quick actions)
- Detail panel: Full-screen modal

**Calendar:**
- Day view only (default)
- Week view: Horizontal scroll
- Month view: Compact dots only

---

## 🚀 Performance Targets

### Load Times

```
First Contentful Paint (FCP):  <1.8s
Largest Contentful Paint (LCP): <2.5s
Time to Interactive (TTI):      <3.0s
Cumulative Layout Shift (CLS):  <0.1
```

### Optimization Strategies

**Code Splitting:**
- Route-based chunks (patients, calendar separate)
- Component lazy loading (modals, panels)
- Dynamic imports for heavy libraries

**Image Optimization:**
- Next.js Image component (automatic WebP)
- Lazy loading (below fold)
- Responsive sizes (srcset)

**Data Fetching:**
- TanStack Query for caching
- Optimistic updates
- Background refetch
- Pagination (20 items per page)

**Animation Performance:**
- GPU-accelerated properties (transform, opacity)
- will-change hints for complex animations
- Debounced scroll listeners

---

## 🛠️ Technology Stack

### Frontend

```json
{
  "framework": "Next.js 15.5.6 (App Router)",
  "language": "TypeScript (strict mode)",
  "styling": "Tailwind CSS v4",
  "animations": "Framer Motion",
  "state": "TanStack Query v5 + Zustand",
  "forms": "React Hook Form + Zod validation",
  "calendar": "FullCalendar v6 + Custom components",
  "icons": "Lucide React"
}
```

### Backend (Future)

```json
{
  "api": "Next.js API Routes / tRPC",
  "database": "PostgreSQL (Supabase)",
  "auth": "NextAuth.js + JWT",
  "storage": "AWS S3 (encrypted)",
  "ai": "OpenAI API (GPT-4 for receptionist)"
}
```

---

## 📂 File Structure

```
CareLoop/
├── app/
│   ├── page.tsx              # Redirects to /patients
│   ├── patients/
│   │   └── page.tsx          # Patient list view
│   ├── calendar/
│   │   └── page.tsx          # Calendar view
│   ├── engagement/           # (Future) AI messages
│   └── globals.css           # Global styles + animations
│
├── components/
│   ├── shared/
│   │   ├── top-navigation.tsx     # Main nav bar
│   │   └── search-overlay.tsx     # Global search
│   ├── patients/
│   │   ├── patient-card.tsx
│   │   ├── patient-details-panel.tsx
│   │   └── patients-page.tsx
│   ├── calendar/
│   │   ├── day-view.tsx
│   │   ├── week-view.tsx
│   │   ├── month-view.tsx         # (To build)
│   │   ├── appointment-card.tsx
│   │   └── booking-modal.tsx      # (To build)
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       └── modal.tsx
│
├── lib/
│   ├── types/
│   │   ├── patient.ts
│   │   └── appointment.ts
│   ├── data/
│   │   ├── mock-patients.ts       # 28 demo patients
│   │   └── mock-appointments.ts   # 21 demo appointments
│   └── utils/
│       ├── calendar.ts
│       └── analytics.ts
│
└── docs/
    ├── COMPLETE_PLATFORM_DESIGN.md      # Full UI/UX spec
    ├── ENGAGEMENT_HUB_DESIGN.md         # Messages page spec
    ├── CALENDAR_IMPLEMENTATION_PROGRESS.md
    └── SERVICE_ARCHITECTURE.md          # This file
```

---

## 🎯 User Flows

### 1. Daily Dentist Workflow

```
1. Login → Auto-redirect to /patients
2. Review today's patient list (sorted by appointment time)
3. Click patient card → Detail panel slides in
4. Review medical history, X-rays, notes
5. Switch to /calendar tab
6. View day schedule (8 AM - 6 PM timeline)
7. Click appointment → Patient details in side panel
8. Add procedure notes, update billing
9. Mark appointment complete
10. AI system sends follow-up message to patient
```

### 2. Receptionist Booking Workflow

```
1. Login → /patients view
2. Phone rings: Patient requests appointment
3. Click search icon (⌘K)
4. Type patient name → Select from results
5. Patient detail panel opens
6. Click "Book Appointment" button (or navigate to /calendar)
7. Booking modal opens:
   - Patient: Pre-filled
   - Date/Time: Select from available slots
   - Doctor: Choose from dropdown
   - Procedure: Select type
   - Insurance: Auto-populated from patient record
8. Submit → Conflict detection check
9. Appointment created → Confirmation shown
10. AI sends SMS confirmation to patient
```

### 3. AI System Automated Booking

```
1. Patient calls practice phone number
2. AI receptionist answers (voice)
3. Conversation:
   - AI: "Hello, this is CareLoop AI. How can I help?"
   - Patient: "I need a cleaning appointment"
   - AI: "Let me check availability. What's your name?"
   - Patient: "Sarah Johnson"
   - AI: [Searches patient database]
   - AI: "Hi Sarah! I have Tuesday at 9 AM or 10:30 AM. Which works?"
   - Patient: "9 AM please"
   - AI: "Perfect! Booking you for Tuesday, Oct 22 at 9 AM with Dr. Smith."
4. AI creates appointment in system (auto-tags as AI booking - blue)
5. AI logs conversation transcript
6. Admin/Doctor can review in /engagement (future)
7. Patient receives SMS confirmation
```

---

## ✅ Implementation Checklist

### ✓ Completed (Current State)

- [x] Service-based redirect (/ → /patients)
- [x] Top navigation with Patients/Calendar/Messages tabs
- [x] Global search button with slide-in overlay
- [x] Notifications bell with unread indicator
- [x] Profile dropdown with settings and logout
- [x] Patient list view (28 demo patients)
- [x] Patient detail panel (slide-in from right)
- [x] Patient search and filtering
- [x] Calendar component structure (Day/Week views)
- [x] Appointment cards with color coding
- [x] Mock data (patients + appointments)
- [x] Responsive navigation (mobile bottom tabs)
- [x] Apple-style animations (slide-down, fade, lift)

### 🚧 In Progress (Next Sprint)

- [ ] Month view calendar component
- [ ] Calendar controls bar (view toggle, date navigation)
- [ ] Booking modal with form validation
- [ ] Drag-and-drop appointment rescheduling
- [ ] Conflict detection algorithm
- [ ] Patient detail panel tabs (medical, insurance, billing)
- [ ] Quick actions on patient cards (hover menu)
- [ ] Global search functionality (actual filtering)
- [ ] Keyboard shortcuts (⌘K search, ESC close)

### 🔮 Future Features

- [ ] AI Engagement Hub page (/engagement)
- [ ] Real-time appointment updates (WebSocket)
- [ ] Voice call transcript viewer
- [ ] AI performance analytics dashboard
- [ ] Multi-practice support (franchise mode)
- [ ] Mobile native apps (iOS/Android)
- [ ] Dark mode toggle
- [ ] Custom branding (white-label)
- [ ] Patient portal (separate app)
- [ ] Integration APIs (insurance, billing systems)

---

## 🎓 Design Philosophy Summary

**CareLoop is built on five core principles:**

### 1. **Operational First**
Every screen is a tool, not a presentation. Users should land in their workspace instantly.

### 2. **Motion with Meaning**
Animations guide attention and provide feedback — never decorative, always functional.

### 3. **Healthcare-Grade UX**
Clear data hierarchy, accessible design, and compliance-first approach ensure safe, efficient workflows.

### 4. **Apple-Level Polish**
Smooth transitions, thoughtful micro-interactions, and consistent design language create a premium experience.

### 5. **AI-Enhanced, Human-Controlled**
AI handles routine tasks (booking, reminders), but humans have final authority and full visibility.

---

**Service Architecture Documentation**  
*Version 1.0 • October 17, 2025*  
*CareLoop — Professional Dental Practice Management*

Built for professionals who deserve better tools. 🦷✨
