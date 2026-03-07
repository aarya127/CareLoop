/**
 * Appointment and Booking Types
 * TypeScript interfaces for calendar/scheduling system
 */

import type { Patient } from './patient';

/**
 * Booking source - how the appointment was created
 */
export type BookingSource = 'ai' | 'manual';

/**
 * Appointment status
 */
export type AppointmentStatus = 
  | 'scheduled'    // Upcoming appointment
  | 'completed'    // Past appointment that happened
  | 'canceled'     // Canceled appointment
  | 'rescheduled'  // Was rescheduled (historical record)
  | 'no-show';     // Patient didn't show up

/**
 * Procedure types
 */
export type ProcedureType =
  | 'Cleaning'
  | 'Filling'
  | 'Root Canal'
  | 'Crown'
  | 'Extraction'
  | 'Consultation'
  | 'X-Ray'
  | 'Whitening'
  | 'Orthodontics'
  | 'Emergency'
  | 'Other';

/**
 * Doctor/Dentist information
 */
export interface Doctor {
  id: string;
  name: string;
  specialization?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
}

/**
 * Core appointment data
 */
export interface Appointment {
  id: string;
  
  // Patient reference
  patientId: string;
  patient?: Patient; // Populated for display
  
  // Doctor assignment
  doctorId: string;
  doctor?: Doctor; // Populated for display
  
  // Scheduling
  startTime: Date;
  endTime: Date;
  
  // Appointment details
  procedureType: ProcedureType;
  status: AppointmentStatus;
  
  // Booking metadata
  bookingSource: BookingSource;
  aiConfidenceScore?: number; // 0-100 for AI bookings
  aiTranscript?: string; // Optional conversation transcript
  
  // Notes and details
  notes?: string;
  patientNotes?: string; // Patient-provided notes
  
  // Insurance
  insuranceProvider?: string;
  estimatedCost?: number;
  patientCost?: number; // After insurance
  
  // Audit trail
  createdBy: string; // User ID who created the booking
  createdAt: Date;
  updatedAt: Date;
  
  // Rescheduling
  rescheduledFrom?: string; // Original appointment ID
  rescheduledTo?: string; // New appointment ID
  rescheduledReason?: string;
  
  // Reminders
  reminderSent?: boolean;
  reminderSentAt?: Date;
  
  // Confirmation
  confirmed?: boolean;
  confirmedAt?: Date;
}

/**
 * Appointment with full patient and doctor data
 */
export interface PopulatedAppointment extends Appointment {
  patient: Patient;
  doctor: Doctor;
}

/**
 * Calendar view type
 */
export type CalendarView = 'day' | 'week' | 'month';

/**
 * Calendar filter options
 */
export interface CalendarFilters {
  doctorId?: string | 'all';
  bookingSource?: BookingSource | 'all';
  status?: AppointmentStatus | 'all';
  procedureType?: ProcedureType | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Time slot for availability checking
 */
export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  doctorId: string;
}

/**
 * Conflict detection result
 */
export interface AppointmentConflict {
  hasConflict: boolean;
  conflictingAppointments?: Appointment[];
  message?: string;
}

/**
 * Booking form data
 */
export interface BookingFormData {
  patientId: string;
  doctorId: string;
  startTime: Date;
  endTime: Date;
  procedureType: ProcedureType;
  bookingSource: BookingSource;
  notes?: string;
  patientNotes?: string;
  insuranceProvider?: string;
  aiConfidenceScore?: number;
}

/**
 * Calendar analytics data
 */
export interface CalendarAnalytics {
  totalBookings: number;
  aiBookings: number;
  manualBookings: number;
  rescheduled: number;
  upcomingSevenDays: number;
  mostFrequentProcedure: {
    type: ProcedureType;
    count: number;
  };
  aiBookingPercentage: number;
  manualBookingPercentage: number;
  averageDailyBookings: number;
  peakBookingDay?: string;
}

/**
 * Day view time slot
 */
export interface DayViewSlot {
  time: string; // e.g., "8:00 AM"
  hour: number; // 8, 9, 10, etc.
  appointments: Appointment[];
}

/**
 * Week view day column
 */
export interface WeekViewDay {
  date: Date;
  dayName: string; // Mon, Tue, Wed, etc.
  dayNumber: number; // 1, 2, 3, etc.
  isToday: boolean;
  isWeekend: boolean;
  appointments: Appointment[];
}

/**
 * Month view calendar cell
 */
export interface MonthViewCell {
  date: Date;
  dayNumber: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  appointments: Appointment[];
  appointmentCount: number;
  aiCount: number;
  manualCount: number;
  rescheduledCount: number;
}

/**
 * Drag and drop data
 */
export interface DragData {
  appointmentId: string;
  originalStart: Date;
  originalEnd: Date;
  doctorId: string;
}

/**
 * Drop target data
 */
export interface DropTarget {
  newStart: Date;
  newEnd: Date;
  doctorId: string;
  isValid: boolean;
  conflictingAppointments?: Appointment[];
}
