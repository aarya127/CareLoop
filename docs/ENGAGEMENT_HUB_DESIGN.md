# Patient Engagement Hub — Design Specification
## AI-Powered Communication & Messaging Center for CareLoop

---

## 🎯 Page Purpose & Vision

The **Patient Engagement Hub** is the central command center for all patient communications in the CareLoop dental AI platform. It provides dentists, administrators, and receptionists with a comprehensive, real-time view of every interaction between patients and the practice—whether handled by the AI receptionist or human staff.

**Core Objectives:**
- 📊 Monitor all patient communications in one unified interface
- 🤖 Track AI receptionist performance and quality
- 💬 Review conversation transcripts and outcomes
- 📈 Analyze engagement metrics and conversion rates
- 🔗 Seamlessly access patient records from conversations
- ⚡ Enable quick escalation and follow-up actions

**Design Philosophy:** Apple.com-grade minimalism with sky-blue accents, breathable layouts, and intuitive information hierarchy.

---

## 🏗️ Page Architecture

### Layout Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Logo] CareLoop   [Home] [Calendar] [Engagement] [Analytics]  [🔍👤] │ ← Top Nav (56px)
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  📊 Engagement Dashboard                                             │ ← Metrics (200px)
│  ──────────────────────────                                          │
│  [Total] [AI] [Manual] [Pending] [Avg Response] [Conversion]        │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
┌───────────────────────────────┬──────────────────────────────────────┐
│ 💬 Conversation List          │  📝 Conversation Detail Panel        │
│ (Left: 40%)                   │  (Right: 60%)                        │
│                               │                                      │
│ [Filters & Toggles]           │  [Patient Header]                    │
│                               │  ─────────────────                   │
│ ┌─────────────────────────┐   │                                      │
│ │ 👤 Sarah Johnson       │   │  [Chat Transcript]                   │
│ │ 🟦 AI • Open           │   │                                      │
│ │ "I'd like to book..."  │   │                                      │
│ └─────────────────────────┘   │                                      │
│                               │                                      │
│ ┌─────────────────────────┐   │                                      │
│ │ 👤 Michael Chen        │   │  [Metadata & Actions]                │
│ │ 🟩 Manual • Resolved   │   │                                      │
│ │ "Insurance question..."│   │                                      │
│ └─────────────────────────┘   │                                      │
│                               │                                      │
│ [Load More...]                │                                      │
│                               │                                      │
└───────────────────────────────┴──────────────────────────────────────┘
```

**Responsive Breakpoints:**
- **Desktop (1440px+)**: 40/60 split, all features visible
- **Laptop (1024-1439px)**: 45/55 split, compact metadata
- **Tablet (768-1023px)**: Slide-over detail panel (full width overlay)
- **Mobile (<768px)**: Single column, tap to view detail

---

## 📊 SECTION 1: SUMMARY DASHBOARD

### 1.1 Metrics Row Layout

**Position:** Below top navigation, above conversation feed  
**Height:** 200px (fixed)  
**Background:** Light gradient (#FBFBFB → #FFFFFF)  
**Padding:** 32px horizontal, 24px vertical

**6 Metric Cards (Horizontal Row):**

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  📊 Engagement Dashboard                                            │
│  ─────────────────────────  (24px semibold, #1D1D1F)                │
│                                                                     │
│  [Card 1] [Card 2] [Card 3] [Card 4] [Card 5] [Card 6]             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### Card 1: Total Conversations Today
```
┌──────────────────────────┐
│ 💬 TOTAL CONVERSATIONS   │ ← Icon + Label (12px uppercase, #86868B)
│                          │
│         42               │ ← Value (36px semibold, #1D1D1F)
│                          │
│ ↑ 12% vs yesterday       │ ← Trend (12px, green #34C759)
└──────────────────────────┘
```
- **Icon:** 💬 Message bubble (neutral gray #86868B)
- **Color:** Neutral theme
- **Interaction:** Click → Filter to show ALL conversations
- **Active State:** Sky-blue border (2px) when filter active

#### Card 2: AI Conversations
```
┌──────────────────────────┐
│ 🤖 AI CONVERSATIONS      │
│                          │
│         28               │
│                          │
│ 66.7% of total           │ ← Percentage bar at bottom
└──────────────────────────┘
```
- **Icon:** 🤖 Robot/Bot symbol
- **Color:** Sky Blue (#87CEEB)
- **Background:** rgba(135, 206, 235, 0.05)
- **Interaction:** Click → Filter to AI-only conversations
- **Visual:** Horizontal progress bar (66.7% fill, sky-blue)

#### Card 3: Manual Conversations
```
┌──────────────────────────┐
│ 👤 MANUAL CONVERSATIONS  │
│                          │
│         14               │
│                          │
│ 33.3% of total           │
└──────────────────────────┘
```
- **Icon:** 👤 Person/Hand symbol
- **Color:** Green (#34C759)
- **Background:** rgba(52, 199, 89, 0.05)
- **Interaction:** Click → Filter to Manual-only
- **Visual:** Horizontal progress bar (33.3% fill, green)

#### Card 4: Pending Responses
```
┌──────────────────────────┐
│ ⏰ PENDING RESPONSES     │
│                          │
│          5               │
│                          │
│ Avg wait: 12 min         │
└──────────────────────────┘
```
- **Icon:** ⏰ Clock/Alert
- **Color:** Orange/Warning (#FF9500)
- **Background:** rgba(255, 149, 0, 0.05)
- **Interaction:** Click → Filter to "Open" status conversations
- **Alert:** Red dot if any pending >30 min

#### Card 5: Average Response Time
```
┌──────────────────────────┐
│ ⚡ AVG RESPONSE TIME     │
│                          │
│       2.3 min            │ ← Time value
│                          │
│ ↓ 15% faster             │ ← Improvement trend (green)
└──────────────────────────┘
```
- **Icon:** ⚡ Lightning bolt
- **Color:** Purple (#5856D6)
- **Metric:** Average time from patient message to first response
- **Trend:** Green ↓ if improved, red ↑ if slower

#### Card 6: Conversion Rate
```
┌──────────────────────────┐
│ 📈 CONVERSION RATE       │
│                          │
│        78%               │ ← Percentage
│                          │
│ 22 bookings / 28 convos  │ ← Breakdown
└──────────────────────────┘
```
- **Icon:** 📈 Chart/Graph
- **Color:** Pink (#FF2D55)
- **Definition:** % of conversations that resulted in appointments
- **Interaction:** Click → Filter to "Booked" outcome conversations

### 1.2 Card Design Details

**Common Specs:**
- **Size:** ~180px width × 140px height
- **Border-radius:** 16px
- **Border:** 1px solid #E5E5E7
- **Background:** White (#FFFFFF)
- **Padding:** 20px
- **Gap:** 16px between cards
- **Shadow (default):** 0 2px 8px rgba(0,0,0,0.04)
- **Shadow (hover):** 0 8px 24px rgba(0,0,0,0.08) + lift -2px
- **Transition:** all 200ms cubic-bezier(0.4, 0, 0.2, 1)

**Active Filter State:**
- **Border:** 2px solid #87CEEB
- **Background:** rgba(135, 206, 235, 0.05)
- **Shadow:** 0 8px 24px rgba(135, 206, 235, 0.15)
- **Top-right indicator:** 8px blue dot

**Animation:**
- **Number counters:** 800ms ease-out cubic from 0 to value
- **Card entry:** Staggered fade-in (100ms delay per card)

### 1.3 Responsive Behavior

**Desktop (1440px+):** 6 cards in one row  
**Laptop (1024-1439px):** 6 cards, slightly narrower  
**Tablet (768-1023px):** 3 cards × 2 rows  
**Mobile (<768px):** 2 cards × 3 rows, horizontal scroll option

---

## 💬 SECTION 2: CONVERSATION LIST (Left Panel)

### 2.1 Panel Layout

**Position:** Left side of main content area  
**Width:** 40% of viewport (min 400px, max 600px)  
**Background:** #F5F5F7 (light gray)  
**Border-right:** 1px solid #E5E5E7

### 2.2 Filter & Control Bar

**Position:** Top of conversation list, sticky  
**Height:** 72px  
**Background:** White with subtle bottom border

```
┌─────────────────────────────────────────────────────────────┐
│  💬 Conversations (42)                        [Filters ▾]    │ ← Header
│  ─────────────────                                           │
│                                                              │
│  [All] [AI Only] [Manual Only]    |    [Open] [Resolved]    │ ← Toggle Pills
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Title:**
- Text: "💬 Conversations (42)" — icon + text + count
- Font: 20px semibold
- Color: #1D1D1F

**Filters Dropdown:**
- **Button:** "Filters ▾" (gray text, rounded button)
- **Click:** Opens dropdown with:
  - Date Range picker
  - Doctor filter (Dr. Smith, Dr. Lee, All)
  - Message Type (Booking, Follow-up, Insurance, General, Emergency)
  - Source (AI, Manual, All)
  - Status (Open, Resolved, Escalated, All)
- **Selected Filters:** Show as chips below (e.g., "[Dr. Smith ×] [Last 7 days ×]")

**Toggle Pills:**
- **All / AI Only / Manual Only** — mutually exclusive
- **Open / Resolved** — independent toggles
- **Active state:** Sky-blue background, white text
- **Inactive:** Gray background (#E5E5E7), dark text

### 2.3 Conversation Card Design

**Each card in scrollable list:**

```
┌───────────────────────────────────────────────────────────┐
│  👤  Sarah Johnson                        🟦 AI · Open    │ ← Header row
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  "Hi, I'd like to schedule a cleaning for next Tuesday.   │ ← Preview
│   Do you have any morning slots available?"               │
│                                                            │
│  📅 Oct 17, 2025 • 10:24 AM                   💬 3 msgs   │ ← Footer
└───────────────────────────────────────────────────────────┘
```

**Card Specs:**
- **Width:** 100% of panel (minus 16px padding)
- **Height:** ~120px (auto-expand if needed)
- **Margin:** 8px between cards
- **Border-radius:** 12px
- **Background:** White
- **Border:** 1px solid #E5E5E7
- **Padding:** 16px
- **Shadow:** 0 1px 4px rgba(0,0,0,0.06)

**Header Row:**
- **Left:** Avatar (40px circle) + Patient Name (16px semibold)
- **Right:** Source Badge + Status Badge

**Avatar:**
- Circular (40px diameter)
- Shows profile photo OR initials (2 letters, sky-blue bg)
- Border: 2px white, 1px gray shadow

**Source Badge:**
- **AI:** 🟦 (blue square) + "AI" text
- **Manual:** 🟩 (green square) + "Manual" text
- Background: Light tint matching color
- Border-radius: 6px
- Padding: 4px 8px
- Font: 11px medium

**Status Badge:**
- **Open:** Orange background, "Open" text
- **Resolved:** Green background, "Resolved" text
- **Escalated:** Red background, "Escalated" text
- Same styling as source badge

**Message Preview:**
- **Text:** Last message (truncated to 2 lines)
- **Font:** 14px regular
- **Color:** #86868B (medium gray)
- **Overflow:** Ellipsis (...)

**Footer Row:**
- **Left:** 📅 Date + Time (Oct 17, 2025 • 10:24 AM)
- **Right:** 💬 Message count (3 msgs)
- **Font:** 12px regular, #86868B

**States:**

**Default:**
```css
background: white;
border: 1px solid #E5E5E7;
```

**Hover:**
```css
transform: translateY(-2px);
box-shadow: 0 4px 12px rgba(0,0,0,0.1);
cursor: pointer;
transition: 150ms;
```

**Selected (Active):**
```css
background: rgba(135, 206, 235, 0.05);
border: 2px solid #87CEEB;
box-shadow: 0 4px 12px rgba(135, 206, 235, 0.2);
```

**Hover Quick Actions:**
- Appears on card hover as floating buttons (top-right corner)
- **Buttons:** "View" | "Archive" | "Assign" | "Open File"
- Small icon buttons (24px), sky-blue on hover
- Fade-in animation (150ms)

### 2.4 Empty State

**When no conversations match filters:**

```
       ┌─────────────────────┐
       │   💬 (Large icon)   │
       │                     │
       └─────────────────────┘
       
       No conversations found
       
       Try adjusting your filters or date range.
       
       [Clear Filters]
```

**Design:**
- Centered in panel
- Large emoji/icon (64px)
- Heading: 18px semibold
- Subtext: 14px gray
- Button: Sky-blue outline

### 2.5 Scroll Behavior

- **Infinite scroll:** Load 20 conversations at a time
- **Scroll indicator:** Subtle gradient at bottom when more content available
- **Loading state:** Shimmer skeleton cards (3 visible)
- **Scroll to top button:** Appears after scrolling >200px

---

## 📝 SECTION 3: CONVERSATION DETAIL PANEL (Right Panel)

### 3.1 Panel Layout

**Position:** Right side, 60% of viewport  
**Background:** White (#FFFFFF)  
**Min-width:** 600px

**When No Conversation Selected:**

```
       ┌─────────────────────┐
       │   📧 (Large icon)   │
       │                     │
       └─────────────────────┘
       
       Select a conversation
       
       Choose a conversation from the list
       to view details and transcript.
```

### 3.2 Panel Header (When Conversation Selected)

**Fixed at top, sticky on scroll**  
**Height:** 80px  
**Background:** White with bottom border  
**Padding:** 24px

```
┌──────────────────────────────────────────────────────────────────┐
│  👤  Sarah Johnson • 34 • Female               [Open] [🟦 AI]     │
│      Oct 17, 2025 • 10:24 AM                                     │
│                                                                  │
│  [Open Patient File] [Add Note] [Flag] [Convert to Appt] [⋮]    │
└──────────────────────────────────────────────────────────────────┘
```

**Row 1: Patient Info + Status**
- **Left:** Avatar (48px) + Name • Age • Gender
- **Right:** Status badge + Source badge
- **Font:** 18px semibold for name, 14px regular for age/gender
- **Color:** #1D1D1F for name, #86868B for metadata

**Row 2: Timestamp**
- **Text:** "Oct 17, 2025 • 10:24 AM" (last activity)
- **Font:** 12px regular
- **Color:** #86868B

**Row 3: Quick Actions**
- **Buttons:** All outlined, sky-blue on hover
- **Spacing:** 8px gap between buttons
- **Height:** 36px
- **Border-radius:** 8px

**Button Specs:**

1. **Open Patient File**
   - Icon: 📋 Folder
   - Opens patient detail drawer (same as Homepage/Calendar)
   - Primary action (slightly emphasized)

2. **Add Note**
   - Icon: ✍️ Pen
   - Opens inline text input below header
   - Auto-saves on blur

3. **Flag Conversation**
   - Icon: 🚩 Flag
   - Marks for follow-up review
   - Toggle state (filled flag when flagged)

4. **Convert to Appointment**
   - Icon: 📅 Calendar
   - Opens booking modal (pre-filled with patient)
   - Sky-blue background (primary CTA)

5. **More Actions (⋮)**
   - Dropdown: Reassign, Archive, Download Transcript, Mark as Spam

### 3.3 Chat Transcript Area

**Position:** Main scrollable area below header  
**Background:** #FBFBFB (very light gray)  
**Padding:** 24px

**Message Bubble Design:**

#### Patient Messages (Left-aligned)

```
┌────────────────────────────────────────┐
│  Sarah Johnson                         │
│  10:24 AM                              │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Hi, I'd like to schedule a      │ │ ← Patient bubble
│  │ cleaning for next Tuesday. Do   │ │
│  │ you have morning slots?         │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**Specs:**
- **Alignment:** Left (patient)
- **Background:** White
- **Border:** 1px solid #E5E5E7
- **Border-radius:** 16px (rounded corners, except bottom-left is 4px)
- **Padding:** 12px 16px
- **Max-width:** 70% of panel width
- **Font:** 15px regular, #1D1D1F
- **Timestamp:** Above bubble, 12px gray
- **Spacing:** 16px between messages

#### AI/Human Responses (Right-aligned)

```
┌────────────────────────────────────────┐
│                      CareLoop AI       │
│                      10:25 AM          │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ Absolutely! We have several     │ │ ← AI bubble (gradient)
│  │ morning slots available on      │ │
│  │ Tuesday. Would 9:00 AM or       │ │
│  │ 10:30 AM work better for you?   │ │
│  └──────────────────────────────────┘ │
└────────────────────────────────────────┘
```

**AI Message Specs:**
- **Alignment:** Right
- **Background:** Sky-blue gradient (from #87CEEB to #B0E0F6)
- **Text Color:** White
- **Border:** None
- **Border-radius:** 16px (except bottom-right is 4px)
- **Padding:** 12px 16px
- **Max-width:** 70%
- **Label:** "CareLoop AI" (above bubble, right-aligned)
- **AI Confidence Indicator:** Small badge if <80% confidence

**Manual Staff Message Specs:**
- Same as AI but:
- **Background:** Green gradient (#34C759 to lighter green)
- **Label:** "Dr. Smith" or staff name

### 3.4 Message Types

#### Text Message
Standard bubble (as described above)

#### Voice Call Log

```
┌────────────────────────────────────────────────────────┐
│  📞 Voice Call                                         │
│  ─────────────────                                     │
│                                                        │
│  Duration: 3 min 42 sec                                │
│  Time: Oct 17, 2025 • 10:24 AM                         │
│                                                        │
│  Transcript Available: Yes                             │
│  AI Confidence: 92%                                    │
│                                                        │
│  [▶ Play Recording]  [📄 View Transcript]              │
└────────────────────────────────────────────────────────┘
```

**Design:**
- **Card style:** Rounded border, light gray background
- **Icon:** 📞 Phone (sky-blue)
- **Metadata:** Duration, timestamp, confidence
- **Actions:** Play button (if audio available), Transcript button

#### Appointment Confirmation

```
┌────────────────────────────────────────────────────────┐
│  ✅ Appointment Booked                                 │
│  ─────────────────────                                 │
│                                                        │
│  Patient: Sarah Johnson                                │
│  Date: Tuesday, Oct 22, 2025                           │
│  Time: 9:00 AM - 9:30 AM                               │
│  Procedure: Cleaning                                   │
│  Doctor: Dr. Smith                                     │
│                                                        │
│  [View in Calendar]                                    │
└────────────────────────────────────────────────────────┘
```

**Design:**
- **Card style:** Green tint background
- **Icon:** ✅ Checkmark
- **Link:** Opens calendar at that appointment

#### System Message (Auto-generated)

```
───────  Conversation marked as Resolved  ───────
         Oct 17, 2025 • 2:30 PM
```

**Design:**
- **Centered text:** Gray, italic, 12px
- **Divider lines:** Subtle gray (#E5E5E7)
- **Use for:** Status changes, escalations, assignments

### 3.5 Metadata Sidebar (Collapsible Right Section)

**Position:** Right side of transcript (or as bottom tab on mobile)  
**Width:** 280px (fixed)  
**Background:** #F5F5F7  
**Border-left:** 1px solid #E5E5E7

**Sections (Accordion-style):**

#### 1. Conversation Outcome

```
┌──────────────────────────────┐
│  📊 Outcome                  │
│  ────────────                │
│                              │
│  Status: ✅ Booked           │
│  Appointment ID: #APT-1234   │
│  Converted: Yes              │
│                              │
│  [View Appointment →]        │
└──────────────────────────────┘
```

**Options:** Booked, Pending, Cancelled, Information Only

#### 2. AI Performance Metrics

```
┌──────────────────────────────┐
│  🤖 AI Metrics               │
│  ───────────                 │
│                              │
│  Confidence Score: 92%       │
│  ████████████░░░             │
│                              │
│  Sentiment: 😊 Positive      │
│                              │
│  Handling: Fully Automated   │
└──────────────────────────────┘
```

**Confidence Bar:**
- **Green:** >80% (good)
- **Orange:** 60-80% (moderate)
- **Red:** <60% (needs review)

**Sentiment Icons:**
- 😊 Positive (green)
- 😐 Neutral (gray)
- 😟 Negative (red)

#### 3. Keywords Detected

```
┌──────────────────────────────┐
│  🔍 Keywords                 │
│  ─────────                   │
│                              │
│  [cleaning] [Tuesday]        │
│  [morning] [appointment]     │
│  [insurance]                 │
└──────────────────────────────┘
```

**Design:**
- Each keyword as rounded pill
- Sky-blue background (#87CEEB/10)
- Click keyword → highlights in transcript

#### 4. Admin Notes

```
┌──────────────────────────────┐
│  📝 Notes                    │
│  ──────                      │
│                              │
│  Dr. Smith (Oct 17, 2:15 PM):│
│  "Patient mentioned tooth    │
│  sensitivity. Follow up at   │
│  appointment."               │
│                              │
│  [+ Add Note]                │
└──────────────────────────────┘
```

**Design:**
- **Notes:** Stacked cards with author + timestamp
- **Add Note:** Opens text input (auto-saves)
- **Font:** 13px regular

#### 5. Related Links

```
┌──────────────────────────────┐
│  🔗 Quick Links              │
│  ────────────                │
│                              │
│  📋 Patient File             │
│  📅 Linked Appointment       │
│  💰 Billing Record           │
│  📞 Call History             │
└──────────────────────────────┘
```

**Design:**
- **Links:** Icon + text, sky-blue on hover
- **Spacing:** 12px between items
- **Opens:** Respective panels/pages

### 3.6 Conversation Actions Footer (Bottom of Panel)

**Fixed at bottom when conversation is active**  
**Height:** 64px  
**Background:** White with top border  
**Padding:** 12px 24px

```
┌──────────────────────────────────────────────────────────┐
│  [Archive Conversation]  [Mark as Resolved]  [Escalate]  │
└──────────────────────────────────────────────────────────┘
```

**Buttons:**
- **Archive:** Gray outline, hides conversation
- **Mark as Resolved:** Green, closes conversation
- **Escalate:** Orange/red, flags for manager review

---

## 🎨 DESIGN SYSTEM SPECIFICATIONS

### Colors

**Primary Palette:**
```css
Sky Blue:        #87CEEB  (Primary accent, AI messages)
Sky Blue Dark:   #6BA8D9  (Hover states)
Sky Blue Light:  #B0E0F6  (Gradient end, backgrounds)
```

**Semantic Colors:**
```css
AI Messages:     Gradient(#87CEEB → #B0E0F6)
Manual Messages: Gradient(#34C759 → #7ED97E)
Success:         #34C759  (Resolved, Booked)
Warning:         #FF9500  (Pending, Low Confidence)
Error:           #FF3B30  (Escalated, Failed)
Info:            #5856D6  (Neutral alerts)
```

**UI Backgrounds:**
```css
Page Background:     #F5F5F7  (Light gray)
Card Background:     #FFFFFF  (Pure white)
Transcript BG:       #FBFBFB  (Off-white)
Border Color:        #E5E5E7  (Subtle gray)
Text Primary:        #1D1D1F  (Almost black)
Text Secondary:      #86868B  (Medium gray)
```

### Typography

**Font Family:**
```css
Primary: 'SF Pro Display', 'Inter', 'Helvetica Neue', sans-serif
```

**Scale:**
```css
Page Title:       32px / 700 / -1% letter-spacing
Section Header:   20px / 600 / -0.5%
Card Title:       16px / 600 / -0.3%
Body Text:        15px / 400 / 0
Small Text:       13px / 400 / 0
Caption:          12px / 400 / 0
Label:            11px / 500 / 0.5px (uppercase)
```

**Message Bubbles:**
```css
Message Text:     15px / 400 / line-height: 1.5
Timestamp:        12px / 400 / color: #86868B
Sender Name:      13px / 500
```

### Spacing

**8px Base Grid:**
```css
--space-xs:   12px
--space-sm:   16px
--space-md:   24px
--space-lg:   32px
--space-xl:   48px
```

**Component Spacing:**
- Metric cards gap: 16px
- Conversation cards gap: 8px
- Message bubbles gap: 16px
- Section padding: 24px
- Panel padding: 24px

### Shadows

```css
/* Card shadows */
Default:     0 2px 8px rgba(0,0,0,0.04)
Hover:       0 8px 24px rgba(0,0,0,0.08)
Active:      0 8px 24px rgba(135, 206, 235, 0.15)

/* Panel shadows */
Left Panel:  1px 0 0 #E5E5E7
Modal:       0 24px 64px rgba(0,0,0,0.16)
```

### Border Radius

```css
Cards:           16px
Buttons:         8px
Message Bubbles: 16px (with corner adjustments)
Pills:           9999px (fully rounded)
Input Fields:    8px
```

### Animations

**Timing Functions:**
```css
Default:     cubic-bezier(0.4, 0, 0.2, 1)
Bounce:      cubic-bezier(0.34, 1.56, 0.64, 1)
```

**Durations:**
```css
Instant:     0ms
Fast:        150ms
Normal:      200ms
Slow:        300ms
```

**Common Transitions:**
```css
Hover:       transform 150ms, box-shadow 150ms
Fade In:     opacity 200ms
Slide In:    transform 300ms + opacity 300ms
Number Counter: 800ms ease-out
```

**Message Animations:**
- New message: Fade-in from bottom (300ms)
- Scroll to latest: Smooth scroll (400ms)
- Typing indicator: Pulsing dots (1200ms loop)

---

## 🧠 AI & ANALYTICS INTEGRATION

### Data Sources

**AI Receptionist Logs:**
- Voice call transcripts (speech-to-text)
- SMS/chat message history
- Email interactions
- Web form submissions

**Manual Communications:**
- Staff-entered phone notes
- Email replies from front desk
- Walk-in conversation logs

### AI Metadata Captured

**Per Conversation:**
```json
{
  "conversation_id": "CONV-12345",
  "patient_id": "PAT-789",
  "source": "ai" | "manual",
  "channel": "voice" | "sms" | "chat" | "email",
  "start_time": "2025-10-17T10:24:00Z",
  "end_time": "2025-10-17T10:27:00Z",
  "duration_seconds": 180,
  "message_count": 5,
  "ai_confidence_score": 92,
  "sentiment": "positive" | "neutral" | "negative",
  "outcome": "booked" | "pending" | "cancelled" | "info_only",
  "appointment_id": "APT-1234" | null,
  "keywords": ["cleaning", "Tuesday", "morning", "insurance"],
  "escalated": false,
  "flagged": false,
  "notes": [
    {
      "author": "Dr. Smith",
      "text": "Follow up on sensitivity",
      "timestamp": "2025-10-17T14:15:00Z"
    }
  ]
}
```

### Performance Metrics Calculations

**Conversion Rate:**
```
Conversion Rate = (Conversations with Booked Outcome / Total Conversations) × 100
```

**Average Response Time:**
```
Avg Response = Sum(Time to First Reply) / Total Conversations
```

**AI Success Rate:**
```
AI Success = (AI Conversations Resolved / Total AI Conversations) × 100
```

**Sentiment Distribution:**
```
Positive % = (Positive Sentiment Count / Total) × 100
```

### Real-Time Updates

**WebSocket Connection:**
- Listen for new messages
- Update conversation list instantly
- Show typing indicator when AI is processing
- Badge notification on new unread messages

**Live Metrics:**
- Dashboard cards update every 30 seconds
- Pending count updates in real-time
- New conversation appears at top of list with subtle highlight

### Quality Assurance

**Low Confidence Alerts:**
- Flag conversations with AI confidence <70%
- Admin notification for manual review
- Visual indicator (orange badge) on conversation card

**Sentiment Monitoring:**
- Negative sentiment triggers alert
- Escalation suggested for frustrated patients
- Track sentiment trends over time

---

## 🩺 PATIENT FILE INTEGRATION

### Unified Patient Drawer

**Same drawer used across all pages** (Homepage, Calendar, Engagement Hub)

**Trigger:** Click "Open Patient File" in conversation detail panel

**Behavior:**
- Slides in from right (480px width)
- Overlays current view with dark backdrop (60% opacity)
- Shows patient's full profile with tabs

**Enhanced for Engagement Hub:**

**New Tab: "Communications"**
- Shows all conversations for this patient
- Timeline view (chronological)
- Filter by channel (voice, SMS, email)
- Quick links to each conversation

**Context Highlighting:**
- Current conversation highlighted in communications tab
- "Jump to Current Conversation" button if viewing different patient

**Quick Actions from Drawer:**
- Start New Conversation
- Send SMS/Email
- Schedule Callback
- Add Communication Note

---

## 🔐 COMPLIANCE & SECURITY

### HIPAA/PHIPA Requirements

**Data Protection:**
- All messages encrypted at rest (AES-256)
- SSL/TLS for transmission
- Voice recordings stored in encrypted buckets
- Automatic deletion after retention period (7 years)

**Access Control:**
- Role-based permissions (Admin, Doctor, Receptionist)
- Audit log for every conversation viewed
- Patient identifiers masked until authorized click
- Two-factor authentication required

**Audit Trail:**
```json
{
  "action": "viewed_conversation",
  "user_id": "DR-SMITH-001",
  "conversation_id": "CONV-12345",
  "timestamp": "2025-10-17T14:30:00Z",
  "ip_address": "192.168.1.100",
  "device": "MacBook Pro"
}
```

### Role-Based Access Control (RBAC)

#### Admin Role
- ✅ View all conversations (all doctors, all patients)
- ✅ Access AI performance metrics
- ✅ Download transcripts
- ✅ Reassign conversations
- ✅ Configure AI settings
- ✅ View audit logs

#### Doctor Role
- ✅ View conversations for their assigned patients only
- ✅ Add notes to conversations
- ✅ Convert conversations to appointments (their schedule)
- ✅ Flag conversations for review
- ❌ Cannot view other doctors' patient conversations
- ❌ Cannot access system-wide analytics

#### Receptionist Role
- ✅ View all conversations
- ✅ Respond to pending conversations
- ✅ Convert to appointments (any doctor)
- ✅ Add notes
- ❌ Cannot delete conversations
- ❌ Cannot view detailed AI metrics
- ❌ Limited access to patient medical records

**Visual Indicators:**
- Admin view: "All Practices" label, full access
- Doctor view: "My Patients Only" label, doctor filter locked to self
- Receptionist: "Front Desk View" label, restricted tabs

### Privacy Features

**Patient Consent:**
- Opt-in for AI recording notification
- Transcript deletion request option
- Communication preferences (voice, text, email)

**Data Masking:**
- Phone numbers: (•••) •••-0198 → revealed on click
- Email: s•••@gmail.com → revealed on authorized view
- Sensitive keywords auto-redacted (SSN, credit card)

**Anonymization:**
- De-identified data for analytics
- Patient ID hashed for reports
- No PHI in exported CSVs without permission

---

## 📱 RESPONSIVE DESIGN

### Mobile Layout (<768px)

**Single Column View:**

```
┌─────────────────────────────┐
│  [☰] CareLoop    [🔍] [👤]  │ ← Hamburger menu
├─────────────────────────────┤
│  📊 Metrics (Horizontal Scroll)
├─────────────────────────────┤
│  💬 Conversations           │
│                             │
│  [Filter Chips]             │
│                             │
│  ┌─────────────────────┐   │
│  │ 👤 Sarah Johnson   │   │ ← Tap to open
│  │ 🟦 AI • Open       │   │
│  │ "I'd like to..."   │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ 👤 Michael Chen    │   │
│  └─────────────────────┘   │
│                             │
└─────────────────────────────┘
```

**Conversation Detail (Full-Screen Overlay):**
- Slides up from bottom
- Back arrow (top-left) returns to list
- Transcript fills screen
- Metadata in bottom sheet (swipe up)
- Quick actions as floating button menu

### Tablet Layout (768-1023px)

**Adaptive Split View:**
- Conversation list: 45% width (min 360px)
- Detail panel: 55% width, slides over on small tablets
- Metrics: 3×2 grid instead of 6×1
- Metadata sidebar collapses to bottom accordion

### Desktop Layout (1024px+)

**Full Features:**
- All elements visible simultaneously
- 40/60 split with sidebar
- Hover states fully functional
- Keyboard shortcuts enabled

---

## ⌨️ KEYBOARD SHORTCUTS

**Navigation:**
```
J / ↓     Next conversation
K / ↑     Previous conversation
Enter     Open selected conversation
Esc       Close conversation detail
/         Focus search bar
```

**Actions:**
```
R         Mark as Resolved
F         Flag conversation
A         Archive conversation
N         Add Note
O         Open Patient File
C         Convert to Appointment
```

**View:**
```
1         Show All Conversations
2         Show AI Only
3         Show Manual Only
4         Show Open Only
5         Show Resolved Only
```

**Global:**
```
Cmd+K     Quick search (patients, conversations)
Cmd+,     Settings
```

---

## ♿ ACCESSIBILITY

### WCAG 2.2 AA Compliance

**Color Contrast:**
- Text on white: #1D1D1F (21:1 ratio) ✓
- Secondary text: #86868B (4.6:1) ✓
- Sky-blue buttons on white: Use white text (4.5:1) ✓

**Keyboard Navigation:**
- All actions accessible via keyboard
- Logical tab order (top to bottom, left to right)
- Focus visible: 3px sky-blue ring
- Skip links to main content

**Screen Reader Support:**
- ARIA labels on all interactive elements
- ARIA live regions for new messages
- Alt text for avatars and icons
- Role attributes (dialog, article, navigation)

**Focus Management:**
- Trapped in modals
- Returns to trigger element on close
- First focusable element auto-focused

**Text Alternatives:**
- Icons paired with text labels
- Status conveyed with text + color
- Sentiment shown with text + emoji

---

## 🎯 USER FLOWS

### Flow 1: Reviewing AI Conversation

1. **Land on Engagement Hub** → See metrics dashboard
2. **Notice "5 Pending Responses"** → Click metric card
3. **List filters to pending conversations** → See urgent items at top
4. **Click conversation card** → Detail panel opens on right
5. **Read transcript** → See AI handled booking successfully
6. **Check AI confidence: 92%** → High confidence, no issues
7. **Click "Mark as Resolved"** → Conversation closes, metrics update
8. **Return to dashboard** → Pending count decreases to 4

### Flow 2: Escalating Low-Confidence Conversation

1. **See conversation with orange "Low Confidence" badge**
2. **Click to open** → Transcript shows AI struggled with complex question
3. **Review AI confidence: 58%** (flagged automatically)
4. **Read patient's insurance question** → Requires human expertise
5. **Click "Escalate"** → Opens escalation modal
6. **Assign to Dr. Smith** + Add note: "Patient confused about coverage"
7. **Conversation status changes to "Escalated"**
8. **Dr. Smith receives notification** → Can respond directly

### Flow 3: Converting Conversation to Appointment

1. **Open conversation** → AI successfully scheduled patient verbally
2. **See appointment outcome: "Pending"** → Not yet in calendar
3. **Click "Convert to Appointment"** → Booking modal opens
4. **Pre-filled fields:**
   - Patient: Sarah Johnson (auto-populated)
   - Date/Time: Tuesday, Oct 22 @ 9:00 AM (extracted from transcript)
   - Procedure: Cleaning (detected keyword)
5. **Verify details** → Add doctor (Dr. Smith)
6. **Click "Create Booking"** → Appointment created
7. **Conversation outcome updates to "Booked"**
8. **Linked appointment ID shown** → Click to view in calendar

### Flow 4: Reviewing Patient Communication History

1. **Click "Open Patient File" from conversation detail**
2. **Patient drawer slides in** → Tabs: Overview, Medical, Visits, Billing, Communications
3. **Click "Communications" tab** → Timeline of all interactions
4. **See 12 conversations over past year:**
   - 8 AI-handled
   - 4 Manual
   - All outcomes visible
5. **Click any past conversation** → Jumps to that transcript
6. **Add note: "Patient prefers morning appointments"**
7. **Close drawer** → Note saved to patient record

---

## 📊 ANALYTICS & INSIGHTS (Mini Section)

**Embedded Analytics Panel** (optional, collapsible at top)

**When expanded:**

```
┌────────────────────────────────────────────────────────────┐
│  📈 Communication Insights                      [Hide ▴]   │
│  ───────────────────────────                                │
│                                                            │
│  [Chart: Conversations Volume]  [Chart: Conversion Rate]  │
│  (Last 30 days, line chart)     (Last 30 days, bar chart) │
│                                                            │
│  [Top Topics]                    [Response Time Trend]     │
│  1. Booking requests (45%)       (Improving ↓ 15%)         │
│  2. Insurance questions (22%)                              │
│  3. Rescheduling (18%)                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Charts:**
- **Conversation Volume:** Line chart showing daily conversations (AI vs Manual stacked)
- **Conversion Rate:** Bar chart showing booking success rate
- **Top Topics:** Pie chart or list of most common inquiry types
- **Response Time:** Line graph showing average response time trend

**Filters:**
- Date range picker
- Doctor filter
- Source filter (AI/Manual)

---

## ✅ ACCEPTANCE CRITERIA

### Functional Requirements

**Must Have:**
- [x] Display all conversations (AI + Manual) in unified list
- [x] Color-coded source badges (🟦 AI, 🟩 Manual)
- [x] Clickable metric cards filter conversation list
- [x] Real-time updates for new messages
- [x] Patient detail drawer accessible from conversations
- [x] Add notes functionality with auto-save
- [x] Flag conversations for follow-up
- [x] Convert conversation to appointment (opens booking modal)
- [x] Full message transcript with timestamps
- [x] AI confidence scores and sentiment analysis
- [x] Role-based access control (Admin, Doctor, Receptionist)
- [x] Search conversations by patient name or message content
- [x] Filter by date, source, status, doctor, message type
- [x] Mobile-responsive design (single column on mobile)
- [x] Keyboard shortcuts for power users
- [x] WCAG 2.2 AA accessibility compliance

**Should Have:**
- [ ] Voice call playback integration
- [ ] SMS/Email sending from interface
- [ ] Bulk actions (archive multiple, mark resolved)
- [ ] Export conversation transcripts (PDF/CSV)
- [ ] Advanced analytics dashboard (embedded charts)
- [ ] Conversation templates for common responses
- [ ] Auto-responses for common questions

**Nice to Have:**
- [ ] Sentiment trend analysis (patient mood over time)
- [ ] AI training feedback ("Was this response helpful?")
- [ ] Multi-language transcript translation
- [ ] Video call integration
- [ ] Patient communication preferences management
- [ ] Automated follow-up reminders

### Design Requirements

**Visual:**
- [x] Apple.com-inspired minimalist aesthetic
- [x] Sky-blue primary color (#87CEEB)
- [x] Clean typography (SF Pro Display/Inter)
- [x] Ample white space (breathable layout)
- [x] Soft shadows and rounded corners
- [x] Smooth animations (150-300ms)
- [x] Gradient message bubbles (AI vs Manual)

**Interaction:**
- [x] Hover effects on cards (lift + shadow)
- [x] Smooth scroll with infinite loading
- [x] Click-to-filter metrics
- [x] Slide-in conversation detail panel
- [x] Collapsible metadata sidebar
- [x] Floating quick action buttons
- [x] Typing indicators for live conversations

**Responsive:**
- [x] Desktop: 40/60 split, all features visible
- [x] Tablet: Adaptive layout, slide-over detail
- [x] Mobile: Single column, full-screen detail overlay
- [x] Touch-friendly buttons (min 44px)

### Performance Requirements

- Page load: <2 seconds
- Conversation list: Load 20 at a time (infinite scroll)
- Real-time updates: <500ms latency
- Search results: <1 second
- Animations: 60fps smooth

### Security Requirements

- All data encrypted (AES-256)
- HIPAA/PHIPA compliant
- Role-based access enforced
- Audit log for all views/edits
- Auto-logout after 30 min inactivity
- Two-factor authentication

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Core Functionality (Week 1-2)
- [ ] Build conversation list component
- [ ] Build detail panel with transcript view
- [ ] Implement filters and search
- [ ] Create metric dashboard cards
- [ ] Set up real-time WebSocket connection

### Phase 2: AI Integration (Week 3)
- [ ] Connect to AI receptionist logs
- [ ] Display confidence scores
- [ ] Implement sentiment analysis
- [ ] Show keywords and metadata
- [ ] Add voice call transcript display

### Phase 3: Actions & Workflows (Week 4)
- [ ] Add notes functionality
- [ ] Flag/escalate conversations
- [ ] Convert to appointment (integrate with calendar)
- [ ] Patient file drawer integration
- [ ] Archive and resolve actions

### Phase 4: Polish & Optimization (Week 5)
- [ ] Responsive design (mobile/tablet)
- [ ] Keyboard shortcuts
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] Analytics integration

### Phase 5: Advanced Features (Week 6+)
- [ ] Voice playback
- [ ] Send messages from platform
- [ ] Bulk actions
- [ ] Export functionality
- [ ] Advanced analytics charts

---

## 📖 RELATED DOCUMENTATION

**See Also:**
- `COMPLETE_PLATFORM_DESIGN.md` - Overall platform design system
- `CALENDAR_IMPLEMENTATION_PROGRESS.md` - Calendar page structure
- `PATIENTS_DASHBOARD.md` - Patient card and detail panel design
- `ANALYTICS_UPDATE.md` - Metrics dashboard patterns

**Cross-Page Consistency:**
- Use same patient detail drawer across all pages
- Consistent top navigation bar
- Shared color palette and typography
- Unified booking modal component
- Standardized metric card design

---

**Patient Engagement Hub — Complete Design Specification**  
*Version 1.0 • October 17, 2025*  
*CareLoop AI-Powered Dental Practice Management System*

💙 Built with ❤️ for modern dental practices seeking premium communication tools.
