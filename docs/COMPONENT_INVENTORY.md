# Component Inventory

Complete catalog of all reusable components in CareLoop, organized by category.

## UI Primitives (`/components/ui/`)

### Button
**File:** `components/ui/button.tsx`

**Variants:**
- `default` - Primary blue button
- `destructive` - Red for dangerous actions
- `outline` - Border with transparent bg
- `secondary` - Gray background
- `ghost` - No background, subtle hover
- `link` - Text link style

**Sizes:**
- `default` - h-10 px-4
- `sm` - h-9 px-3
- `lg` - h-11 px-8
- `icon` - h-10 w-10 (square)

**Usage:**
```tsx
<Button variant="default" size="lg">
  Click Me
</Button>

<Button variant="outline" size="sm">
  <Icon className="mr-2" />
  With Icon
</Button>
```

**Features:**
- Active press animation (scale 0.98)
- Focus ring on keyboard navigation
- Disabled state support

---

### Card
**File:** `components/ui/card.tsx`

**Sub-components:**
- `Card` - Main container
- `CardHeader` - Top section with padding
- `CardTitle` - Heading (text-2xl)
- `CardDescription` - Subtitle (muted)
- `CardContent` - Main content area
- `CardFooter` - Bottom section

**Props:**
- `hover` - Enables lift on hover (optional)

**Usage:**
```tsx
<Card hover>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    Actions
  </CardFooter>
</Card>
```

**Features:**
- `rounded-2xl` corners
- Subtle shadow
- 2-4px lift on hover (if enabled)
- 200ms transition

---

### KPICard
**File:** `components/ui/kpi-card.tsx`

**Props:**
```typescript
{
  title: string;           // "Today's Appointments"
  value: string | number;  // 24 or "87%"
  trend?: number;          // +12 or -5
  sparkline?: number[];    // [18, 22, 19, 24]
  icon?: ReactNode;        // <Calendar />
  onClick?: () => void;    // Click handler
}
```

**Usage:**
```tsx
<KPICard
  title="Utilization"
  value="87%"
  trend={5}
  icon={<Activity />}
  onClick={() => navigate('/insights')}
/>
```

**Features:**
- Animated value count-up
- Trend indicator with up/down arrows
- Mini sparkline chart
- Hover lift effect
- Color-coded trends (green=up, red=down)

---

### Badge
**File:** `components/ui/badge.tsx`

**Variants:**
- `default` - Primary blue
- `secondary` - Gray
- `destructive` - Red
- `outline` - Border only

**Usage:**
```tsx
<Badge variant="default">Active</Badge>
<Badge variant="destructive">High Risk</Badge>
```

---

### Input
**File:** `components/ui/input.tsx`

**Usage:**
```tsx
<Input
  type="text"
  placeholder="Search patients..."
  className="w-full"
/>
```

**Features:**
- `rounded-lg` corners
- Focus ring
- Disabled state support

---

## Layout Components (`/components/layout/`)

### Navigation
**File:** `components/layout/navigation.tsx`

**Features:**
- Sticky positioning
- Backdrop blur on scroll
- Logo on left
- Nav links in center
- User menu on right
- Responsive (mobile menu coming soon)

**Nav Items:**
- Patients
- Calendar
- Calls
- Billing
- Insights
- Support

**Usage:**
```tsx
<Navigation />
```

---

### Footer
**File:** `components/layout/footer.tsx`

**Sections:**
- Logo & description
- Product links
- Company links
- Legal links
- Copyright

**Usage:**
```tsx
<Footer />
```

---

## Section Components (`/components/sections/`)

### Hero
**File:** `components/sections/hero.tsx`

**Features:**
- Large headline with accent color
- Subtitle text
- 3 CTA buttons (primary, secondary, tertiary)
- Gradient background
- Decorative orbs
- Entrance animation

**Usage:**
```tsx
<Hero />
```

---

### LiveStatusStrip
**File:** `components/sections/live-status-strip.tsx`

**Displays:**
- Live calls count (with pulsing indicator)
- Queued callbacks
- Average handle time

**Features:**
- Real-time updates (via state/props)
- Compact horizontal layout
- Subtle background

**Usage:**
```tsx
<LiveStatusStrip />
```

---

### KPISection
**File:** `components/sections/kpi-section.tsx`

**Contains:**
- Grid of 4 KPI cards
- "Practice Overview" heading
- Staggered entrance animations

**Metrics:**
1. Today's Appointments (count + sparkline)
2. Utilization (percentage + trend)
3. Cancellations (count + trend)
4. Insurance Verifications (count)

**Usage:**
```tsx
<KPISection />
```

---

### WorklistPanels
**File:** `components/sections/worklist-panels.tsx`

**Two panels:**

1. **Action Inbox** (left)
   - Insurance needed
   - Patient callbacks
   - Pre-auth missing
   - Balance collection
   - Color-coded priority
   - Action buttons

2. **AI Call Summaries** (right)
   - Recent call transcripts
   - Detected intents
   - Red flags (pain, emergency)
   - Quick actions

**Usage:**
```tsx
<WorklistPanels />
```

---

### PatientSearch
**File:** `components/sections/patient-search.tsx`

**Features:**
- Search input with icon
- Keyboard shortcut hint (⌘K)
- Recent patients grid
- Patient cards with:
  - Initials avatar
  - Name
  - Tags (procedure, insurance, balance)

**Usage:**
```tsx
<PatientSearch />
```

---

### SecurityBand
**File:** `components/sections/security-band.tsx`

**Badges:**
- HIPAA Ready (Shield icon)
- End-to-End Encryption (Lock icon)
- Audit Logs (FileCheck icon)

**Usage:**
```tsx
<SecurityBand />
```

---

## Page Components (`/components/pages/`)

### HomePage
**File:** `components/pages/home-page.tsx`

**Composition:**
```tsx
<Navigation />
<Hero />
<LiveStatusStrip />
<KPISection />
<WorklistPanels />
<PatientSearch />
<SecurityBand />
<Footer />
```

---

### CalendarPage
**File:** `components/pages/calendar-page.tsx`

**Layout:**
- Left rail (filters)
  - Date picker
  - Provider filter
  - Room filter
  - Appointment type
  - Legend
- Main calendar
  - FullCalendar component
  - Day/Week/Month views
  - Toolbar (Today, Prev, Next)
  - Drag-drop support

**Features:**
- Color-coded events
- Click to view details
- Drag to reschedule
- Real-time updates

---

## Patient Components (`/components/patient/`)

### PatientProfile
**File:** `components/patient/patient-profile.tsx`

**Sections:**
1. **Header**
   - Avatar/initials
   - Name, DOB, contact
   - Tags (allergies, risk level)
   - Action buttons (Call, Message)

2. **Insurance Coverage**
   - Provider & plan
   - Member ID (masked)
   - Eligibility status
   - Deductible/benefits
   - Verify button

3. **Financial Summary** (if authorized)
   - Outstanding balance
   - Last payment
   - Collect payment button

4. **Clinical Information** (if authorized)
   - Recent procedures
   - Treatment plan
   - X-ray links

5. **Recent Activity**
   - Calls, messages, reminders
   - Timeline view

**Props:**
```typescript
{
  patientId: string;
  currentUserRole: UserRole;
}
```

---

## Provider Components (`/components/providers/`)

### Providers
**File:** `components/providers/providers.tsx`

**Wraps:**
- TanStack Query Provider
- Future: Auth Provider, WebSocket Provider

**Usage:**
```tsx
// In app/layout.tsx
<Providers>
  {children}
</Providers>
```

---

## Animation Patterns

### Entrance
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.2 }}
```

### Hover Lift
```tsx
whileHover={{ y: -2 }}
transition={{ duration: 0.15 }}
```

### Stagger
```tsx
transition={{ delay: index * 0.05 }}
```

### Press
```tsx
whileTap={{ scale: 0.98 }}
```

---

## Utility Functions (`/lib/utils.ts`)

### cn()
Merges Tailwind classes with `clsx` and `tailwind-merge`
```tsx
cn('base-class', condition && 'conditional-class', className)
```

### formatCurrency()
```tsx
formatCurrency(120, 'USD') // "$120.00"
```

### getInitials()
```tsx
getInitials('Sarah Johnson') // "SJ"
```

### maskSensitiveData()
```tsx
maskSensitiveData('DD123456789', 4) // "•••••••6789"
```

---

## Styling Conventions

### Spacing Scale
- `gap-1` = 4px
- `gap-2` = 8px
- `gap-3` = 12px
- `gap-4` = 16px
- `gap-6` = 24px
- `gap-8` = 32px

### Border Radius
- `rounded-lg` = 0.5rem (forms)
- `rounded-xl` = 0.75rem (cards)
- `rounded-2xl` = 1rem (large cards)
- `rounded-full` = Circles/pills

### Shadows
- `shadow-sm` = Subtle
- `shadow-md` = Hover state
- `shadow-lg` = Modals

---

## Component Checklist

When creating new components:
- [ ] TypeScript props interface
- [ ] Framer Motion animations (if interactive)
- [ ] Accessibility (ARIA, keyboard nav)
- [ ] Responsive design
- [ ] Loading/error states
- [ ] JSDoc comments
- [ ] Reusable and composable

---

## Best Practices

1. **Keep components small** - Single responsibility
2. **Use composition** - Build complex UIs from simple parts
3. **Type everything** - No `any` types
4. **Test interactivity** - Hover, focus, active states
5. **Respect motion preferences** - `prefers-reduced-motion`
6. **Mobile-first** - Responsive by default
7. **Semantic HTML** - Use proper elements
8. **Accessible** - ARIA labels, keyboard nav

---

This inventory serves as a reference for developers building new features. All components follow consistent patterns for easy learning and maintenance.
