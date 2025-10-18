/**
 * Calendar Utility Functions
 * Helper functions for calendar operations and analytics
 */

import type {
  Appointment,
  CalendarAnalytics,
  AppointmentConflict,
  ProcedureType,
} from '../types/appointment';
import { startOfDay, endOfDay, isAfter, isBefore, addDays } from 'date-fns';

/**
 * Calculate calendar analytics from appointments
 */
export function calculateCalendarAnalytics(
  appointments: Appointment[]
): CalendarAnalytics {
  const now = new Date();
  const sevenDaysLater = addDays(now, 7);

  // Filter active appointments only
  const activeAppointments = appointments.filter(
    (apt) => apt.status === 'scheduled'
  );

  // Total bookings
  const totalBookings = activeAppointments.length;

  // AI vs Manual split
  const aiBookings = activeAppointments.filter(
    (apt) => apt.bookingSource === 'ai'
  ).length;
  const manualBookings = activeAppointments.filter(
    (apt) => apt.bookingSource === 'manual'
  ).length;

  // Rescheduled count
  const rescheduled = activeAppointments.filter(
    (apt) => apt.rescheduledFrom
  ).length;

  // Upcoming 7 days
  const upcomingSevenDays = activeAppointments.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return isAfter(aptDate, now) && isBefore(aptDate, sevenDaysLater);
  }).length;

  // Most frequent procedure
  const procedureCounts: Record<ProcedureType, number> = {
    Cleaning: 0,
    Filling: 0,
    'Root Canal': 0,
    Crown: 0,
    Extraction: 0,
    Consultation: 0,
    'X-Ray': 0,
    Whitening: 0,
    Orthodontics: 0,
    Emergency: 0,
    Other: 0,
  };

  activeAppointments.forEach((apt) => {
    procedureCounts[apt.procedureType]++;
  });

  const mostFrequentEntry = Object.entries(procedureCounts).reduce(
    (max, [type, count]) =>
      count > max.count ? { type: type as ProcedureType, count } : max,
    { type: 'Cleaning' as ProcedureType, count: 0 }
  );

  // Percentages
  const aiBookingPercentage =
    totalBookings > 0 ? (aiBookings / totalBookings) * 100 : 0;
  const manualBookingPercentage =
    totalBookings > 0 ? (manualBookings / totalBookings) * 100 : 0;

  // Average daily bookings (over next 30 days)
  const thirtyDaysLater = addDays(now, 30);
  const next30DaysBookings = activeAppointments.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return isAfter(aptDate, now) && isBefore(aptDate, thirtyDaysLater);
  }).length;
  const averageDailyBookings = next30DaysBookings / 30;

  // Peak booking day (day of week with most appointments)
  const dayOfWeekCounts: Record<string, number> = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };

  activeAppointments.forEach((apt) => {
    const dayName = new Date(apt.startTime).toLocaleDateString('en-US', {
      weekday: 'long',
    });
    dayOfWeekCounts[dayName]++;
  });

  const peakBookingDay = Object.entries(dayOfWeekCounts).reduce(
    (max, [day, count]) => (count > max.count ? { day, count } : max),
    { day: 'Monday', count: 0 }
  ).day;

  return {
    totalBookings,
    aiBookings,
    manualBookings,
    rescheduled,
    upcomingSevenDays,
    mostFrequentProcedure: mostFrequentEntry,
    aiBookingPercentage,
    manualBookingPercentage,
    averageDailyBookings,
    peakBookingDay,
  };
}

/**
 * Check for appointment conflicts
 */
export function checkAppointmentConflict(
  newAppointment: {
    startTime: Date;
    endTime: Date;
    doctorId: string;
  },
  existingAppointments: Appointment[],
  excludeAppointmentId?: string
): AppointmentConflict {
  const conflicts = existingAppointments.filter((apt) => {
    // Skip if it's the same appointment (when editing)
    if (excludeAppointmentId && apt.id === excludeAppointmentId) {
      return false;
    }

    // Skip canceled appointments
    if (apt.status === 'canceled') {
      return false;
    }

    // Only check same doctor
    if (apt.doctorId !== newAppointment.doctorId) {
      return false;
    }

    // Check time overlap
    const aptStart = new Date(apt.startTime);
    const aptEnd = new Date(apt.endTime);
    const newStart = newAppointment.startTime;
    const newEnd = newAppointment.endTime;

    // Overlap conditions:
    // 1. New starts during existing
    // 2. New ends during existing
    // 3. New completely encompasses existing
    const startsInside = newStart >= aptStart && newStart < aptEnd;
    const endsInside = newEnd > aptStart && newEnd <= aptEnd;
    const encompassesExisting = newStart <= aptStart && newEnd >= aptEnd;

    return startsInside || endsInside || encompassesExisting;
  });

  if (conflicts.length > 0) {
    return {
      hasConflict: true,
      conflictingAppointments: conflicts,
      message: `Time slot conflicts with ${conflicts.length} existing appointment(s)`,
    };
  }

  return {
    hasConflict: false,
  };
}

/**
 * Get available time slots for a doctor on a specific day
 */
export function getAvailableTimeSlots(
  doctorId: string,
  date: Date,
  appointments: Appointment[],
  workStartHour: number = 8, // 8 AM
  workEndHour: number = 18, // 6 PM
  slotDuration: number = 30 // 30 minutes
): Date[] {
  const availableSlots: Date[] = [];
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  // Get doctor's appointments for this day
  const doctorAppointments = appointments.filter(
    (apt) =>
      apt.doctorId === doctorId &&
      apt.status !== 'canceled' &&
      new Date(apt.startTime) >= dayStart &&
      new Date(apt.startTime) <= dayEnd
  );

  // Generate all possible slots
  for (let hour = workStartHour; hour < workEndHour; hour++) {
    for (let minute = 0; minute < 60; minute += slotDuration) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, minute, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

      // Check if this slot conflicts with any appointment
      const conflict = checkAppointmentConflict(
        {
          startTime: slotStart,
          endTime: slotEnd,
          doctorId,
        },
        doctorAppointments
      );

      if (!conflict.hasConflict) {
        availableSlots.push(slotStart);
      }
    }
  }

  return availableSlots;
}

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date): string {
  return `${formatDate(date)} at ${formatTime(date)}`;
}

/**
 * Get duration in minutes between two times
 */
export function getDurationMinutes(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}

/**
 * Get appointment duration as formatted string
 */
export function getAppointmentDuration(appointment: Appointment): string {
  const duration = getDurationMinutes(
    new Date(appointment.startTime),
    new Date(appointment.endTime)
  );
  return formatDuration(duration);
}

/**
 * Get appointment time range as formatted string
 */
export function getAppointmentTimeRange(appointment: Appointment): string {
  const start = formatTime(new Date(appointment.startTime));
  const end = formatTime(new Date(appointment.endTime));
  return `${start} - ${end}`;
}

/**
 * Check if appointment is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if appointment is in the past
 */
export function isPast(date: Date): boolean {
  return isBefore(date, new Date());
}

/**
 * Get color for booking source
 */
export function getBookingSourceColor(source: 'ai' | 'manual'): {
  border: string;
  background: string;
  text: string;
} {
  if (source === 'ai') {
    return {
      border: '#87CEEB', // Sky blue
      background: 'rgba(135, 206, 235, 0.05)',
      text: '#6BA8D9',
    };
  }
  return {
    border: '#34C759', // Green
    background: 'rgba(52, 199, 89, 0.05)',
    text: '#34C759',
  };
}

/**
 * Get color for appointment status
 */
export function getStatusColor(
  status: 'scheduled' | 'completed' | 'canceled' | 'rescheduled' | 'no-show'
): string {
  switch (status) {
    case 'scheduled':
      return '#87CEEB'; // Sky blue
    case 'completed':
      return '#34C759'; // Green
    case 'canceled':
      return '#86868B'; // Gray
    case 'rescheduled':
      return '#FF9500'; // Orange
    case 'no-show':
      return '#FF3B30'; // Red
    default:
      return '#86868B';
  }
}

/**
 * Sort appointments by start time
 */
export function sortAppointmentsByTime(
  appointments: Appointment[]
): Appointment[] {
  return [...appointments].sort(
    (a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
}

/**
 * Group appointments by date
 */
export function groupAppointmentsByDate(
  appointments: Appointment[]
): Record<string, Appointment[]> {
  const grouped: Record<string, Appointment[]> = {};

  appointments.forEach((apt) => {
    const dateKey = formatDate(new Date(apt.startTime));
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(apt);
  });

  // Sort appointments within each day
  Object.keys(grouped).forEach((key) => {
    grouped[key] = sortAppointmentsByTime(grouped[key]);
  });

  return grouped;
}

/**
 * Calculate estimated procedure duration based on type
 */
export function getEstimatedDuration(procedureType: ProcedureType): number {
  const durations: Record<ProcedureType, number> = {
    Cleaning: 30,
    Filling: 60,
    'Root Canal': 90,
    Crown: 60,
    Extraction: 45,
    Consultation: 30,
    'X-Ray': 15,
    Whitening: 60,
    Orthodontics: 90,
    Emergency: 60,
    Other: 30,
  };

  return durations[procedureType] || 30;
}
