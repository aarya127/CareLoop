# CareLoop - Quick Start Guide

> **AI-Powered Dental Practice Management System**  
> Built with Next.js 15, TypeScript, Tailwind CSS v4, and Apple.com-inspired design

## Prerequisites

Before you begin, ensure you have:
- **Node.js** 24.10.0 or later ([Download](https://nodejs.org/))
- **npm** 11.6.0 or later
- A code editor (VS Code recommended)

## Installation

1. **Navigate to project directory:**
   ```bash
   cd /Users/saillesh/Desktop/CareLoop
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   
   Key packages installed:
   - Next.js 15.5.6 (App Router)
   - React 18 with TypeScript
   - Tailwind CSS v4 with @tailwindcss/postcss
   - Framer Motion (animations)
   - TanStack Query v5.90.5 (data fetching)
   - FullCalendar v6.1.19 (calendar views)
   - date-fns, Zod, lucide-react

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   The server will start on **port 3001** (configured in package.json)

4. **Open your browser:**
   Navigate to [http://localhost:3001](http://localhost:3001)

## What's Built (Current Status)

### ✅ **Homepage - Patients Dashboard** (COMPLETE)
Location: `/patients` route

**Features:**
- 🎯 **CareLoop Logo** - Centered gradient logo with click-to-reset functionality
- 📊 **Analytics Dashboard** - 6 metric cards with animated counters:
  - Total Clients (8)
  - Upcoming Appointments (1)
  - Outstanding Balances ($505)
  - Average Visit Cost ($235)
  - Insurance Coverage (100%)
  - Most Frequent Procedure (Prophylaxis)
- 🔍 **Smart Search** - Instant filtering by name, email, phone
- 🃏 **Patient Cards** - Grid/list view with:
  - Avatar with initials
  - Insurance badge
  - Health flags (allergies, pre-medication)
  - Quick actions (View, Book, Message)
  - Hover effects and smooth animations
- 📋 **Patient Detail Panel** - Right drawer with 4 tabs:
  - Overview (contact info, insurance, health flags)
  - Medical History (allergies table, conditions)
  - Visits (last visit card, history)
  - Billing (outstanding balance, coverage utilization)
- 🎨 **Apple-Inspired Design** - Sky blue theme, smooth animations, breathable layouts

**Sample Data:**
- 8 complete patient records
- Various insurance providers (Delta Dental, Cigna, Aetna, MetLife, Guardian)
- Mix of health conditions (allergies, pre-medication requirements)
- Real-world patient scenarios

### 🚧 **Master Calendar - Schedule Page** (60% COMPLETE)
Location: `/calendar` route (in development)

**Completed Components:**

1. **📊 Calendar Analytics Dashboard**
   - 6 metric cards: Total/AI/Manual/Rescheduled/Upcoming/Top Procedure
   - Animated number counters
   - Click-to-filter functionality
   - Active filter chips

2. **🎴 Appointment Cards**
   - Color-coded by source (AI=light blue, Manual=green, Rescheduled=orange)
   - 3 variants: day, week, list
   - Hover tooltips with full details
   - Quick action buttons
   - Past appointment styling
   - AI confidence score display

3. **📅 Day View**
   - Hourly timeline (8 AM - 6 PM)
   - Appointment cards positioned by time
   - Dynamic height based on duration
   - Current time indicator (red line)
   - Click empty slots to book
   - 30-minute dividers

4. **📆 Week View**
   - 7-column grid (Mon-Sun)
   - Compact appointment display
   - Today indicator (sky-blue)
   - Weekend styling
   - Appointment count per day
   - Click day to switch to day view

5. **➕ Floating Action Button (FAB)**
   - Fixed bottom-right position
   - Gradient sky-blue design
   - Hover/tap animations
   - Mobile-optimized variant

6. **📊 Mock Data**
   - 21 sample appointments (Oct 16-27, 2025)
   - 12 AI bookings, 9 Manual bookings
   - 3 doctors (Dr. Smith, Dr. Lee, Dr. Martinez)
   - Various procedures (Cleaning, Root Canal, Filling, Crown, etc.)

**Still To Build:**
- [ ] Month View (calendar grid with dots)
- [ ] Calendar Controls (view toggle, date navigation)
- [ ] Booking Modal (appointment creation form)
- [ ] Top Navigation (Patients/Calendar links)
- [ ] Calendar Page Assembly

### 📚 **Documentation**
- `COMPLETE_PLATFORM_DESIGN.md` - 1,000+ line comprehensive design specification
- `ANALYTICS_UPDATE.md` - Analytics dashboard implementation details
- `PATIENTS_DASHBOARD.md` - Patient card system documentation
- `CALENDAR_IMPLEMENTATION_PROGRESS.md` - Calendar development status

## First Look

**Current Routes:**
- [http://localhost:3001/patients](http://localhost:3001/patients) - ✅ Patients Dashboard (LIVE)
- [http://localhost:3001/calendar](http://localhost:3001/calendar) - 🚧 Calendar (Coming Soon)

**What You'll See:**
1. **Patients Page** - Full-featured patient management with analytics, search, and detailed profiles
2. **Smooth Animations** - Apple-grade polish with Framer Motion
3. **Responsive Design** - Mobile, tablet, desktop optimized
4. **Sky-Blue Theme** - #87CEEB primary color throughout

## Project Structure

```
CareLoop/
├── app/
│   ├── patients/              ✅ Patient dashboard page
│   │   └── page.tsx
│   ├── calendar/              🚧 Calendar page (in progress)
│   │   └── page.tsx
│   ├── layout.tsx             Root layout
│   └── globals.css            Tailwind v4 styles
│
├── components/
│   ├── patients/              ✅ Patient components
│   │   ├── patient-card.tsx
│   │   ├── patient-details-panel.tsx
│   │   └── patients-page.tsx
│   ├── analytics/             ✅ Analytics components
│   │   └── analytics-dashboard.tsx
│   ├── calendar/              ✅ Calendar components (60%)
│   │   ├── calendar-analytics-dashboard.tsx
│   │   ├── appointment-card.tsx
│   │   ├── day-view.tsx
│   │   ├── week-view.tsx
│   │   ├── floating-action-button.tsx
│   │   ├── month-view.tsx          (todo)
│   │   ├── calendar-controls.tsx   (todo)
│   │   └── booking-modal.tsx       (todo)
│   └── shared/                🚧 Shared components
│       └── navigation.tsx          (todo)
│
├── lib/
│   ├── types/                 Type definitions
│   │   ├── patient.ts
│   │   └── appointment.ts
│   ├── data/                  Mock data
│   │   ├── mock-patients.ts
│   │   └── mock-appointments.ts
│   └── utils/                 Utilities
│       ├── analytics.ts
│       └── calendar.ts
│
├── docs/                      📚 Documentation
│   ├── COMPLETE_PLATFORM_DESIGN.md
│   ├── CALENDAR_IMPLEMENTATION_PROGRESS.md
│   ├── ANALYTICS_UPDATE.md
│   └── PATIENTS_DASHBOARD.md
│
└── public/                    Static assets
```

## Key Technologies

### Frontend Stack
- **Next.js 15.5.6** - App Router, React Server Components
- **React 18** - Latest React features
- **TypeScript** - Strict mode enabled
- **Tailwind CSS v4** - Latest alpha with @theme directive
- **Framer Motion** - Smooth animations and transitions

### State & Data
- **TanStack Query v5** - Server state management
- **Zustand** - Client state management
- **date-fns** - Date manipulation

### UI & Design
- **lucide-react** - Icon library
- **FullCalendar** - Calendar views (Day/Week/Month)
- **Zod** - Schema validation

### Design Tokens
```css
/* Colors */
--color-primary: #87CEEB;        /* Sky Blue */
--color-ai: #87CEEB;             /* AI bookings */
--color-manual: #34C759;         /* Manual bookings */
--color-rescheduled: #FF9500;    /* Rescheduled */
--color-success: #34C759;
--color-warning: #FF9500;
--color-error: #FF3B30;

/* Spacing (8px grid) */
--space-xs: 12px;
--space-sm: 16px;
--space-md: 24px;
--space-lg: 32px;
--space-xl: 48px;

/* Typography */
--font-family: 'SF Pro Display', 'Inter', sans-serif;
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 20px;
--font-size-xl: 24px;
--font-size-2xl: 32px;
```

## Development Workflow

### Running the App

```bash
# Start development server (port 3001)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check (no build)
npx tsc --noEmit
```

### Making Changes

**1. Add a Patient Component:**
```bash
# Create new component
touch components/patients/my-feature.tsx
```

```typescript
// components/patients/my-feature.tsx
'use client';

import { motion } from 'framer-motion';
import type { Patient } from '@/lib/types/patient';

export default function MyFeature({ patient }: { patient: Patient }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-gray-200 bg-white p-6"
    >
      {/* Your content */}
    </motion.div>
  );
}
```

**2. Add a Calendar Component:**
```bash
# Create calendar component
touch components/calendar/my-view.tsx
```

**3. Add Mock Data:**
```typescript
// lib/data/mock-appointments.ts
export const mockAppointments: Appointment[] = [
  {
    id: 'apt-new',
    patientId: mockPatients[0].id,
    doctorId: mockDoctors[0].id,
    startTime: new Date('2025-10-20T09:00:00'),
    endTime: new Date('2025-10-20T09:30:00'),
    procedureType: 'Cleaning',
    status: 'scheduled',
    bookingSource: 'ai',
    aiConfidenceScore: 95,
    // ... other fields
  },
  // ... more appointments
];
```

**4. Create a New Page:**
```bash
mkdir app/my-page
touch app/my-page/page.tsx
```

```typescript
// app/my-page/page.tsx
export default function MyPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-semibold text-gray-900">
        My Page
      </h1>
    </main>
  );
}
```

### Styling Guidelines

**Use Tailwind CSS:**
```typescript
// ✅ Good - Tailwind utility classes
<div className="rounded-lg bg-white p-6 shadow-sm hover:shadow-md transition-shadow">

// ❌ Avoid - Inline styles
<div style={{ padding: '24px', backgroundColor: 'white' }}>
```

**Responsive Design:**
```typescript
<div className="
  grid grid-cols-1        // Mobile: 1 column
  sm:grid-cols-2          // Tablet: 2 columns
  lg:grid-cols-3          // Desktop: 3 columns
  xl:grid-cols-6          // Large: 6 columns
  gap-4
">
```

**Animations with Framer Motion:**
```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
  whileHover={{ y: -2, scale: 1.02 }}
>
```

### TypeScript Tips

**Define Types:**
```typescript
// lib/types/my-type.ts
export interface MyData {
  id: string;
  name: string;
  createdAt: Date;
}
```

**Use Type Safety:**
```typescript
import type { Patient } from '@/lib/types/patient';

function processPatient(patient: Patient) {
  // TypeScript will autocomplete and type-check
  return patient.firstName + ' ' + patient.lastName;
}
```

## Next Steps

### Phase 1: Complete Master Calendar (40% remaining)

**1. Build Month View** (2-3 hours)
```bash
touch components/calendar/month-view.tsx
```
- 7×6 calendar grid
- Day cells with appointment count dots
- Click to switch to day view
- Color-coded indicators (AI/Manual)

**2. Build Calendar Controls** (1-2 hours)
```bash
touch components/calendar/calendar-controls.tsx
```
- View toggle (Day/Week/Month pills)
- Date navigation (Today, ← →, date picker)
- Doctor filter dropdown (Admin view)

**3. Build Booking Modal** (3-4 hours)
```bash
touch components/calendar/booking-modal.tsx
```
- Patient autocomplete search
- Date/time pickers
- Doctor dropdown
- Procedure type selector
- Insurance info
- Conflict detection
- Form validation (Zod)

**4. Build Top Navigation** (1-2 hours)
```bash
touch components/shared/navigation.tsx
```
- CareLoop logo
- Patients/Calendar/Reports links
- Active page indicator
- Profile menu dropdown

**5. Assemble Calendar Page** (2-3 hours)
```bash
# Update app/calendar/page.tsx
```
- Import all calendar components
- State management (view, date, filters)
- TanStack Query integration
- Patient detail panel
- Keyboard shortcuts

### Phase 2: Backend Integration (Future)

**1. Set up API routes:**
```typescript
// app/api/appointments/route.ts
export async function GET(request: Request) {
  // Fetch appointments from database
  return Response.json(appointments);
}
```

**2. Connect Twilio for AI Receptionist:**
```typescript
// app/api/twilio/webhook/route.ts
export async function POST(request: Request) {
  // Handle incoming calls/SMS
  // Create appointments from AI conversations
}
```

**3. Add Authentication:**
```bash
npm install next-auth
```

**4. Set up Database:**
- PostgreSQL or MongoDB
- Prisma ORM
- Appointments, Patients, Doctors tables

### Phase 3: Advanced Features

- [ ] Drag-and-drop rescheduling
- [ ] Google Calendar sync
- [ ] SMS/Email reminders
- [ ] Payment processing
- [ ] Insurance claim tracking
- [ ] Doctor notes with rich text
- [ ] X-ray/photo uploads
- [ ] Reports & analytics
- [ ] Multi-practice support (tenants)
- [ ] HIPAA/PHIPA compliance features

## Troubleshooting

### Port already in use
```bash
# The app runs on port 3001 (configured in package.json)
# If port 3001 is busy:
lsof -ti:3001 | xargs kill -9

# Or change port in package.json:
"dev": "next dev -p 3002"
```

### Module not found errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### TypeScript errors
```bash
# Type check without building
npx tsc --noEmit

# Common issues:
# - Missing type imports: import type { Patient } from '@/lib/types/patient'
# - Strict null checks: Use optional chaining (patient?.firstName)
```

### Tailwind CSS not working
```bash
# Verify Tailwind v4 setup:
# 1. Check postcss.config.mjs has @tailwindcss/postcss
# 2. Check app/globals.css has @import "tailwindcss"
# 3. Restart dev server

npm run dev
```

### Build errors
```bash
# Check for type errors first
npx tsc --noEmit

# Clear Next.js cache
rm -rf .next

# Try building again
npm run build
```

### Framer Motion warnings
```bash
# If you see "useLayoutEffect" warnings in console:
# This is normal in development mode with React 18
# They will not appear in production build
```

## Design System Reference

### Color Palette

**Primary Colors:**
- Sky Blue: `#87CEEB` - Primary accent, links, buttons
- Sky Blue Dark: `#6BA8D9` - Hover states
- Sky Blue Light: `#B0E0F6` - Backgrounds

**Semantic Colors:**
- Success (Green): `#34C759` - Manual bookings, success states
- Warning (Orange): `#FF9500` - Rescheduled, warnings
- Error (Red): `#FF3B30` - Errors, destructive actions
- Info (Purple): `#5856D6` - Informational

**Neutral Colors:**
- White: `#FFFFFF`
- Off-White: `#FBFBFB`
- Light Gray: `#F5F5F7`
- Border Gray: `#E5E5E7`
- Medium Gray: `#86868B`
- Dark Gray: `#1D1D1F`

### Component Patterns

**Card Component:**
```typescript
<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200">
  {/* Content */}
</div>
```

**Button (Primary):**
```typescript
<button className="rounded-lg bg-[#87CEEB] px-6 py-2 font-medium text-white transition-colors hover:bg-[#6BA8D9]">
  Click Me
</button>
```

**Badge:**
```typescript
<span className="inline-flex items-center rounded-full bg-[#87CEEB]/10 px-3 py-1 text-sm font-medium text-[#87CEEB]">
  AI Booking
</span>
```

**Animated Card Entry:**
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: index * 0.1 }}
>
  {/* Staggered animation */}
</motion.div>
```

## Resources & Documentation

### Internal Documentation
- 📖 **[COMPLETE_PLATFORM_DESIGN.md](docs/COMPLETE_PLATFORM_DESIGN.md)** - 1,000+ line comprehensive design specification
  - Homepage design (Clientele List)
  - Master Calendar design (Day/Week/Month views)
  - Unified patient detail panel
  - Booking modal specifications
  - Complete design system (colors, typography, spacing, animations)
  - RBAC specifications
  
- 📊 **[CALENDAR_IMPLEMENTATION_PROGRESS.md](docs/CALENDAR_IMPLEMENTATION_PROGRESS.md)** - Calendar development status
  - Completed components (8/14)
  - Next steps and priorities
  - Sample data statistics
  
- 📈 **[ANALYTICS_UPDATE.md](docs/ANALYTICS_UPDATE.md)** - Analytics dashboard documentation
  - Implementation details
  - Calculation formulas
  - Performance optimizations
  
- 🎴 **[PATIENTS_DASHBOARD.md](docs/PATIENTS_DASHBOARD.md)** - Patient management system
  - Patient card variants
  - Detail panel tabs
  - Search and filtering

### External Resources
- 📘 [Next.js 15 Documentation](https://nextjs.org/docs)
- 🎨 [Tailwind CSS v4 (Alpha)](https://tailwindcss.com/docs)
- ⚡ [Framer Motion API](https://www.framer.com/motion/)
- 📅 [FullCalendar React](https://fullcalendar.io/docs/react)
- 🔄 [TanStack Query v5](https://tanstack.com/query/latest)
- 🐻 [Zustand State Management](https://zustand-demo.pmnd.rs/)
- 📆 [date-fns](https://date-fns.org/docs/Getting-Started)
- ✅ [Zod Validation](https://zod.dev/)
- 🎯 [lucide-react Icons](https://lucide.dev/)

### Quick Links
- **Dev Server:** http://localhost:3001
- **Patients Page:** http://localhost:3001/patients
- **Calendar Page:** http://localhost:3001/calendar (coming soon)
- **GitHub Issues:** (add your repo URL)
- **Figma Designs:** (add your Figma link)

## Need Help?

### Common Questions

**Q: How do I add a new appointment?**  
A: Currently using mock data. The booking modal component is in progress. Once complete, click the FAB (+ Book button).

**Q: How do I change the color theme?**  
A: Update the sky blue values in `app/globals.css` and component color references. The primary color is `#87CEEB`.

**Q: Can I use this in production?**  
A: Not yet. This is a development build with mock data. You'll need to:
- Add authentication
- Connect to a real database
- Implement API routes
- Add security measures (HIPAA/PHIPA compliance)

**Q: How do I deploy this?**  
A: Use Vercel (recommended for Next.js):
```bash
npm install -g vercel
vercel
```

**Q: Where's the backend code?**  
A: Backend is not implemented yet. Currently using mock data in `lib/data/`. You'll need to build API routes or connect to an external API.

### Getting Support

1. **Check Documentation:** Review files in `/docs` folder
2. **Search Code:** Use VS Code search (Cmd+Shift+F) to find examples
3. **TypeScript Errors:** Hover over errors in VS Code for hints
4. **Console Logs:** Check browser DevTools for runtime errors
5. **Network Tab:** Debug API calls (when backend is added)

### Contributing Guidelines

When adding features:
1. ✅ Follow TypeScript strict mode
2. ✅ Use Tailwind CSS (no inline styles)
3. ✅ Add Framer Motion for animations
4. ✅ Write responsive code (mobile-first)
5. ✅ Include loading states
6. ✅ Handle errors gracefully
7. ✅ Add accessibility attributes (ARIA)
8. ✅ Document complex logic
9. ✅ Test on Chrome, Safari, Firefox
10. ✅ Keep Apple.com design aesthetic

---

## You're All Set! 🚀

**Current Status:**
- ✅ Patients Dashboard: **100% Complete**
- 🚧 Master Calendar: **60% Complete**
- 📊 Design System: **Fully Documented**

**Next Step:** Continue building the Master Calendar (Month View → Controls → Booking Modal → Full Page)

**Happy Coding!** 💙

---

*CareLoop - AI-Powered Dental Practice Management*  
*Built with Next.js 15, TypeScript, Tailwind CSS v4, and ❤️*
