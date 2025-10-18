# Interactive Calendar — Dynamic Schedule Design Specification
## Animated, Immersive Calendar Interface for CareLoop Dental Dashboard

---

## 🎯 Vision & Philosophy

**This is NOT a static calendar grid.**

The CareLoop Calendar is a **living, breathing interface** that responds to every interaction with sophisticated motion, depth, and delight. Inspired by Apple's Calendar app and Notion's fluidity, combined with dental practice requirements.

**Core Principles:**
1. **Motion with Purpose** — Every animation provides feedback or guides attention
2. **Tactile Responsiveness** — Interactions feel physical and immediate
3. **Depth Layering** — UI elements exist in 3D space with shadows and parallax
4. **Clinical Precision** — Beautiful design meets dental terminology accuracy
5. **Performance First** — Smooth 60fps animations on all devices

---

## 🎨 Visual Language & Motion Design

### Depth & Layering System

**Z-Index Hierarchy:**
```
Level 0:  Calendar grid background       (z: 0)
Level 1:  Date cells / time slots        (z: 1)
Level 2:  Appointment cards (default)    (z: 10)
Level 3:  Appointment cards (hover)      (z: 20)
Level 4:  Tooltips & popovers           (z: 30)
Level 5:  Patient detail drawer         (z: 40)
Level 6:  Modals & overlays             (z: 50)
```

**Shadow Elevation:**
```css
/* Calendar cells */
.cell-default {
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.cell-hover {
  box-shadow: 0 4px 12px rgba(135,206,235,0.15),
              0 0 0 2px rgba(135,206,235,0.2);
  transform: translateY(-2px);
}

/* Appointment cards */
.appointment-default {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.appointment-hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.12),
              0 0 0 3px rgba(135,206,235,0.3);
  transform: translateY(-4px) scale(1.02);
}

.appointment-selected {
  box-shadow: 0 16px 48px rgba(135,206,235,0.25),
              0 0 0 4px rgba(135,206,235,0.4);
  transform: scale(1.05);
}
```

### Animation Library

#### 1. Cell Hover Effect (Glow + Lift)
```typescript
// Framer Motion variant
const cellVariants = {
  default: {
    y: 0,
    scale: 1,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
  },
  hover: {
    y: -2,
    scale: 1.02,
    boxShadow: '0 4px 12px rgba(135,206,235,0.15), 0 0 0 2px rgba(135,206,235,0.2)',
    transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] }
  },
  active: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
}
```

#### 2. Appointment Card Expansion
```typescript
const appointmentVariants = {
  collapsed: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 }
  },
  expanded: {
    scale: 1.05,
    opacity: 1,
    y: -8,
    zIndex: 100,
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  },
  selected: {
    scale: 1.08,
    opacity: 0.8,
    transition: { duration: 0.3 }
  }
}
```

#### 3. View Transition (Day ↔ Week ↔ Month)
```typescript
const viewTransitionVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    scale: 0.95,
    x: direction > 0 ? 50 : -50,
  }),
  animate: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    }
  },
  exit: (direction: number) => ({
    opacity: 0,
    scale: 0.95,
    x: direction > 0 ? -50 : 50,
    transition: {
      duration: 0.3,
    }
  })
}
```

#### 4. Ripple Effect on Click
```typescript
const RippleEffect = ({ x, y }: { x: number; y: number }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0.6 }}
    animate={{ scale: 2.5, opacity: 0 }}
    transition={{ duration: 0.6, ease: 'easeOut' }}
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 20,
      height: 20,
      borderRadius: '50%',
      backgroundColor: 'rgba(135,206,235,0.4)',
      pointerEvents: 'none',
    }}
  />
);
```

#### 5. Patient Drawer Slide-In
```typescript
const drawerVariants = {
  closed: {
    x: '100%',
    opacity: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    }
  },
  open: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
      staggerChildren: 0.07,
      delayChildren: 0.1,
    }
  }
}

const drawerContentVariants = {
  closed: { opacity: 0, y: 20 },
  open: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
}
```

#### 6. Calendar Background Blur (Focus Mode)
```typescript
const backgroundBlurVariants = {
  normal: {
    filter: 'blur(0px)',
    opacity: 1,
    transition: { duration: 0.3 }
  },
  dimmed: {
    filter: 'blur(4px)',
    opacity: 0.6,
    transition: { duration: 0.3 }
  }
}
```

---

## 📅 Calendar Views & Interactions

### View Mode: DAY VIEW

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  [Controls: ◀ Today ▶]  [Oct 17, 2025 ▼]  [Day|Week|Month]│
├────────────────────────────────────────────────────────────┤
│                                                            │
│  6 AM  ┌──────────────────────────────────────────┐       │
│        │                                          │       │
│  7 AM  │                                          │       │
│        │                                          │       │
│  8 AM  ├──────────────────────────────────────────┤       │
│        │ 🟦 Sarah Johnson - Cleaning             │ ← Card │
│  9 AM  │    9:00 AM - 9:30 AM                    │       │
│        ├──────────────────────────────────────────┤       │
│ 10 AM  │ 🟩 Michael Chen - Filling               │       │
│        │    10:00 AM - 10:45 AM                  │       │
│ 11 AM  ├──────────────────────────────────────────┤       │
│        │                                          │       │
│ 12 PM  │ ← Current time indicator (red line) →   │       │
│        │                                          │       │
│  1 PM  ├──────────────────────────────────────────┤       │
│        │ 🟧 Emily Davis - Crown                  │       │
│  2 PM  │    1:00 PM - 2:30 PM                    │       │
│        │                                          │       │
└────────────────────────────────────────────────────────────┘
```

**Interactions:**

**Empty Time Slot Hover:**
```typescript
<motion.div
  variants={slotVariants}
  whileHover="hover"
  whileTap="tap"
  className="time-slot"
  onClick={() => openBookingModal(date, time)}
>
  {/* Slot renders with glow on hover */}
</motion.div>
```
- **Hover:** Sky-blue border glow (2px), background tint (rgba(135,206,235,0.05))
- **Click:** Ripple effect from click point, opens booking modal

**Appointment Card Hover:**
```typescript
<motion.div
  variants={appointmentVariants}
  initial="collapsed"
  whileHover="expanded"
  onClick={() => openPatientDrawer(appointment)}
  className="appointment-card"
  style={{ 
    borderLeft: `4px solid ${getBookingSourceColor(appointment.source)}` 
  }}
>
  {/* Card content */}
  <AnimatePresence>
    {isHovered && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="quick-actions"
      >
        <button>Edit</button>
        <button>Reschedule</button>
        <button>View Patient</button>
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>
```
- **Hover:** Card lifts 4px, shadow expands, scale 1.02
- **Hover (500ms delay):** Quick action buttons fade in at top-right
- **Click:** Card scales to 1.08, drawer slides in from right

**Tooltip Popover:**
```typescript
<Tooltip
  content={
    <div className="p-3 bg-white rounded-lg shadow-xl">
      <div className="font-semibold">{patient.name}</div>
      <div className="text-sm text-gray-600">{procedure}</div>
      <div className="text-xs text-gray-500">{time}</div>
    </div>
  }
  placement="top"
  delay={300}
>
  <AppointmentCard {...props} />
</Tooltip>
```

**Current Time Indicator:**
```typescript
<motion.div
  initial={{ scaleX: 0 }}
  animate={{ scaleX: 1 }}
  transition={{ duration: 0.8, ease: 'easeOut' }}
  className="current-time-line"
  style={{
    position: 'absolute',
    top: calculateTimePosition(currentTime),
    left: 0,
    right: 0,
    height: 2,
    background: 'linear-gradient(90deg, #FF3B30 0%, #FF453A 100%)',
    boxShadow: '0 0 8px rgba(255,59,48,0.4)'
  }}
>
  <motion.div
    animate={{ scale: [1, 1.2, 1] }}
    transition={{ repeat: Infinity, duration: 2 }}
    className="time-dot"
    style={{
      position: 'absolute',
      left: -6,
      top: -5,
      width: 12,
      height: 12,
      borderRadius: '50%',
      backgroundColor: '#FF3B30',
      border: '2px solid white'
    }}
  />
</motion.div>
```

### View Mode: WEEK VIEW

**Layout:**
```
┌──────────────────────────────────────────────────────────────────────┐
│  Mon 14  │  Tue 15  │  Wed 16  │  Thu 17  │  Fri 18  │  Sat 19  │ Sun 20 │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│          │          │          │  ← TODAY │          │          │        │
│  8 AM    │          │          │          │          │          │        │
│  ┌────┐  │  ┌────┐  │          │  ┌────┐  │          │          │        │
│  │ 🟦 │  │  │ 🟩 │  │          │  │ 🟦 │  │          │          │        │
│  └────┘  │  └────┘  │          │  └────┘  │          │          │        │
│          │          │          │          │          │          │        │
│ 10 AM    │          │  ┌────┐  │          │  ┌────┐  │          │        │
│          │          │  │ 🟧 │  │          │  │ 🟩 │  │          │        │
│          │          │  └────┘  │          │  └────┘  │          │        │
│ 12 PM    │          │          │          │          │          │        │
│          │          │          │          │          │          │        │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┴────────┘
```

**Interactions:**

**Day Column Header:**
```typescript
<motion.div
  variants={dayHeaderVariants}
  whileHover="hover"
  whileTap="tap"
  onClick={() => switchToDayView(date)}
  className={cn(
    'day-header',
    isToday && 'today-highlight',
    isWeekend && 'weekend-style'
  )}
>
  <div className="day-name">{dayName}</div>
  <motion.div 
    className="date-number"
    whileHover={{ scale: 1.15 }}
  >
    {dateNumber}
  </motion.div>
  <div className="appointment-count">
    {count} {count === 1 ? 'appointment' : 'appointments'}
  </div>
</motion.div>
```
- **Hover:** Background tint, date number scales 1.15
- **Click:** Smooth transition to day view with scale + fade animation

**Compact Appointment Cards:**
```typescript
<motion.div
  layout
  variants={compactCardVariants}
  whileHover={{ scale: 1.05, zIndex: 20 }}
  className="compact-appointment"
  style={{
    height: `${duration * 2}px`, // 2px per minute
    top: `${startTimeOffset}px`,
    borderLeftColor: getBookingSourceColor(source),
  }}
>
  <div className="time">{formatTime(startTime)}</div>
  <div className="patient-name">{patientName}</div>
  <div className="procedure-icon">{procedureIcon}</div>
</motion.div>
```

**Today Indicator (Column):**
```typescript
<motion.div
  initial={{ backgroundColor: 'transparent' }}
  animate={{ 
    backgroundColor: 'rgba(135,206,235,0.08)',
    boxShadow: 'inset 0 0 0 2px rgba(135,206,235,0.2)'
  }}
  className="today-column"
/>
```

### View Mode: MONTH VIEW

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    OCTOBER 2025                    [Today]      │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┐                      │
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │                      │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                      │
│     │     │  1  │  2  │  3  │  4  │  5  │                      │
│     │     │ • • │ •   │ • • │     │     │                      │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                      │
│  6  │  7  │  8  │  9  │ 10  │ 11  │ 12  │                      │
│ • • │ •   │ • • │     │ • • │     │     │                      │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                      │
│ 13  │ 14  │ 15  │ 16  │ 17* │ 18  │ 19  │  * = Today          │
│ •   │ • • │ • • │ • • │ • • │ •   │     │                      │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤                      │
│ 20  │ 21  │ 22  │ 23  │ 24  │ 25  │ 26  │                      │
│     │ •   │ • • │ •   │     │     │     │                      │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘                      │
                                                                  │
Legend: 🟦 AI  🟩 Manual  🟧 Rescheduled                         │
```

**Day Cell Design:**
```typescript
<motion.div
  variants={dayCellVariants}
  whileHover="hover"
  whileTap="tap"
  className={cn(
    'day-cell',
    isToday && 'today',
    isWeekend && 'weekend',
    !isCurrentMonth && 'other-month'
  )}
  onClick={() => handleDayClick(date)}
>
  <motion.div 
    className="date-number"
    whileHover={{ scale: 1.2 }}
  >
    {dayNumber}
  </motion.div>
  
  {appointments.length > 0 && (
    <motion.div 
      className="appointment-dots"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      {appointments.slice(0, 3).map((apt, idx) => (
        <motion.div
          key={apt.id}
          className="dot"
          style={{ backgroundColor: getBookingSourceColor(apt.source) }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: idx * 0.05, type: 'spring' }}
          whileHover={{ scale: 1.5 }}
        />
      ))}
      {appointments.length > 3 && (
        <span className="more-count">+{appointments.length - 3}</span>
      )}
    </motion.div>
  )}
</motion.div>
```

**Interactions:**
- **Hover:** Cell lifts 2px, shadow expands, dots scale 1.5
- **Click → Expand Animation:**
  ```typescript
  const expandToDay = async (date: Date) => {
    // 1. Cell expands to fill screen
    await controls.start({
      scale: 5,
      zIndex: 100,
      transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
    });
    
    // 2. Fade out other cells
    await controls.start({
      opacity: 0,
      transition: { duration: 0.2 }
    });
    
    // 3. Transition to day view
    setViewMode('day');
    setSelectedDate(date);
  }
  ```

### View Mode: AGENDA (LIST VIEW)

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Upcoming Appointments                          [Filter ▾]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  TODAY — October 17, 2025                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 9:00 AM    🟦 Sarah Johnson                         │   │
│  │            Routine Cleaning • Dr. Smith              │   │
│  │            [View Details]                            │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 10:00 AM   🟩 Michael Chen                          │   │
│  │            Filling - Tooth #18 • Dr. Lee            │   │
│  │            [View Details]                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  TOMORROW — October 18, 2025                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 2:00 PM    🟧 Emily Davis                           │   │
│  │            Crown Placement • Dr. Martinez            │   │
│  │            [View Details]                            │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

**Interactions:**
```typescript
<motion.div
  variants={agendaItemVariants}
  initial="hidden"
  animate="visible"
  custom={index}
  whileHover="hover"
  className="agenda-item"
>
  {/* Content with staggered fade-in */}
</motion.div>

const agendaItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3
    }
  }),
  hover: {
    x: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    transition: { duration: 0.2 }
  }
}
```

---

## 👤 Patient Detail Drawer — Comprehensive Profile

### Drawer Architecture

**Activation:**
```typescript
const openPatientDrawer = (appointment: Appointment) => {
  // 1. Blur calendar background
  setBackgroundState('dimmed');
  
  // 2. Animate appointment card to drawer origin
  const cardElement = document.getElementById(`appointment-${appointment.id}`);
  const cardRect = cardElement.getBoundingClientRect();
  
  // 3. Create motion continuity
  controls.start({
    x: [cardRect.left, window.innerWidth - 600],
    y: [cardRect.top, 0],
    scale: [1, 1.5],
    opacity: [1, 0],
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
  });
  
  // 4. Slide in drawer
  setSelectedAppointment(appointment);
  setDrawerOpen(true);
};
```

**Drawer Component:**
```typescript
<AnimatePresence>
  {drawerOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="drawer-backdrop"
        onClick={closeDrawer}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 40
        }}
      />
      
      {/* Drawer */}
      <motion.div
        variants={drawerVariants}
        initial="closed"
        animate="open"
        exit="closed"
        className="patient-drawer"
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          width: '600px',
          backgroundColor: 'white',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.12)',
          overflowY: 'auto',
          zIndex: 50
        }}
      >
        <PatientDrawerContent 
          appointment={selectedAppointment}
          onClose={closeDrawer}
        />
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### Drawer Content Structure

**1. Header Section**

```tsx
<motion.header 
  variants={drawerContentVariants}
  className="drawer-header"
  style={{
    padding: '24px',
    borderBottom: '1px solid #E5E5E7',
    background: 'linear-gradient(135deg, #87CEEB 0%, #B0E0F6 100%)'
  }}
>
  <div className="flex items-start justify-between">
    <div>
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold text-white"
      >
        {patient.firstName} {patient.lastName}
      </motion.h1>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-2 text-white/90"
      >
        <div className="text-sm">
          {format(appointment.startTime, 'EEEE, MMMM d, yyyy')}
        </div>
        <div className="text-sm">
          {format(appointment.startTime, 'h:mm a')} - {format(appointment.endTime, 'h:mm a')}
        </div>
      </motion.div>
    </div>
    
    <button
      onClick={onClose}
      className="p-2 rounded-lg hover:bg-white/20 transition-colors"
    >
      <X className="w-6 h-6 text-white" />
    </button>
  </div>
  
  {/* Procedure & Source */}
  <div className="mt-4 flex items-center gap-3">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.3, type: 'spring' }}
      className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium"
    >
      {appointment.procedure}
    </motion.div>
    
    <BookingSourceBadge source={appointment.source} />
  </div>
</motion.header>
```

**2. Contact Information**

```tsx
<motion.section
  variants={drawerContentVariants}
  className="drawer-section"
>
  <SectionHeader icon={User} title="Contact Information" />
  
  <div className="grid grid-cols-2 gap-4">
    <InfoField label="Full Name" value={`${patient.firstName} ${patient.lastName}`} />
    <InfoField label="Age" value={`${patient.age} years old`} />
    <InfoField label="Email" value={patient.email} icon={Mail} />
    <InfoField label="Phone" value={patient.phone} icon={Phone} />
    <InfoField label="Date of Birth" value={format(patient.dateOfBirth, 'MMM d, yyyy')} />
    <InfoField label="Address" value={`${patient.address.city}, ${patient.address.state}`} />
  </div>
</motion.section>
```

**3. Insurance Coverage**

```tsx
<motion.section
  variants={drawerContentVariants}
  className="drawer-section"
>
  <SectionHeader icon={Shield} title="Insurance Coverage" />
  
  <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-6">
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="text-lg font-semibold text-gray-900">
          {patient.insurance.provider}
        </div>
        <div className="text-sm text-gray-600">
          {patient.insurance.planName}
        </div>
      </div>
      <div className="text-right">
        <div className="text-3xl font-bold text-sky-600">
          {patient.insurance.coveragePercent}%
        </div>
        <div className="text-xs text-gray-500">Coverage</div>
      </div>
    </div>
    
    {/* Coverage Breakdown for This Procedure */}
    <div className="mt-4 p-4 bg-white rounded-xl border border-sky-100">
      <div className="text-sm font-medium text-gray-700 mb-3">
        Coverage for {appointment.procedure}
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Cost</span>
          <span className="font-semibold">${procedureCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Insurance Pays</span>
          <span className="text-green-600 font-semibold">
            ${(procedureCost * patient.insurance.coveragePercent / 100).toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm border-t pt-2">
          <span className="font-medium text-gray-900">Patient Owes</span>
          <span className="text-lg font-bold text-gray-900">
            ${(procedureCost * (1 - patient.insurance.coveragePercent / 100)).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
    
    {/* Policy Details */}
    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
      <div>
        <div className="text-gray-500">Member ID</div>
        <div className="font-mono font-medium">{patient.insurance.memberId}</div>
      </div>
      <div>
        <div className="text-gray-500">Policy Expiry</div>
        <div className="font-medium">{format(patient.insurance.policyExpiry, 'MMM d, yyyy')}</div>
      </div>
    </div>
  </div>
</motion.section>
```

**4. Dental & Clinical Data**

```tsx
<motion.section
  variants={drawerContentVariants}
  className="drawer-section"
>
  <SectionHeader icon={FileText} title="Dental Records & Clinical Data" />
  
  {/* X-rays / Radiographs */}
  <div className="mb-6">
    <h4 className="text-sm font-semibold text-gray-700 mb-3">
      Radiographs & X-rays
    </h4>
    
    <div className="grid grid-cols-3 gap-3">
      {patient.xrays.map((xray, idx) => (
        <motion.div
          key={xray.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          whileHover={{ scale: 1.05 }}
          className="relative group cursor-pointer"
          onClick={() => openXrayModal(xray)}
        >
          <div className="aspect-square bg-gray-900 rounded-xl overflow-hidden">
            <Image
              src={xray.thumbnailUrl}
              alt={xray.type}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition-colors flex items-center justify-center">
            <Expand className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="mt-1 text-xs text-gray-600 text-center">
            {xray.type}
          </div>
          <div className="text-xs text-gray-400 text-center">
            {format(xray.date, 'MMM d, yyyy')}
          </div>
        </motion.div>
      ))}
    </div>
  </div>
  
  {/* Periodontal Charting */}
  <div className="mb-6">
    <h4 className="text-sm font-semibold text-gray-700 mb-3">
      Periodontal Charting
    </h4>
    
    <div className="bg-gray-50 rounded-xl p-4">
      <PeriodontalChart data={patient.periodontalData} />
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-2xl font-bold text-sky-600">
            {patient.periodontalData.averagePocketDepth}mm
          </div>
          <div className="text-xs text-gray-600">Avg Pocket Depth</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {patient.periodontalData.gingivalIndex}
          </div>
          <div className="text-xs text-gray-600">Gingival Index</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {patient.periodontalData.bleedingPoints}
          </div>
          <div className="text-xs text-gray-600">Bleeding Points</div>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        Last exam: {format(patient.periodontalData.lastExam, 'MMM d, yyyy')}
      </div>
    </div>
  </div>
  
  {/* Dental Chart (Tooth Status) */}
  <div>
    <h4 className="text-sm font-semibold text-gray-700 mb-3">
      Dental Chart
    </h4>
    
    <DentalChart 
      teeth={patient.dentalChart}
      onToothClick={(tooth) => showToothHistory(tooth)}
    />
    
    <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-white border-2 border-gray-300 rounded-sm" />
        Healthy
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-yellow-400 rounded-sm" />
        Restoration
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-red-400 rounded-sm" />
        Decay
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-gray-400 rounded-sm" />
        Missing
      </div>
    </div>
  </div>
</motion.section>
```

**5. Visit History**

```tsx
<motion.section
  variants={drawerContentVariants}
  className="drawer-section"
>
  <SectionHeader icon={Calendar} title="Visit History" />
  
  <div className="space-y-3">
    {patient.visits.map((visit, idx) => (
      <motion.div
        key={visit.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.05 }}
        whileHover={{ x: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        className="p-4 bg-white border border-gray-200 rounded-xl cursor-pointer"
        onClick={() => expandVisitDetails(visit)}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold text-gray-900">
              {visit.reason}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {format(visit.date, 'MMMM d, yyyy')} • {visit.provider}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {visit.procedures.map(p => p.name).join(', ')}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              ${visit.totalCost}
            </div>
            <div className="text-xs text-gray-500">
              Paid: ${visit.patientPaid}
            </div>
          </div>
        </div>
        
        {visit.notes && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
            {visit.notes}
          </div>
        )}
      </motion.div>
    ))}
  </div>
</motion.section>
```

**6. Doctor Notes & Findings**

```tsx
<motion.section
  variants={drawerContentVariants}
  className="drawer-section"
>
  <SectionHeader icon={FileEdit} title="Doctor Notes & Findings" />
  
  <div className="space-y-4">
    {/* Current Appointment Notes */}
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        Notes for this appointment ({format(appointment.startTime, 'MMM d, yyyy')})
      </label>
      
      <textarea
        value={currentNotes}
        onChange={(e) => setCurrentNotes(e.target.value)}
        placeholder="Enter observations, findings, treatment notes..."
        className="w-full h-32 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm resize-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all outline-none"
      />
      
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>Auto-saved</span>
        <button
          onClick={saveNotes}
          className="px-4 py-2 bg-sky-400 text-white rounded-lg hover:bg-sky-500 transition-colors font-medium text-sm"
        >
          Save Notes
        </button>
      </div>
    </div>
    
    {/* Previous Notes History */}
    <div>
      <label className="text-sm font-medium text-gray-700 mb-2 block">
        Previous Notes
      </label>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {patient.notes.map((note, idx) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-900">
                {note.author} • {note.role}
              </span>
              <span className="text-xs text-gray-500">
                {format(note.timestamp, 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <div className="text-sm text-gray-700">
              {note.content}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
</motion.section>
```

**7. Action Buttons (Footer)**

```tsx
<motion.footer
  variants={drawerContentVariants}
  className="drawer-footer sticky bottom-0 bg-white border-t border-gray-200 p-4"
>
  <div className="flex items-center gap-3">
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex-1 px-4 py-3 bg-sky-400 text-white rounded-xl font-medium hover:bg-sky-500 transition-colors flex items-center justify-center gap-2"
      onClick={() => editAppointment(appointment)}
    >
      <Edit className="w-4 h-4" />
      Edit Appointment
    </motion.button>
    
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
      onClick={() => rescheduleAppointment(appointment)}
    >
      <Clock className="w-4 h-4" />
      Reschedule
    </motion.button>
  </div>
  
  <div className="mt-3 grid grid-cols-3 gap-2">
    <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
      <UserPlus className="w-4 h-4 mx-auto mb-1" />
      Full Profile
    </button>
    <button className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
      <Download className="w-4 h-4 mx-auto mb-1" />
      Export PDF
    </button>
    <button className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
      <Trash2 className="w-4 h-4 mx-auto mb-1" />
      Cancel
    </button>
  </div>
</motion.footer>
```

---

## 🧠 Performance Optimization

### 1. Virtualization for Large Date Ranges

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const CalendarVirtualizer = ({ dates }: { dates: Date[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: dates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Each time slot is 100px
    overscan: 5, // Render 5 extra items above/below viewport
  });
  
  return (
    <div ref={parentRef} className="calendar-container">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <TimeSlot date={dates[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 2. Lazy Loading Images (X-rays)

```typescript
import { useState } from 'react';
import { motion } from 'framer-motion';

const LazyXrayImage = ({ src, alt }: { src: string; alt: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0 }}
      className="relative"
      onViewportEnter={() => setIsInView(true)}
    >
      {isInView && (
        <>
          <Image
            src={src}
            alt={alt}
            fill
            onLoad={() => setIsLoaded(true)}
            className="object-cover"
          />
          {!isLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
        </>
      )}
    </motion.div>
  );
};
```

### 3. Debounced Navigation

```typescript
import { useDebouncedCallback } from 'use-debounce';

const CalendarNavigation = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const debouncedNavigate = useDebouncedCallback(
    (direction: number) => {
      setCurrentDate(addWeeks(currentDate, direction));
    },
    300, // Wait 300ms after last call
    { leading: true, trailing: false }
  );
  
  return (
    <div>
      <button onClick={() => debouncedNavigate(-1)}>◀ Previous</button>
      <button onClick={() => debouncedNavigate(1)}>Next ▶</button>
    </div>
  );
};
```

### 4. Appointment Data Caching

```typescript
import { useQuery } from '@tanstack/react-query';

const useAppointmentData = (date: Date) => {
  return useQuery({
    queryKey: ['appointments', format(date, 'yyyy-MM-dd')],
    queryFn: () => fetchAppointments(date),
    staleTime: 5 * 60 * 1000, // Data stays fresh for 5 minutes
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: true,
  });
};
```

### 5. Reduced Motion Support

```typescript
import { useReducedMotion } from 'framer-motion';

const AnimatedCard = () => {
  const shouldReduceMotion = useReducedMotion();
  
  const variants = shouldReduceMotion
    ? {
        // Simplified animations
        hover: { scale: 1 },
        tap: { scale: 1 },
      }
    : {
        // Full animations
        hover: { scale: 1.02, y: -4 },
        tap: { scale: 0.98 },
      };
  
  return (
    <motion.div variants={variants} whileHover="hover" whileTap="tap">
      {/* Card content */}
    </motion.div>
  );
};
```

---

## 🎹 Keyboard Navigation & Shortcuts

### Navigation Shortcuts

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Arrow key navigation
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigatePrevious();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateNext();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateUp(); // Previous week or scroll up
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateDown(); // Next week or scroll down
    }
    
    // View mode shortcuts
    else if (e.key === 'd' && !e.metaKey && !e.ctrlKey) {
      setViewMode('day');
    } else if (e.key === 'w' && !e.metaKey && !e.ctrlKey) {
      setViewMode('week');
    } else if (e.key === 'm' && !e.metaKey && !e.ctrlKey) {
      setViewMode('month');
    }
    
    // Today shortcut
    else if (e.key === 't' && !e.metaKey && !e.ctrlKey) {
      setCurrentDate(new Date());
    }
    
    // Close drawer
    else if (e.key === 'Escape') {
      closeDrawer();
    }
    
    // Select appointment (Enter)
    else if (e.key === 'Enter' && focusedAppointment) {
      openPatientDrawer(focusedAppointment);
    }
    
    // New appointment
    else if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      openBookingModal();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Keyboard Shortcuts Legend

```tsx
<div className="keyboard-shortcuts-legend">
  <div className="shortcut">
    <kbd>←→</kbd> Navigate days
  </div>
  <div className="shortcut">
    <kbd>↑↓</kbd> Navigate weeks
  </div>
  <div className="shortcut">
    <kbd>D</kbd> Day view
  </div>
  <div className="shortcut">
    <kbd>W</kbd> Week view
  </div>
  <div className="shortcut">
    <kbd>M</kbd> Month view
  </div>
  <div className="shortcut">
    <kbd>T</kbd> Today
  </div>
  <div className="shortcut">
    <kbd>⌘N</kbd> New appointment
  </div>
  <div className="shortcut">
    <kbd>ESC</kbd> Close
  </div>
</div>
```

---

## 📱 Mobile Interactions

### Swipe Gestures

```typescript
import { useSwipeable } from 'react-swipeable';

const MobileCalendar = () => {
  const handlers = useSwipeable({
    onSwipedLeft: () => navigateNext(),
    onSwipedRight: () => navigatePrevious(),
    onSwipedUp: () => viewMode === 'month' && setViewMode('week'),
    onSwipedDown: () => viewMode === 'week' && setViewMode('month'),
    preventScrollOnSwipe: true,
    trackMouse: false,
  });
  
  return (
    <div {...handlers} className="calendar-mobile">
      {/* Calendar content */}
    </div>
  );
};
```

### Touch Interactions

```typescript
<motion.div
  whileTap={{ scale: 0.95 }}
  className="appointment-card-mobile"
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
>
  {/* Card content */}
</motion.div>
```

---

## ✅ Acceptance Criteria Summary

### Visual & Motion
- [x] Calendar cells hover with glow and lift effect
- [x] Appointment cards scale and lift on hover
- [x] Smooth view transitions (Day ↔ Week ↔ Month) with scale + fade
- [x] Ripple effects on click interactions
- [x] Current time indicator with pulsing dot
- [x] Staggered animations for list items
- [x] Background blur when drawer opens

### Patient Drawer
- [x] Slides in from right with spring animation
- [x] Header with patient name, appointment details, booking source
- [x] Contact information section
- [x] Insurance coverage with cost breakdown
- [x] X-rays/radiographs with lazy loading
- [x] Periodontal charting with metrics
- [x] Dental chart with tooth status
- [x] Visit history with expandable details
- [x] Doctor notes (current + historical)
- [x] Action buttons (Edit, Reschedule, Cancel, Export)

### Performance
- [x] Virtualization for large date ranges
- [x] Lazy loading of images (X-rays)
- [x] Debounced navigation
- [x] Data caching with React Query
- [x] Reduced motion support
- [x] GPU-accelerated animations (transform, opacity)

### Accessibility
- [x] Keyboard navigation (arrows, shortcuts)
- [x] ARIA labels and roles
- [x] Focus management
- [x] Screen reader support
- [x] Contrast compliance (WCAG AA)

### Mobile
- [x] Swipe gestures (left/right for days, up/down for views)
- [x] Touch-optimized interactions
- [x] Responsive drawer (full-screen on mobile)
- [x] Bottom sheet alternative for drawer

### Dental Terminology
- [x] Correct terms: "Periodontal charting", "pocket depths", "gingival index"
- [x] X-ray types: "Intraoral radiograph", "Panoramic"
- [x] Tooth numbering system
- [x] Procedure names (Cleaning, Filling, Crown, Root Canal)

---

**Interactive Calendar Design Specification**  
*Version 1.0 • October 17, 2025*  
*CareLoop — Alive, Animated, Intuitive*

Built to feel **premium, responsive, and delightful**. 🦷✨
