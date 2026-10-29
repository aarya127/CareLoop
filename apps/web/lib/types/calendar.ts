/**
 * Custom Calendar System Types
 * Built from scratch for CareLoop - No external calendar libraries
 */

import type { SectionState } from '../patient-record/load-state';

export type CalendarView = 'day' | 'week' | 'month' | 'agenda';

export type BookingSource = 'AI' | 'Manual' | 'Rescheduled';

export interface TimeSlot {
  hour: number;
  minute: number;
  date: Date;
  isAvailable: boolean;
  appointments: CalendarAppointment[];
}

export interface CalendarAppointment {
  id: string;
  patientId: string;
  patientName: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  procedure: string;
  doctorId: string;
  doctorName: string;
  source: BookingSource;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  color?: string;
}

export interface DayViewSlot {
  time: Date;
  hour: number;
  minute: number;
  appointments: CalendarAppointment[];
  isCurrentHour: boolean;
  isPast: boolean;
}

export interface WeekViewDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
  isWeekend: boolean;
  appointments: CalendarAppointment[];
}

export interface MonthViewDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  appointmentCount: number;
  appointments: CalendarAppointment[];
  hasMultipleAppointments: boolean;
}

export interface CalendarState {
  currentDate: Date;
  selectedDate: Date | null;
  viewMode: CalendarView;
  selectedAppointment: CalendarAppointment | null;
  isDrawerOpen: boolean;
  isBookingModalOpen: boolean;
  focusedAppointmentId: string | null;
}

export interface NavigationState {
  canGoPrevious: boolean;
  canGoNext: boolean;
  displayText: string;
}

/** Real patient details for the appointment drawer — only what the Patient API returns. */
export interface DrawerPatient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD, '' when not recorded
  phone: string;
  gender: string;
  insurance?: { payerName: string; planName: string; memberIdMasked: string };
}

export interface PatientDrawerData {
  appointment: CalendarAppointment;
  /** `null` data = the appointment isn't linked to a patient record. */
  patient: SectionState<DrawerPatient | null>;
}

export interface AnimationConfig {
  cellHover: {
    duration: number;
    ease: number[];
  };
  cardExpand: {
    type: 'spring' | 'tween';
    stiffness?: number;
    damping?: number;
  };
  drawerSlide: {
    type: 'spring';
    stiffness: number;
    damping: number;
  };
  viewTransition: {
    duration: number;
    ease: number[];
  };
}

export interface RippleEffect {
  id: string;
  x: number;
  y: number;
  timestamp: number;
}

export interface CalendarSettings {
  workingHours: {
    start: number; // 0-23
    end: number; // 0-23
  };
  slotDuration: number; // minutes (15, 30, 60)
  showWeekends: boolean;
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  timeFormat: '12h' | '24h';
  enableAnimations: boolean;
  respectReducedMotion: boolean;
}

export interface BookingFormData {
  patientId: string;
  date: Date;
  startTime: string;
  duration: number;
  doctorId: string;
  procedure: string;
  notes?: string;
  sendConfirmation: boolean;
}

export interface ConflictDetection {
  hasConflict: boolean;
  conflictingAppointments: CalendarAppointment[];
  suggestedAlternatives?: Date[];
}
