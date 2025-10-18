# CareLoop Platform — Complete Design Specification
## Apple.com-Inspired Dental Practice Management System

---

## 🎯 Platform Overview

CareLoop is a premium, AI-powered dental practice management platform featuring:
- **Homepage**: Comprehensive clientele list with rich patient profiles
- **Master Calendar**: Intelligent scheduling system with AI receptionist integration
- **Unified Patient Records**: Seamless access to patient data from any entry point
- **Role-Based Access**: Doctor and Admin views with appropriate permissions

**Design Philosophy**: Apple-grade polish with sky-blue accents, breathable layouts, and fluid interactions.

---

## 🌤️ PART 1: HOMEPAGE — CLIENTELE LIST

### Current Implementation Status
✅ **Already Built** (See `ANALYTICS_UPDATE.md` for details):
- CareLoop logo/home button (centered, gradient design)
- Analytics dashboard (6 key metrics with animated counters)
- Global search bar (centered, instant filtering)
- Patient cards grid/list (responsive 3/2/1 columns)
- Patient detail panel (right drawer with 4 tabs)

### Enhanced Features to Add

#### **1.1 Header Bar Enhancements**

**Current**: Simplified header removed in favor of centered logo + analytics approach

**Proposed Enhancement**: Add subtle top nav bar for cross-platform navigation

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] CareLoop        [Patients] [Calendar] [Reports]  [👤] │
│                        ────────                               │  ← Active indicator
└─────────────────────────────────────────────────────────────┘
```

**Layout**:
- Height: 56px (condensed, minimal)
- Background: White with 1px bottom border (#E5E5E7)
- Sticky position, backdrop blur on scroll
- Links: Patients (current), Calendar (new), Reports (future)
- Active page: 3px sky-blue underline
- Right: Profile menu (avatar, dropdown)

**Profile Menu Dropdown**:
- User name + role badge (Doctor/Admin)
- Settings
- Preferences
- Dark Mode Toggle
- Log Out
- Dividers between sections
- 320px width, right-aligned
- Smooth 200ms fade + slide from top

#### **1.2 Filter System Enhancement**

**Location**: Below analytics dashboard, above search bar

**New Filter Panel** (Expandable):
```
[🔽 Advanced Filters] ────────────────────────────
```

**When Expanded** (slides down 300ms):
```
┌─────────────────────────────────────────────────┐
│ Insurance Provider                               │
│ ☐ Delta Dental  ☐ Cigna  ☐ Aetna  ☐ MetLife    │
│                                                  │
│ Coverage Tier                                    │
│ ◉ All  ○ ≥80%  ○ 50-79%  ○ <50%  ○ None        │
│                                                  │
│ Health Flags                                     │
│ ☐ Has Allergies  ☐ Pre-medication Required      │
│ ☐ Outstanding Balance  ☐ Follow-up Due          │
│                                                  │
│ Last Visit                                       │
│ [From: ___________] [To: ___________]           │
│                                                  │
│ Visit Frequency                                  │
│ ○ All  ○ 0-2 visits  ○ 3-5 visits  ○ 6+ visits  │
│                                                  │
│          [Clear All]     [Apply Filters (3)]    │
└─────────────────────────────────────────────────┘
```

**Design Details**:
- Background: #F5F5F7 (light gray)
- Padding: 24px
- Border-radius: 16px
- Checkbox style: Rounded squares, sky-blue when checked
- Radio buttons: Circular, sky-blue fill
- Date pickers: Calendar popup, highlights selected range
- "Apply" button: Sky-blue, shows active filter count
- "Clear All": Text link, sky-blue, hover underline

**Active Filter Chips** (when collapsed):
```
[Delta Dental ✕] [≥80% Coverage ✕] [Last 90 days ✕]
```
- Horizontal scroll on mobile
- Each chip: 32px height, rounded-full
- Background: Sky-blue/10, border: Sky-blue/20
- X icon removes individual filter
- Hover: Background → Sky-blue/20

#### **1.3 Enhanced Patient Cards**

**Additional Status Chips**:
- **Follow-up Due**: Orange background, calendar icon
- **High-value Patient**: Gold background, star icon (lifetime spend >$5k)
- **New Patient**: Green background, "NEW" badge (<3 visits)
- **VIP**: Purple background, crown icon (custom flag)

**Quick Actions Enhancement**:
- **Message**: Opens SMS/Email modal
- **Call**: Initiates Twilio call or click-to-call
- **Book**: Opens booking modal (pre-filled with patient)
- **Profile**: Opens detail panel

**Card Interactions**:
- **Right-click context menu**: Quick actions menu
- **Swipe gestures** (mobile): Swipe right → Call, Swipe left → Book
- **Keyboard shortcuts**: Arrow keys navigate, Enter opens, B books, C calls

#### **1.4 Patient Detail Panel — Enhanced**

**Current Tabs**: Overview, Medical History, Visits, Billing

**New/Enhanced Tabs**:

**Tab 1: Overview** (Enhanced)
- Add: Profile photo upload
- Add: Email address
- Add: Emergency contact relationship dropdown
- Add: Preferred contact method (Phone/SMS/Email)
- Add: Language preference
- Add: Accessibility needs

**Tab 2: Medical History** (Enhanced)
- Add: Interactive dental chart (32 teeth SVG)
  - Click tooth → Show history for that tooth
  - Color-coded: Healthy (white), Cavity (yellow), Crown (blue), Missing (gray), Root canal (red)
  - Hover tooltip: Last procedure + date
- Add: Attachments section with thumbnails
  - X-rays (lightbox view on click)
  - Photos (before/after comparisons)
  - Scanned documents (PDF viewer)
  - Upload button with drag-and-drop

**Tab 3: Dental Records** (New/Renamed)
- Procedures timeline (vertical, most recent first)
- Tooth chart (interactive, as described above)
- Treatment plans (active vs completed)
- Doctor notes (rich text editor, auto-save)
- Files & attachments

**Tab 4: Visits** (Enhanced)
- Add: Filter by date range
- Add: Export to CSV/PDF
- Add: Payment status filter (Paid/Pending/Overdue)
- Add: Insurance claim status

**Tab 5: Billing** (Enhanced)
- Add: Payment history chart (bar chart by month)
- Add: "Send Invoice" button
- Add: "Record Payment" button → modal
- Add: Payment plan details (if applicable)
- Add: Insurance claim tracker

**NEW Tab 6: Doctor Notes** (Editable)
- Rich text editor (bold, italic, lists, headings)
- Auto-save (every 3 seconds)
- Version history (timestamp + doctor name)
- Restore previous version
- Privacy indicator (visible to patient: Yes/No toggle)

**Panel Header Actions**:
- **Download PDF**: Generates patient summary report
- **Print**: Print-friendly view
- **Share**: Copy link to patient record (with auth)
- **Edit**: Toggle edit mode for all fields
- **Delete**: Archive patient (requires confirmation)

#### **1.5 Empty States**

**No Patients**:
```
     ┌─────────────────┐
     │   📋           │  (Illustrated clipboard with tooth icon)
     │                 │
     └─────────────────┘
     
     No Patients Yet
     
     Get started by adding your first patient
     to the CareLoop system.
     
     [+ Add First Patient]
```

**No Search Results**:
```
     ┌─────────────────┐
     │   🔍 0          │  (Magnifying glass with zero)
     │                 │
     └─────────────────┘
     
     No patients found for "John Doe"
     
     Try adjusting your search or filters.
     
     [Clear Filters]  [Clear Search]
```

**Filter Results Empty**:
```
     Filters active: Delta Dental, Has Allergies
     
     No patients match these filters.
     
     [Clear Filters]
```

---

## 📅 PART 2: MASTER CALENDAR — SCHEDULE PAGE

### 2.1 Page Layout Hierarchy

```
┌──────────────────────────────────────────────────────────────┐
│ [Logo] CareLoop    [Patients] [Calendar] [Reports]      [👤] │ ← Top Nav (56px)
│                              ────────                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 Schedule Overview                                        │ ← Analytics Section
│  ─────────────────────                                       │   (240px height)
│                                                              │
│  [Total: 24] [AI: 15] [Manual: 9] [Rescheduled: 2]          │
│  [Upcoming 7d: 18] [Most Frequent: Cleaning]                │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  [Day] [Week] [Month]    [Dr. Smith ▾]    [Today] [< Oct >] │ ← Controls Bar
│                                                              │   (64px)
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│                                                              │
│              CALENDAR VIEW AREA                              │ ← Calendar
│              (Dynamic based on view)                         │   (Remaining height)
│                                                              │
│                                                              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                                                    [+ Book] ← Floating button
```

### 2.2 Analytics Dashboard (Top Section)

**Layout**: Horizontal row of 6 metric cards

**Card 1: Total Bookings**
```
┌─────────────────────┐
│ 📅 TOTAL BOOKINGS   │ ← Icon + Label (12px uppercase)
│                     │
│       24            │ ← Value (36px semibold)
│                     │
│ ↑ 8% vs last week   │ ← Trend (12px, green)
└─────────────────────┘
```
- Background: White
- Border: 1px #E5E5E7
- Border-radius: 16px
- Padding: 20px
- Hover: Lift -2px, shadow enhancement
- Click: Highlights all bookings in calendar
- Color: Neutral gray icon

**Card 2: AI Agent Bookings**
```
┌─────────────────────┐
│ 🤖 AI BOOKINGS      │
│                     │
│       15            │
│                     │
│ 62.5% of total      │ ← Percentage
└─────────────────────┘
```
- Icon: Robot/AI symbol
- Color: Light blue (#87CEEB)
- Click: Filters calendar to show only AI bookings
- Percentage bar at bottom (visual fill)

**Card 3: Manual Bookings**
```
┌─────────────────────┐
│ ✋ MANUAL BOOKINGS  │
│                     │
│        9            │
│                     │
│ 37.5% of total      │
└─────────────────────┘
```
- Icon: Hand/Person symbol
- Color: Green (#34C759)
- Click: Filters to manual bookings only

**Card 4: Rescheduled**
```
┌─────────────────────┐
│ 🔄 RESCHEDULED      │
│                     │
│        2            │
│                     │
│ Last 7 days         │
└─────────────────────┘
```
- Icon: Circular arrows
- Color: Orange (#FF9500)
- Click: Shows rescheduled appointments

**Card 5: Upcoming (7 Days)**
```
┌─────────────────────┐
│ ⏰ UPCOMING         │
│                     │
│       18            │
│                     │
│ Next 7 days         │
└─────────────────────┘
```
- Icon: Clock/Calendar
- Color: Purple (#5856D6)
- Shows only future appointments

**Card 6: Most Frequent Procedure**
```
┌─────────────────────┐
│ 🦷 TOP PROCEDURE    │
│                     │
│   Cleaning          │ ← Text value
│                     │
│ 12 this month       │
└─────────────────────┘
```
- Icon: Tooth
- Color: Pink (#FF2D55)
- Shows procedure name + count
- Click: Filters to this procedure type

**Analytics Interactions**:
- All cards clickable to filter calendar
- Active filters show sky-blue border (2px)
- Click again to deactivate filter
- Multiple filters can be active (AND logic)
- "Clear Filters" link appears when any active

**Responsive Behavior**:
- Desktop: 6 cards in one row
- Tablet: 3 cards × 2 rows
- Mobile: 2 cards × 3 rows or vertical stack

### 2.3 Controls Bar

**Left Section**: View Toggle
```
[Day] [Week] [Month]
```
- Three buttons, pill-style group
- Active: Sky-blue background, white text
- Inactive: Gray text, transparent background
- Smooth transition between views (300ms)

**Center Section**: Doctor Filter (if Admin)
```
[Dr. Smith ▾]
```
- Dropdown showing all doctors
- Options:
  - All Doctors (admin only)
  - Dr. Smith
  - Dr. Johnson
  - Dr. Lee
  - etc.
- Doctor view: Shows only their name, no dropdown
- Active selection shown in button
- Avatar icon next to name

**Right Section**: Date Navigation
```
[Today]  [◀ October 2025 ▶]
```
- "Today" button: Jumps to current date
- Month/Year selector: Click to open date picker
- Arrow buttons: Navigate prev/next period
- Keyboard shortcuts: ← → for navigation

### 2.4 Calendar Views

#### **2.4.1 DAY VIEW**

**Layout**: Hourly timeline (8 AM - 6 PM)

```
┌────────┬────────────────────────────────────────┐
│ 8 AM   │                                        │
│        │ ┌──────────────────────────────────┐   │
│        │ │ Sarah Johnson                    │   │ ← AI Booking (Light Blue)
│        │ │ 8:30 - 9:00 AM                   │   │
│        │ │ Cleaning • Dr. Smith             │   │
│        │ │ 🤖 AI Agent                      │   │
│        │ └──────────────────────────────────┘   │
├────────┼────────────────────────────────────────┤
│ 9 AM   │                                        │
│        │                                        │
├────────┼────────────────────────────────────────┤
│ 10 AM  │ ┌──────────────────────────────────┐   │
│        │ │ Michael Chen                     │   │ ← Manual Booking (Green)
│        │ │ 10:00 - 11:30 AM                 │   │
│        │ │ Root Canal • Dr. Lee             │   │
│        │ │ ✋ Manual                         │   │
│        │ └──────────────────────────────────┘   │
├────────┼────────────────────────────────────────┤
│ 11 AM  │                                        │
...
```

**Appointment Card Design**:
- Width: 100% of column (minus padding)
- Height: Proportional to duration (30px per 15 min)
- Border-left: 4px solid (color by source)
- Background: White with subtle color tint
- Padding: 12px
- Border-radius: 8px
- Shadow: Subtle drop shadow

**Card Contents**:
1. Patient name (14px, semibold)
2. Time range (12px, gray)
3. Procedure type • Doctor name (12px, gray)
4. Source badge (12px, icon + text)

**Color Coding**:
- **AI Booking**: Border-left #87CEEB, background rgba(135, 206, 235, 0.05)
- **Manual Booking**: Border-left #34C759, background rgba(52, 199, 89, 0.05)
- **Rescheduled**: Orange accent (#FF9500)

**States**:
- **Default**: As above
- **Hover**: Lift -2px, enhanced shadow, scale 1.02
- **Selected**: Sky-blue border (2px all sides)
- **Past**: Reduced opacity (0.6), gray text
- **Conflicting**: Red border (overlapping times)

**Drag & Drop**:
- Cursor: grab → grabbing
- While dragging: Opacity 0.8, scale 0.98
- Drop zones: Highlight with dashed border
- Valid drop: Green border
- Invalid drop: Red border + shake animation
- On drop: Smooth snap to time slot, confirmation toast

**Empty Time Slots**:
- Background: #FBFBFB
- Hover: Background → #F5F5F7
- Click: Opens booking modal with pre-filled time

#### **2.4.2 WEEK VIEW**

**Layout**: 7-column grid (Mon-Sun) × hourly rows

```
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ 8 AM │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat  │ Sun  │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│      │ [A]  │      │ [M]  │      │ [A]  │      │
│      │      │ [A]  │      │ [M]  │      │      │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ 9 AM │      │ [M]  │      │ [A]  │      │      │
...
```

**Legend**:
- [A] = AI Booking (light blue card)
- [M] = Manual Booking (green card)

**Card Design (Compact)**:
- Width: Column width - 8px margin
- Height: Proportional to duration (min 40px)
- Content: Patient name + time only
- Hover: Tooltip shows full details
- Click: Opens patient detail panel

**Column Headers**:
- Date + Day name (e.g., "Mon 21")
- Today: Sky-blue background, white text
- Weekend: Light gray background
- Height: 48px

**Responsive**:
- Desktop: Show all 7 days
- Tablet: Show 5 days (Mon-Fri)
- Mobile: Show 1 day, swipe to navigate

#### **2.4.3 MONTH VIEW**

**Layout**: Traditional calendar grid (7×5 or 7×6)

```
┌────┬────┬────┬────┬────┬────┬────┐
│ Mo │ Tu │ We │ Th │ Fr │ Sa │ Su │
├────┼────┼────┼────┼────┼────┼────┤
│    │    │ 1  │ 2  │ 3  │ 4  │ 5  │
│    │    │ •2 │ •1 │ •3 │    │    │ ← Dots = appointment count
├────┼────┼────┼────┼────┼────┼────┤
│ 6  │ 7  │ 8  │ 9  │ 10 │ 11 │ 12 │
│ •1 │ •4 │ •2 │    │ •3 │ •1 │    │
...
```

**Day Cell Design**:
- Size: ~120px × 120px (responsive)
- Border: 1px #E5E5E7
- Padding: 8px
- Date number: Top-left (18px, semibold)
- Appointment indicators: Colored dots (8px)
  - Light blue = AI bookings
  - Green = Manual bookings
  - Orange = Rescheduled
- Max 3 dots shown, "+X more" text if >3
- Today: Sky-blue border (2px)
- Selected: Sky-blue background

**Cell States**:
- **Default**: White background
- **Hover**: Light gray background (#F5F5F7)
- **Has Bookings**: Dots visible
- **Past**: Gray text, reduced opacity
- **Different Month**: Very light gray (#FBFBFB)

**Click Behavior**:
- Click date → Switches to Day view for that date
- Click dot → Opens filtered list of that day's appointments

### 2.5 Floating Action Button (FAB)

**Position**: Bottom-right corner (fixed)
- Right: 32px
- Bottom: 32px
- Z-index: 100

**Design**:
```
     ┌─────┐
     │  +  │  ← Plus icon (24px, white)
     └─────┘
```
- Size: 64×64px circle
- Background: Sky-blue gradient (#87CEEB → #6BA8D9)
- Shadow: 0 8px 16px rgba(135, 206, 235, 0.4)
- Icon: Plus symbol (white, 24px)
- Text: "Book" (optional, shows on hover)

**States**:
- **Default**: As above
- **Hover**: Scale 1.1, shadow intensifies
- **Active**: Scale 0.95, darker gradient
- **Click**: Opens booking modal

**Mobile**: Slightly smaller (56×56px), always shows

### 2.6 Booking Modal

**Trigger**: Click FAB or empty time slot or "Book" quick action

**Modal Design**: Centered overlay (600px width)

```
┌───────────────────────────────────────────────────┐
│  ✕                                                 │ ← Close button
│                                                    │
│  New Appointment                                   │ ← Title (24px)
│  ─────────────────────                             │
│                                                    │
│  Patient                                           │
│  [Search or create patient...]         ▾          │ ← Autocomplete
│                                                    │
│  Date & Time                                       │
│  [Oct 21, 2025]  [10:00 AM] - [11:00 AM]          │ ← Date + time pickers
│                                                    │
│  Doctor                                            │
│  [Dr. Smith]                              ▾        │ ← Dropdown
│                                                    │
│  Procedure                                         │
│  [Cleaning]                               ▾        │ ← Dropdown
│                                                    │
│  Insurance                                         │
│  [Delta Dental]                           ▾        │ ← Dropdown
│  Coverage: 80%                                     │ ← Auto-filled
│                                                    │
│  Notes (Optional)                                  │
│  [Additional details...]                           │ ← Textarea
│                                                    │
│  Booking Source                                    │
│  ○ Manual Entry    ○ AI Agent                      │ ← Radio buttons
│                                                    │
│  ─────────────────────────────────────────────     │
│                                                    │
│           [Cancel]         [Create Booking]        │
└───────────────────────────────────────────────────┘
```

**Field Details**:

**1. Patient Search/Select**:
- Autocomplete dropdown
- Type to search existing patients (name/phone)
- Shows: Avatar + Name + Phone
- "Create New Patient" option at bottom
- Click → Pre-fills insurance from patient record

**2. Date & Time**:
- Date picker: Calendar popup, highlights available days
- Start time: 15-min increments
- End time: Auto-calculates based on procedure (editable)
- Duration shown: "1 hour" (dynamic)
- Conflict warning if overlaps: "⚠️ Dr. Smith has another appointment at 10:30"

**3. Doctor**:
- Dropdown of all doctors
- Shows availability indicator: 🟢 Available, 🟡 Busy, 🔴 Unavailable
- Admin sees all, Doctors see only themselves (pre-selected)

**4. Procedure**:
- Dropdown: Cleaning, Filling, Root Canal, Crown, Extraction, Consultation, etc.
- Custom option: "Other" → text input
- Auto-fills estimated duration

**5. Insurance**:
- Dropdown from patient's insurance records
- Shows: Provider + Coverage %
- "No Insurance" option
- Estimated cost preview: "Est. cost: $150 (You pay: $30)"

**6. Notes**:
- Textarea (optional)
- Placeholder: "Add any special instructions or notes..."
- Max 500 characters

**7. Booking Source**:
- Radio buttons: Manual Entry (default) or AI Agent
- If AI: Shows "AI Confirmation Time" field (read-only, auto-filled)
- Manual: Shows "Created by [Current User]"

**Buttons**:
- Cancel: Gray outline, hover → light gray bg
- Create: Sky-blue, hover → darker blue, disabled until valid

**Validation**:
- Required: Patient, Date/Time, Doctor, Procedure
- Red border + error message on submit if invalid
- Live validation on blur

**Success**:
- Modal closes with fade-out (200ms)
- Toast notification: "✓ Appointment booked for [Patient] on [Date]"
- Calendar updates immediately with new appointment

### 2.7 Patient Detail Panel (from Calendar)

**Identical to Homepage Version**:
- Same right drawer design (480px width)
- Same tabs: Overview, Medical History, Dental Records, Visits, Billing, Doctor Notes
- Same interactions, animations, and content

**Additional Context**:
- Header shows: "From appointment: [Date] @ [Time]"
- Quick action: "Reschedule" button (top-right)
- "Cancel Appointment" button (with confirmation)

**Reschedule Flow**:
1. Click "Reschedule"
2. Opens booking modal (pre-filled with current appointment)
3. Change date/time/doctor
4. Save → Updates appointment, marks as "Rescheduled"
5. Toast: "✓ Appointment rescheduled to [New Date]"
6. Email/SMS sent to patient (optional)

### 2.8 Hover Interactions

**Appointment Card Hover** (Day/Week View):
```
┌────────────────────────────────────────┐
│ Tooltip appears above/below            │
│                                         │
│ Sarah Johnson                           │
│ Oct 21, 2025 • 8:30 - 9:00 AM          │
│ Cleaning                                │
│ Dr. Smith                               │
│ Insurance: Delta Dental (80%)           │
│ Booked by: AI Agent                     │
│ Phone: (310) 555-0198                   │
│                                         │
│ [View Profile] [Reschedule] [Cancel]    │
└────────────────────────────────────────┘
```

**Design**:
- Background: White
- Border: 1px #E5E5E7
- Border-radius: 12px
- Shadow: 0 4px 12px rgba(0,0,0,0.1)
- Padding: 16px
- Max-width: 300px
- Arrow pointing to card
- Appears after 300ms hover delay
- Quick action buttons at bottom

**Month View Cell Hover**:
- Shows mini list of appointments:
  ```
  October 21, 2025
  
  • 8:30 AM - Sarah Johnson (AI)
  • 10:00 AM - Michael Chen (Manual)
  • 2:00 PM - Emily Rodriguez (AI)
  
  [View Day]
  ```

### 2.9 Conflict Detection & Resolution

**Overlapping Appointments**:
- When booking, system checks for conflicts
- Warning message: "⚠️ Time slot overlaps with existing appointment"
- Visual: Red border on conflicting appointment
- Options:
  1. Choose different time
  2. Book anyway (override, requires reason)
  3. Auto-suggest next available slot

**Double-Booking Prevention**:
- Admin can override (with warning)
- Doctor cannot double-book themselves
- Patient cannot have 2 appointments at same time

**Busy Indicators**:
- Doctor availability shown in real-time
- Time slots with 80%+ capacity: Yellow tint
- Fully booked slots: Gray out, "Fully Booked" label

### 2.10 Notifications & Confirmations

**Toast Notifications** (Bottom-right corner):
```
┌─────────────────────────────────┐
│ ✓  Appointment Created          │ ← Success (green icon)
│    Sarah Johnson • Oct 21       │
└─────────────────────────────────┘
```

**Types**:
- **Success** (green): Booking created, rescheduled, canceled
- **Warning** (orange): Conflict detected, missing info
- **Error** (red): Failed to save, network error
- **Info** (blue): Reminder, tip

**Duration**: 4 seconds, slide-in from right, stack vertically

**Confirmation Dialogs**:
```
┌─────────────────────────────────────┐
│                                     │
│  ⚠️  Cancel Appointment?            │
│                                     │
│  This will cancel Sarah Johnson's   │
│  appointment on Oct 21 at 8:30 AM.  │
│                                     │
│  [Notify Patient] ☑️                │
│                                     │
│  [Go Back]    [Yes, Cancel]         │
└─────────────────────────────────────┘
```

- Modal overlay (dark bg, 0.5 opacity)
- Centered dialog (400px width)
- Warning icon for destructive actions
- Checkbox options (e.g., notify patient)
- Cancel button (secondary) + Confirm button (primary)

---

## 🧠 PART 3: INTEGRATION & BEHAVIOR

### 3.1 AI Receptionist Integration

**Data Flow**:
```
Twilio Call/SMS → AI Agent → CareLoop API → Database
                                    ↓
                          Calendar Auto-Update
```

**Appointment Metadata** (AI Bookings):
- **Source**: "AI Agent"
- **Confirmation Time**: Timestamp when AI booked
- **Patient Response Type**: Call, SMS, or Chat
- **Confidence Score**: AI's confidence in understanding (0-100%)
- **Transcript**: Full conversation (optional, privacy toggle)
- **Phone Number**: Original contact number

**Visual Indicators**:
- AI bookings have 🤖 badge
- Light blue color coding
- "AI Confidence: 95%" in details panel (if Admin)

**Manual Review**:
- Low confidence bookings (<80%) flagged for review
- Admin notification: "New AI booking requires confirmation"
- One-click approve/reject workflow

### 3.2 Calendar Sync

**External Calendar Integration**:
- **Google Calendar**: Two-way sync
- **Apple Calendar**: Read-only export
- **Outlook**: Two-way sync (optional)

**Sync Behavior**:
- Real-time push on CareLoop changes
- Poll external calendars every 5 minutes
- Conflict resolution: CareLoop is source of truth
- Visual indicator: "Last synced: 2 min ago"

**Sync Settings** (in Profile → Preferences):
```
☑️ Sync to Google Calendar
☐ Sync to Outlook
☑️ Include patient names (HIPAA warning)
☐ Include procedure details
Sync Frequency: [Every 5 minutes ▾]
```

### 3.3 Role-Based Access Control (RBAC)

**Admin Role**:
- ✅ View all appointments (all doctors)
- ✅ Create/edit/delete any appointment
- ✅ Access all patient records
- ✅ View AI booking metadata
- ✅ Override conflicts
- ✅ Export reports
- ✅ Manage doctors/staff

**Doctor Role**:
- ✅ View own appointments only
- ✅ Create appointments (own schedule)
- ✅ Access assigned patient records
- ❌ View other doctors' schedules (unless shared)
- ❌ Delete appointments (can cancel)
- ❌ Override system conflicts
- ✅ Add doctor notes

**Receptionist Role** (Optional):
- ✅ View all appointments
- ✅ Create appointments (any doctor)
- ✅ Basic patient info access
- ❌ Edit medical records
- ❌ View billing details
- ✅ Manual booking only (no AI access)

**Visual Indicators**:
- Doctor view: "My Schedule" title, no doctor filter
- Admin view: "All Schedules" title, doctor dropdown shown
- Disabled actions: Gray out buttons, tooltip explains why

### 3.4 Search & Filters (Calendar)

**Global Search** (Top-right):
```
[🔍 Search appointments...]
```

**Searches**:
- Patient name
- Procedure type
- Doctor name
- Phone number
- Insurance provider

**Results Dropdown**:
- Live results as you type
- Highlights matching appointments in calendar
- Click result → Jumps to that date/time

**Advanced Filters** (Icon next to search):
```
[🔽 Filters]
```

**Filter Panel** (slides down):
```
☑️ AI Bookings
☑️ Manual Bookings
☐ Rescheduled Only
☐ Canceled (show)

Doctor: [All ▾]
Procedure: [All ▾]
Date Range: [This Week ▾]

[Clear] [Apply]
```

**Active Filters Shown**:
```
[AI Bookings ✕] [This Week ✕]
```

### 3.5 Keyboard Shortcuts

**Global**:
- `Cmd/Ctrl + K`: Global search (focus)
- `Cmd/Ctrl + N`: New booking
- `Cmd/Ctrl + ,`: Settings
- `/`: Focus search
- `Esc`: Close modal/panel

**Calendar Navigation**:
- `←` / `→`: Previous/Next day/week/month
- `T`: Jump to Today
- `D`: Switch to Day view
- `W`: Switch to Week view
- `M`: Switch to Month view

**Appointment Actions**:
- `Enter`: Open selected appointment
- `E`: Edit appointment
- `R`: Reschedule
- `Del`: Cancel (with confirmation)

**Accessibility**:
- Tab order: Logical flow (top to bottom, left to right)
- Focus visible: 3px sky-blue ring
- Screen reader: ARIA labels on all interactive elements

---

## 🎨 PART 4: GLOBAL DESIGN SYSTEM

### 4.1 Color Palette

**Primary Colors**:
```css
Sky Blue:        #87CEEB  (Primary accent, buttons, links)
Sky Blue Dark:   #6BA8D9  (Hover states, gradients)
Sky Blue Light:  #B0E0F6  (Backgrounds, tints)
```

**Semantic Colors**:
```css
Success:    #34C759  (Green - Manual bookings, success states)
Warning:    #FF9500  (Orange - Rescheduled, warnings)
Error:      #FF3B30  (Red - Errors, conflicts, destructive actions)
Info:       #5856D6  (Purple - Informational states)
```

**Neutral Palette**:
```css
White:           #FFFFFF  (Backgrounds, cards)
Off-White:       #FBFBFB  (Subtle backgrounds)
Light Gray:      #F5F5F7  (Hover states, disabled)
Border Gray:     #E5E5E7  (Dividers, borders)
Medium Gray:     #86868B  (Secondary text, icons)
Dark Gray:       #1D1D1F  (Primary text, headings)
Black:           #000000  (Pure black, rare use)
```

**AI/Manual Booking Colors**:
```css
AI Booking:      rgba(135, 206, 235, 0.1)  (Background tint)
AI Border:       #87CEEB  (Left border, 4px)
Manual Booking:  rgba(52, 199, 89, 0.1)
Manual Border:   #34C759
```

### 4.2 Typography

**Font Family**:
```css
Primary:   'SF Pro Display', 'Inter', 'Helvetica Neue', sans-serif
Monospace: 'SF Mono', 'Roboto Mono', 'Courier New', monospace (for IDs, codes)
```

**Font Scale**:
```css
Hero:         48px / 700 / -2% letter-spacing  (Large headers)
H1:           32px / 600 / -1%  (Page titles)
H2:           24px / 600 / -0.5%  (Section headers)
H3:           20px / 600 / -0.5%  (Card titles)
Body Large:   17px / 400 / 0  (Default body text)
Body:         15px / 400 / 0  (Secondary text)
Small:        13px / 400 / 0  (Meta info, captions)
Tiny:         11px / 500 / 0.5px  (Uppercase labels)
```

**Line Heights**:
```css
Tight:   1.2  (Headings)
Normal:  1.5  (Body text)
Relaxed: 1.7  (Long-form content)
```

### 4.3 Spacing System (8px Base Grid)

```css
--space-0:    0px
--space-1:    4px   (3xs)
--space-2:    8px   (2xs)
--space-3:    12px  (xs)
--space-4:    16px  (sm)
--space-5:    24px  (md)
--space-6:    32px  (lg)
--space-7:    40px  (xl)
--space-8:    48px  (2xl)
--space-9:    64px  (3xl)
--space-10:   80px  (4xl)
```

**Usage**:
- Component padding: 16px (sm) or 24px (md)
- Section spacing: 48px (2xl) or 64px (3xl)
- Card gaps: 16px or 24px
- Button padding: 12px × 24px (vertical × horizontal)

### 4.4 Shadows & Elevation

**Card Shadows**:
```css
Resting:      0 2px 8px rgba(0, 0, 0, 0.04),
              0 1px 2px rgba(0, 0, 0, 0.06)

Hover:        0 8px 24px rgba(0, 0, 0, 0.08),
              0 2px 6px rgba(0, 0, 0, 0.08)

Active:       0 1px 4px rgba(0, 0, 0, 0.1)
```

**Panel/Modal Shadows**:
```css
Drawer:       0 16px 48px rgba(0, 0, 0, 0.12),
              0 4px 12px rgba(0, 0, 0, 0.08)

Modal:        0 24px 64px rgba(0, 0, 0, 0.16)
```

**FAB Shadow**:
```css
Default:      0 8px 16px rgba(135, 206, 235, 0.4)
Hover:        0 12px 24px rgba(135, 206, 235, 0.5)
```

### 4.5 Border Radius

```css
--radius-sm:     6px   (Small buttons, chips)
--radius-md:     8px   (Cards, inputs)
--radius-lg:     12px  (Large cards, panels)
--radius-xl:     16px  (Modals, containers)
--radius-2xl:    24px  (Hero elements)
--radius-full:   9999px (Pills, circles)
```

### 4.6 Animation & Transitions

**Timing Functions**:
```css
Ease Out:     cubic-bezier(0.4, 0, 0.2, 1)  (Default)
Ease In:      cubic-bezier(0.4, 0, 1, 1)
Ease In Out:  cubic-bezier(0.4, 0, 0.6, 1)
Spring:       cubic-bezier(0.34, 1.56, 0.64, 1)  (Bouncy)
```

**Durations**:
```css
Instant:   0ms      (Immediate state changes)
Fast:      150ms    (Micro-interactions)
Normal:    200ms    (Default transitions)
Slow:      300ms    (Panels, modals)
Slower:    400ms    (Page transitions)
```

**Common Transitions**:
```css
/* Hover state */
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Modal open */
transition: opacity 300ms, transform 300ms;

/* Color change */
transition: background-color 150ms, border-color 150ms;
```

**Animations**:
```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide up */
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Scale in */
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Shimmer (loading) */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
```

**Reduced Motion**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 4.7 Iconography

**Icon Library**: Lucide React (already used)

**Icon Sizes**:
```css
XS:   12px  (Inline with text)
SM:   16px  (Buttons, labels)
MD:   20px  (Default)
LG:   24px  (Headers, FAB)
XL:   32px  (Empty states)
2XL:  48px  (Hero icons)
```

**Icon Style**:
- Stroke width: 2px (default)
- Rounded corners on strokes
- Color: Inherits from parent text color
- Hover: Transition color 150ms

**Common Icons**:
```
Navigation:   Home, Calendar, Users, Settings, HelpCircle
Actions:      Plus, Edit, Trash, Download, Upload, Share
Status:       CheckCircle, AlertCircle, XCircle, Clock
Medical:      Activity (tooth), Pill, Syringe, FileText
Calendar:     Calendar, Clock, ChevronLeft, ChevronRight
AI:           Bot, Zap, Sparkles
```

### 4.8 Accessibility Standards

**WCAG 2.2 AA Compliance**:

**Color Contrast**:
- Text on white: #1D1D1F (21:1 ratio) ✓
- Secondary text: #86868B (4.6:1 ratio) ✓
- Sky-blue on white: #87CEEB (3.2:1 for large text) ⚠️
  - Use white text on sky-blue backgrounds
- Error red: #FF3B30 (4.5:1 ratio) ✓

**Focus Indicators**:
- 3px solid sky-blue ring
- 2px offset from element
- Visible on all interactive elements
- Never remove with CSS

**Keyboard Navigation**:
- All actions accessible via keyboard
- Logical tab order
- Skip links for main content
- Focus trap in modals
- Arrow key navigation in calendars

**Screen Reader Support**:
- Semantic HTML (header, nav, main, section, article)
- ARIA labels on icons and buttons
- ARIA live regions for dynamic content
- ARIA expanded/collapsed states
- Alt text on images
- Hidden decorative elements (aria-hidden)

**Touch Targets**:
- Minimum 44×44px (iOS guidelines)
- Adequate spacing (8px minimum)
- Large enough for finger taps

**Form Accessibility**:
- Labels associated with inputs (for attribute)
- Error messages linked (aria-describedby)
- Required fields indicated (aria-required)
- Validation feedback (aria-invalid)
- Help text available

**Color Independence**:
- Never use color alone to convey information
- Add icons, text, or patterns
- Example: Status uses color + icon + text

### 4.9 Responsive Breakpoints

```css
Mobile:        320px - 767px   (1 column, stacked)
Tablet:        768px - 1023px  (2 columns, simplified)
Desktop:       1024px - 1439px (3 columns, full features)
Large Desktop: 1440px+          (Wide layouts, more whitespace)
```

**Layout Adjustments**:

**Mobile (<768px)**:
- Analytics: 1 column, vertical stack
- Calendar: Day view only (default)
- Cards: Full width, minimal padding
- Modals: Full screen
- FAB: Slightly smaller (56px)
- Navigation: Hamburger menu

**Tablet (768-1023px)**:
- Analytics: 2 columns
- Calendar: Day or Week view
- Cards: 2 columns
- Modals: 90% width, centered
- Side panels: Full width or 50%

**Desktop (1024px+)**:
- Analytics: 3 columns (or 6 in one row)
- Calendar: All views available
- Cards: 3 columns
- Modals: Fixed width (600px)
- Side panels: 480px drawer

### 4.10 Loading States

**Skeleton Screens**:
- Use for initial page load
- Gray bars (#E5E5E7) with shimmer animation
- Match layout of actual content
- Animated gradient: #E5E5E7 → #F5F5F7 → #E5E5E7

**Spinner**:
- Use for actions (<2 seconds expected)
- Sky-blue circular spinner
- 32px diameter
- Centered in container
- Smooth rotation (1s loop)

**Progress Bars**:
- Use for uploads, long operations
- Sky-blue fill, gray track
- Height: 4px
- Animated fill (smooth transition)
- Percentage text above (optional)

**Lazy Loading**:
- Images: Blur-up effect (tiny preview → full res)
- Lists: Load more on scroll
- Tabs: Content loads on switch
- Heavy components: Code-split, load on demand

**Optimistic Updates**:
- UI updates immediately (assume success)
- Revert if API fails
- Example: Booking appears in calendar instantly, confirmed after API

---

## 📋 PART 5: IMPLEMENTATION CHECKLIST

### Phase 1: Navigation & Structure ✅
- [x] Top navigation bar (Patients, Calendar, Reports, Profile)
- [x] Unified header component
- [x] Routing between pages
- [x] Responsive navigation (mobile hamburger)

### Phase 2: Enhanced Homepage 🔄
- [x] Analytics dashboard (already built)
- [x] Patient cards (already built)
- [x] Search & filters (basic version built)
- [ ] Advanced filter panel (expandable)
- [ ] Enhanced patient detail panel (6 tabs)
- [ ] Interactive dental chart
- [ ] File attachments with thumbnails

### Phase 3: Master Calendar 📅
- [ ] Calendar analytics dashboard (6 metrics)
- [ ] Day view with hourly timeline
- [ ] Week view (7-column grid)
- [ ] Month view (calendar grid)
- [ ] View toggle (Day/Week/Month)
- [ ] Doctor filter dropdown
- [ ] Date navigation controls

### Phase 4: Booking System 📝
- [ ] Floating action button (FAB)
- [ ] Booking modal (patient, date, time, doctor, procedure)
- [ ] Patient autocomplete search
- [ ] Date/time pickers
- [ ] Conflict detection
- [ ] Drag-and-drop rescheduling
- [ ] Cancel appointment flow

### Phase 5: AI Integration 🤖
- [ ] AI booking source tracking
- [ ] Twilio integration metadata
- [ ] AI confidence scoring
- [ ] Manual review workflow
- [ ] Booking source badges (AI vs Manual)
- [ ] Color-coded appointments

### Phase 6: Calendar Sync ⚙️
- [ ] Google Calendar integration
- [ ] Outlook sync (optional)
- [ ] Two-way sync logic
- [ ] Conflict resolution
- [ ] Sync settings UI

### Phase 7: RBAC & Permissions 🔐
- [ ] Role definitions (Admin, Doctor, Receptionist)
- [ ] Permission checks on all actions
- [ ] Doctor-specific schedule view
- [ ] Admin all-schedules view
- [ ] Audit logging

### Phase 8: Polish & Optimization ✨
- [ ] Keyboard shortcuts
- [ ] Toast notifications
- [ ] Loading states (skeletons, spinners)
- [ ] Error handling & validation
- [ ] Accessibility audit (WCAG 2.2 AA)
- [ ] Performance optimization (code splitting, lazy loading)
- [ ] Dark mode (optional)

---

## 🎓 IMPLEMENTATION NOTES FOR DEVELOPERS

### Tech Stack Recommendations

**Frontend**:
- Next.js 15 (App Router) ✓ Already in use
- React 18 ✓
- TypeScript (strict mode) ✓
- Tailwind CSS v4 ✓
- Framer Motion (animations) ✓
- FullCalendar (calendar views)
- React DnD or dnd-kit (drag-and-drop)

**State Management**:
- TanStack Query (server state) ✓
- Zustand (client state) ✓
- Context API (auth, theme)

**Forms & Validation**:
- React Hook Form
- Zod (schema validation) ✓

**Date/Time**:
- date-fns ✓ Already in use
- dayjs (alternative, lighter)

**Backend** (not in scope, but needs):
- RESTful API or GraphQL
- WebSocket for real-time updates
- Twilio integration for AI receptionist
- Database: PostgreSQL or MongoDB
- Authentication: JWT or session-based
- Authorization: RBAC middleware

### File Structure Suggestion

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── patients/
│   │   └── page.tsx           ✓ Already built
│   ├── calendar/
│   │   ├── page.tsx           📅 NEW
│   │   └── components/
│   │       ├── day-view.tsx
│   │       ├── week-view.tsx
│   │       ├── month-view.tsx
│   │       └── booking-modal.tsx
│   ├── reports/
│   │   └── page.tsx           (Future)
│   └── layout.tsx             ✓
│
├── components/
│   ├── analytics/
│   │   ├── analytics-dashboard.tsx    ✓
│   │   └── metric-card.tsx
│   ├── patients/
│   │   ├── patient-card.tsx           ✓
│   │   ├── patient-details-panel.tsx  ✓ (Enhance to 6 tabs)
│   │   └── dental-chart.tsx           📅 NEW
│   ├── calendar/
│   │   ├── appointment-card.tsx       📅 NEW
│   │   ├── time-grid.tsx              📅 NEW
│   │   └── booking-fab.tsx            📅 NEW
│   ├── shared/
│   │   ├── navigation.tsx             ✓
│   │   ├── search-bar.tsx
│   │   ├── filter-panel.tsx           📅 NEW
│   │   └── toast.tsx                  📅 NEW
│   └── ui/                            ✓ (shadcn/ui-style components)
│
├── lib/
│   ├── utils/
│   │   ├── analytics.ts               ✓
│   │   ├── calendar.ts                📅 NEW
│   │   └── rbac.ts                    📅 NEW
│   ├── hooks/
│   │   ├── use-appointments.ts        📅 NEW
│   │   ├── use-patients.ts
│   │   └── use-auth.ts                📅 NEW
│   ├── types/
│   │   ├── patient.ts                 ✓
│   │   ├── appointment.ts             📅 NEW
│   │   └── user.ts                    📅 NEW
│   └── data/
│       ├── mock-patients.ts           ✓
│       └── mock-appointments.ts       📅 NEW
│
└── styles/
    └── globals.css                    ✓
```

### API Endpoints Needed

```typescript
// Patients
GET    /api/patients              // List all
GET    /api/patients/:id          // Get one
POST   /api/patients              // Create
PUT    /api/patients/:id          // Update
DELETE /api/patients/:id          // Archive

// Appointments
GET    /api/appointments          // List (with filters: doctor, date range)
GET    /api/appointments/:id      // Get one
POST   /api/appointments          // Create
PUT    /api/appointments/:id      // Update (reschedule)
DELETE /api/appointments/:id      // Cancel

// AI Bookings
GET    /api/appointments/ai       // AI-created appointments
POST   /api/appointments/ai/confirm  // Confirm low-confidence booking

// Calendar
GET    /api/calendar/availability  // Doctor availability
GET    /api/calendar/conflicts     // Check for conflicts

// Sync
POST   /api/sync/google-calendar
GET    /api/sync/status

// Analytics
GET    /api/analytics/dashboard   // Aggregate stats
GET    /api/analytics/procedures  // Procedure frequency

// Auth
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me               // Current user
```

### Database Schema (Simplified)

```sql
-- Users (doctors, admin, staff)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'doctor', 'receptionist'),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Patients
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  date_of_birth DATE NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  insurance_provider VARCHAR(255),
  insurance_member_id VARCHAR(100),
  insurance_coverage_percent INT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  doctor_id UUID REFERENCES users(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  procedure_type VARCHAR(255) NOT NULL,
  status ENUM('scheduled', 'completed', 'canceled', 'rescheduled'),
  booking_source ENUM('manual', 'ai') DEFAULT 'manual',
  ai_confidence_score INT,  -- 0-100 for AI bookings
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Dental Records
CREATE TABLE dental_records (
  id UUID PRIMARY KEY,
  patient_id UUID REFERENCES patients(id),
  tooth_number INT,  -- 1-32
  procedure_date DATE,
  procedure_type VARCHAR(255),
  doctor_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, start_time);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);
```

---

## 🚀 NEXT STEPS

1. **Review existing implementation** (`ANALYTICS_UPDATE.md`, `PATIENTS_IMPLEMENTATION.md`)
2. **Implement top navigation bar** with Patients/Calendar links
3. **Build Master Calendar page** with Day/Week/Month views
4. **Create booking modal** with all required fields
5. **Add AI booking integration** (Twilio webhook → appointment creation)
6. **Implement RBAC** (Doctor vs Admin views)
7. **Polish animations** and transitions
8. **Accessibility audit** with WCAG 2.2 AA checklist
9. **Performance optimization** (lazy loading, code splitting)
10. **User testing** and iterative refinement

---

**This comprehensive design specification provides everything developers need to build a world-class, Apple-inspired dental practice management platform. Every component, interaction, and state is documented in pixel-perfect detail.**

**Built with ❤️ for modern dental practices seeking premium software.**
