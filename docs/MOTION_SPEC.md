# Motion Specification

This document defines the motion design system for CareLoop, ensuring consistent, purposeful, and accessible animations throughout the application.

## Core Principles

1. **Purposeful**: Every animation serves a function (feedback, guidance, or delight)
2. **Fast**: Keep animations short (150-250ms) to maintain responsiveness
3. **Natural**: Use spring physics and easing for organic motion
4. **Accessible**: Respect `prefers-reduced-motion` setting

## Timing & Easing

### Durations

\`\`\`typescript
const DURATION = {
  instant: 100,      // Immediate feedback (hover states)
  fast: 150,         // Quick transitions (tooltips, dropdowns)
  base: 200,         // Standard transitions (modals, drawers)
  slow: 250,         // Emphasis transitions (page changes)
  verySlow: 300,     // Special effects only
};
\`\`\`

### Easing Functions

\`\`\`typescript
const EASING = {
  // Standard ease-out for exits and scaling
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  
  // Standard ease-in for entrances
  easeIn: 'cubic-bezier(0.87, 0, 0.13, 1)',
  
  // Spring for hover interactions
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  
  // Linear for continuous animations (loaders)
  linear: 'linear',
};
\`\`\`

## Animation Patterns

### 1. Page Transitions

**Entrance** (new page loads):
\`\`\`typescript
{
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: EASING.easeOut }
}
\`\`\`

**Exit** (page unloads):
\`\`\`typescript
{
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.15 }
}
\`\`\`

### 2. Card Hover

Cards lift 2-4px with enhanced shadow:
\`\`\`typescript
{
  whileHover: { y: -2, transition: { duration: 0.15 } },
  className: 'hover:shadow-md'
}
\`\`\`

### 3. Button Press

Subtle scale-down on active:
\`\`\`typescript
{
  whileTap: { scale: 0.98 },
  transition: { duration: 0.1 }
}
\`\`\`

Or in CSS:
\`\`\`css
.button {
  transition: transform 0.1s ease;
}

.button:active {
  transform: scale(0.98);
}
\`\`\`

### 4. List Item Entrance

Staggered fade + slide-up:
\`\`\`typescript
{
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: index * 0.05, duration: 0.2 }
}
\`\`\`

### 5. Modal/Dialog

**Backdrop**:
\`\`\`typescript
{
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 }
}
\`\`\`

**Content**:
\`\`\`typescript
{
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: EASING.easeOut }
}
\`\`\`

### 6. Drawer/Sheet (Side Panel)

\`\`\`typescript
{
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { duration: 0.25, ease: EASING.easeOut }
}
\`\`\`

### 7. Toast Notifications

\`\`\`typescript
{
  initial: { opacity: 0, y: -20, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.2 }
}
\`\`\`

### 8. Skeleton Loaders

Shimmer effect:
\`\`\`css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    hsl(var(--muted)) 0%,
    hsl(var(--muted) / 0.5) 50%,
    hsl(var(--muted)) 100%
  );
  background-size: 2000px 100%;
  animation: shimmer 2s linear infinite;
}
\`\`\`

### 9. Number Count-Up

For KPI values:
\`\`\`typescript
// Using Framer Motion
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.1 }}
>
  {value}
</motion.div>
\`\`\`

### 10. Live Status Indicators

Pulsing dot:
\`\`\`css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.live-indicator {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
\`\`\`

## Entrance Sequences

For complex layouts with multiple elements:

\`\`\`typescript
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.div variants={container} initial="hidden" animate="show">
  <motion.div variants={item}>Card 1</motion.div>
  <motion.div variants={item}>Card 2</motion.div>
  <motion.div variants={item}>Card 3</motion.div>
</motion.div>
\`\`\`

## Calendar-Specific Motion

### Drag Operations

\`\`\`typescript
{
  drag: true,
  dragConstraints: { top: 0, bottom: 0 },
  dragElastic: 0.1,
  dragTransition: { bounceStiffness: 600, bounceDamping: 20 }
}
\`\`\`

### Drop Feedback

Visual confirmation on successful drop:
\`\`\`typescript
{
  animate: { scale: [1, 1.05, 1] },
  transition: { duration: 0.2 }
}
\`\`\`

### New Appointment Pulse

When AI creates appointment:
\`\`\`css
@keyframes pulse-outline {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

.new-appointment {
  animation: pulse-outline 1s ease-out 3;
}
\`\`\`

## Accessibility

### Reduced Motion

All animations must respect the user's motion preference:

\`\`\`css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
\`\`\`

In Framer Motion:
\`\`\`typescript
import { useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();

const variants = shouldReduceMotion
  ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
  : { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
\`\`\`

## Performance Guidelines

1. **Use transform and opacity**: These properties are GPU-accelerated
2. **Avoid layout animations**: Don't animate `width`, `height`, `margin`, etc.
3. **Use `will-change` sparingly**: Only for elements that will definitely animate
4. **Limit simultaneous animations**: Max 3-5 elements animating at once
5. **Target 60 FPS**: Keep frame budget under 16ms

\`\`\`css
/* Good */
.card {
  transition: transform 0.2s, opacity 0.2s;
}

/* Avoid */
.card {
  transition: all 0.2s; /* Too broad */
}
\`\`\`

## Implementation Checklist

- [ ] All page transitions use consistent timing
- [ ] Hover states provide immediate feedback (<100ms)
- [ ] Cards lift on hover with shadow enhancement
- [ ] Buttons show press state with scale
- [ ] Modals have backdrop + content animation
- [ ] Lists stagger entrance for visual hierarchy
- [ ] Skeletons use shimmer effect
- [ ] New items pulse/highlight briefly
- [ ] Reduced motion preference is respected
- [ ] No janky animations (maintain 60 FPS)
