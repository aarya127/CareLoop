/**
 * Custom Calendar System Types
 * Built from scratch for CareLoop - No external calendar libraries
 */

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
  insuranceCovered: boolean;
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

export interface PatientDrawerData {
  appointment: CalendarAppointment;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
    age: number;
    address: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  insurance: {
    provider: string;
    planName: string;
    memberId: string;
    coveragePercent: number;
    policyExpiry: Date;
  };
  xrays: XrayImage[];
  periodontalData: PeriodontalData;
  dentalChart: ToothStatus[];
  visitHistory: Visit[];
  notes: DoctorNote[];
}

export interface XrayImage {
  id: string;
  type: 'Bitewing' | 'Periapical' | 'Panoramic' | 'Cephalometric';
  date: Date;
  thumbnailUrl: string;
  fullUrl: string;
  tooth?: number;
  notes?: string;
}

export interface PeriodontalData {
  lastExam: Date;
  averagePocketDepth: number; // in mm
  gingivalIndex: number; // 0-3 scale
  bleedingPoints: number;
  pocketDepths: {
    tooth: number;
    mesial: number;
    mid: number;
    distal: number;
  }[];
  recessionsPresent: boolean;
  mobilityPresent: boolean;
}

export interface ToothStatus {
  number: number; // 1-32 Universal numbering
  status: 'healthy' | 'restoration' | 'decay' | 'missing' | 'implant' | 'crown';
  surface?: string; // 'MOD', 'DO', etc.
  notes?: string;
  lastTreated?: Date;
}

export interface Visit {
  id: string;
  date: Date;
  reason: string;
  provider: string;
  procedures: {
    code: string;
    name: string;
    cost: number;
  }[];
  totalCost: number;
  insurancePaid: number;
  patientPaid: number;
  notes?: string;
  status: 'completed' | 'scheduled' | 'cancelled';
}

export interface DoctorNote {
  id: string;
  appointmentId: string;
  author: string;
  role: 'Dentist' | 'Hygienist' | 'Assistant';
  timestamp: Date;
  content: string;
  isEdited: boolean;
  editedAt?: Date;
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
    end: number;   // 0-23
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
