/**
 * Calendar Utility Functions
 * Date manipulation, time calculations, and calendar helpers
 */

import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  isWeekend,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  differenceInMinutes,
  isBefore,
  isAfter,
  isSameMonth,
} from 'date-fns';
import type {
  CalendarAppointment,
  DayViewSlot,
  WeekViewDay,
  MonthViewDay,
  TimeSlot,
  ConflictDetection,
} from '@/lib/types/calendar';

/**
 * Generate time slots for day view (hourly)
 */
export function generateDayViewSlots(
  date: Date,
  appointments: CalendarAppointment[],
  workingHours: { start: number; end: number } = { start: 6, end: 20 }
): DayViewSlot[] {
  const slots: DayViewSlot[] = [];
  const currentTime = new Date();
  const startHour = workingHours.start;
  const endHour = workingHours.end;

  for (let hour = startHour; hour <= endHour; hour++) {
    const slotTime = setMinutes(setHours(startOfDay(date), hour), 0);
    const slotAppointments = appointments.filter((apt) => {
      const aptHour = apt.startTime.getHours();
      return aptHour === hour && isSameDay(apt.startTime, date);
    });

    slots.push({
      time: slotTime,
      hour,
      minute: 0,
      appointments: slotAppointments,
      isCurrentHour:
        isToday(date) && hour === currentTime.getHours(),
      isPast: isBefore(slotTime, currentTime),
    });
  }

  return slots;
}

/**
 * Generate week view days (7 days)
 */
export function generateWeekViewDays(
  date: Date,
  appointments: CalendarAppointment[],
  firstDayOfWeek: 0 | 1 = 1 // 1 = Monday
): WeekViewDay[] {
  const weekStart = startOfWeek(date, { weekStartsOn: firstDayOfWeek });
  const weekEnd = endOfWeek(date, { weekStartsOn: firstDayOfWeek });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return days.map((day) => ({
    date: day,
    dayName: format(day, 'EEE'),
    dayNumber: parseInt(format(day, 'd')),
    isToday: isToday(day),
    isWeekend: isWeekend(day),
    appointments: appointments.filter((apt) => isSameDay(apt.startTime, day)),
  }));
}

/**
 * Generate month view days (including padding from prev/next month)
 */
export function generateMonthViewDays(
  date: Date,
  appointments: CalendarAppointment[],
  firstDayOfWeek: 0 | 1 = 1
): MonthViewDay[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: firstDayOfWeek });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: firstDayOfWeek });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return days.map((day) => {
    const dayAppointments = appointments.filter((apt) =>
      isSameDay(apt.startTime, day)
    );

    return {
      date: day,
      dayNumber: parseInt(format(day, 'd')),
      isCurrentMonth: isSameMonth(day, date),
      isToday: isToday(day),
      isWeekend: isWeekend(day),
      appointmentCount: dayAppointments.length,
      appointments: dayAppointments,
      hasMultipleAppointments: dayAppointments.length > 1,
    };
  });
}

/**
 * Calculate current time position (for red line indicator)
 */
export function calculateCurrentTimePosition(
  workingHours: { start: number; end: number } = { start: 6, end: 20 }
): number {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  const startHour = workingHours.start;
  const endHour = workingHours.end;
  
  if (currentHour < startHour || currentHour > endHour) {
    return -1; // Not in working hours
  }
  
  const totalMinutes = (currentHour - startHour) * 60 + currentMinute;
  const slotHeight = 100; // pixels per hour
  
  return (totalMinutes / 60) * slotHeight;
}

/**
 * Format time slot display
 */
export function formatTimeSlot(date: Date, format12h: boolean = true): string {
  if (format12h) {
    return format(date, 'h:mm a');
  }
  return format(date, 'HH:mm');
}

/**
 * Calculate appointment duration
 */
export function calculateDuration(start: Date, end: Date): number {
  return differenceInMinutes(end, start);
}

/**
 * Calculate appointment height (for calendar rendering)
 */
export function calculateAppointmentHeight(
  start: Date,
  end: Date,
  pixelsPerMinute: number = 2
): number {
  const duration = calculateDuration(start, end);
  return duration * pixelsPerMinute;
}

/**
 * Calculate appointment top position
 */
export function calculateAppointmentTop(
  appointmentStart: Date,
  dayStart: Date,
  pixelsPerMinute: number = 2
): number {
  const minutesFromStart = differenceInMinutes(appointmentStart, dayStart);
  return minutesFromStart * pixelsPerMinute;
}

/**
 * Check for appointment conflicts
 */
export function detectConflicts(
  newAppointment: { startTime: Date; endTime: Date; doctorId: string },
  existingAppointments: CalendarAppointment[]
): ConflictDetection {
  const conflicts = existingAppointments.filter((apt) => {
    // Same doctor
    if (apt.doctorId !== newAppointment.doctorId) return false;
    
    // Time overlap
    const newStart = newAppointment.startTime;
    const newEnd = newAppointment.endTime;
    const aptStart = apt.startTime;
    const aptEnd = apt.endTime;
    
    return (
      (newStart >= aptStart && newStart < aptEnd) || // Starts during existing
      (newEnd > aptStart && newEnd <= aptEnd) ||     // Ends during existing
      (newStart <= aptStart && newEnd >= aptEnd)     // Completely overlaps
    );
  });

  return {
    hasConflict: conflicts.length > 0,
    conflictingAppointments: conflicts,
    suggestedAlternatives: conflicts.length > 0 
      ? generateAlternativeTimes(newAppointment.startTime, newAppointment.endTime, existingAppointments)
      : undefined,
  };
}

/**
 * Generate alternative time suggestions
 */
function generateAlternativeTimes(
  preferredStart: Date,
  preferredEnd: Date,
  existingAppointments: CalendarAppointment[]
): Date[] {
  const alternatives: Date[] = [];
  const duration = calculateDuration(preferredStart, preferredEnd);
  
  // Try same day, different times
  for (let offset = 30; offset <= 180; offset += 30) {
    const altStart = addMinutes(preferredStart, offset);
    const altEnd = addMinutes(altStart, duration);
    
    const conflict = detectConflicts(
      { startTime: altStart, endTime: altEnd, doctorId: '' },
      existingAppointments
    );
    
    if (!conflict.hasConflict) {
      alternatives.push(altStart);
    }
    
    if (alternatives.length >= 3) break;
  }
  
  return alternatives;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

/**
 * Get booking source color
 */
export function getBookingSourceColor(source: 'AI' | 'Manual' | 'Rescheduled'): string {
  const colors = {
    AI: '#3B82F6',        // Blue
    Manual: '#10B981',     // Green
    Rescheduled: '#F59E0B', // Orange
  };
  return colors[source];
}

/**
 * Get booking source styles (for gradients)
 */
export function getBookingSourceGradient(source: 'AI' | 'Manual' | 'Rescheduled'): string {
  const gradients = {
    AI: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
    Manual: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    Rescheduled: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
  };
  return gradients[source];
}

/**
 * Navigate calendar (for controls)
 */
export function navigateCalendar(
  currentDate: Date,
  direction: 'prev' | 'next',
  viewMode: 'day' | 'week' | 'month'
): Date {
  const multiplier = direction === 'next' ? 1 : -1;
  
  switch (viewMode) {
    case 'day':
      return direction === 'next' 
        ? addDays(currentDate, 1) 
        : subDays(currentDate, 1);
    case 'week':
      return direction === 'next'
        ? addWeeks(currentDate, 1)
        : subWeeks(currentDate, 1);
    case 'month':
      return direction === 'next'
        ? addMonths(currentDate, 1)
        : subMonths(currentDate, 1);
    default:
      return currentDate;
  }
}

/**
 * Get navigation display text
 */
export function getNavigationDisplayText(date: Date, viewMode: 'day' | 'week' | 'month'): string {
  switch (viewMode) {
    case 'day':
      return format(date, 'EEEE, MMMM d, yyyy');
    case 'week':
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    case 'month':
      return format(date, 'MMMM yyyy');
    default:
      return '';
  }
}

/**
 * Filter appointments by date range
 */
export function filterAppointmentsByRange(
  appointments: CalendarAppointment[],
  startDate: Date,
  endDate: Date
): CalendarAppointment[] {
  return appointments.filter((apt) => {
    return apt.startTime >= startDate && apt.startTime <= endDate;
  });
}

/**
 * Sort appointments by start time
 */
export function sortAppointmentsByTime(
  appointments: CalendarAppointment[]
): CalendarAppointment[] {
  return [...appointments].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );
}

/**
 * Group appointments by day
 */
export function groupAppointmentsByDay(
  appointments: CalendarAppointment[]
): Map<string, CalendarAppointment[]> {
  const grouped = new Map<string, CalendarAppointment[]>();
  
  appointments.forEach((apt) => {
    const dateKey = format(apt.startTime, 'yyyy-MM-dd');
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, apt]);
  });
  
  return grouped;
}

/**
 * Check if time slot is available
 */
export function isTimeSlotAvailable(
  date: Date,
  startHour: number,
  endHour: number,
  appointments: CalendarAppointment[],
  doctorId?: string
): boolean {
  const slotStart = setMinutes(setHours(startOfDay(date), startHour), 0);
  const slotEnd = setMinutes(setHours(startOfDay(date), endHour), 0);
  
  return !appointments.some((apt) => {
    if (doctorId && apt.doctorId !== doctorId) return false;
    
    return (
      (slotStart >= apt.startTime && slotStart < apt.endTime) ||
      (slotEnd > apt.startTime && slotEnd <= apt.endTime) ||
      (slotStart <= apt.startTime && slotEnd >= apt.endTime)
    );
  });
}
