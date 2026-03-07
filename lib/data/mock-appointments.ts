/**
 * Mock Appointment Data
 * Sample appointments for testing calendar views
 */

import type { Appointment, Doctor } from '../types/appointment';
import { mockPatients } from './mock-patients';

/**
 * Mock doctors
 */
export const mockDoctors: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Smith',
    specialization: 'General Dentistry',
    email: 'sarah.smith@careloop.com',
    phone: '(555) 123-4567',
  },
  {
    id: 'doc-2',
    name: 'Dr. Michael Lee',
    specialization: 'Endodontist',
    email: 'michael.lee@careloop.com',
    phone: '(555) 234-5678',
  },
  {
    id: 'doc-3',
    name: 'Dr. Jennifer Martinez',
    specialization: 'Orthodontist',
    email: 'jennifer.martinez@careloop.com',
    phone: '(555) 345-6789',
  },
];

/**
 * Mock appointments
 * October 17, 2025 - Various days for calendar testing
 */
export const mockAppointments: Appointment[] = [
  // TODAY - October 17, 2025
  {
    id: 'apt-1',
    patientId: mockPatients[0].id, // Sarah Johnson
    doctorId: mockDoctors[0].id,
    startTime: new Date('2025-10-17T08:30:00'),
    endTime: new Date('2025-10-17T09:00:00'),
    procedureType: 'Cleaning',
    status: 'scheduled',
    bookingSource: 'ai',
    aiConfidenceScore: 95,
    notes: 'Patient requested morning appointment',
    insuranceProvider: 'Delta Dental',
    estimatedCost: 150,
    patientCost: 30,
    createdBy: 'system',
    createdAt: new Date('2025-10-10T14:20:00'),
    updatedAt: new Date('2025-10-10T14:20:00'),
    confirmed: true,
    confirmedAt: new Date('2025-10-11T09:15:00'),
  },
  {
    id: 'apt-2',
    patientId: mockPatients[1].id, // Michael Chen
    doctorId: mockDoctors[1].id,
    startTime: new Date('2025-10-17T10:00:00'),
    endTime: new Date('2025-10-17T11:30:00'),
    procedureType: 'Root Canal',
    status: 'scheduled',
    bookingSource: 'manual',
    notes: 'Follow-up from emergency visit',
    insuranceProvider: 'Cigna Dental',
    estimatedCost: 1200,
    patientCost: 240,
    createdBy: 'user-1',
    createdAt: new Date('2025-10-05T16:45:00'),
    updatedAt: new Date('2025-10-05T16:45:00'),
    confirmed: true,
    confirmedAt: new Date('2025-10-06T10:30:00'),
  },
  {
    id: 'apt-3',
    patientId: mockPatients[2].id, // Emily Rodriguez
    doctorId: mockDoctors[0].id,
    startTime: new Date('2025-10-17T14:00:00'),
    endTime: new Date('2025-10-17T15:00:00'),
    procedureType: 'Filling',
    status: 'scheduled',
    bookingSource: 'ai',
    aiConfidenceScore: 88,
    patientNotes: 'Tooth sensitivity on upper right',
    insuranceProvider: 'Aetna Dental',
    estimatedCost: 300,
    patientCost: 90,
    createdBy: 'system',
    createdAt: new Date('2025-10-12T11:30:00'),
    updatedAt: new Date('2025-10-12T11:30:00'),
    confirmed: true,
  },
  {
    id: 'apt-4',
    patientId: mockPatients[3].id, // James Taylor
    doctorId: mockDoctors[2].id,
    startTime: new Date('2025-10-17T15:30:00'),
    endTime: new Date('2025-10-17T16:00:00'),
    procedureType: 'Consultation',
    status: 'scheduled',
    bookingSource: 'manual',
    notes: 'Orthodontic consultation for braces',
    insuranceProvider: 'MetLife',
    estimatedCost: 0, // Consultation often free
    patientCost: 0,
    createdBy: 'user-1',
    createdAt: new Date('2025-10-08T13:20:00'),
    updatedAt: new Date('2025-10-08T13:20:00'),
    confirmed: true,
  },

  // MONDAY - October 20, 2025
  {
    id: 'apt-5',
    patientId: mockPatients[4].id, // Lisa Anderson
    doctorId: mockDoctors[0].id,
    startTime: new Date('2025-10-20T09:00:00'),
    endTime: new Date('2025-10-20T09:30:00'),
    procedureType: 'Cleaning',
    status: 'scheduled',
    bookingSource: 'ai',
    aiConfidenceScore: 92,
    insuranceProvider: 'Delta Dental',
    estimatedCost: 150,
    patientCost: 30,
    createdBy: 'system',
    createdAt: new Date('2025-10-13T10:00:00'),
    updatedAt: new Date('2025-10-13T10:00:00'),
  },
  {
    id: 'apt-6',
    patientId: mockPatients[5].id, // David Martinez
    doctorId: mockDoctors[0].id,
    startTime: new Date('2025-10-20T10:00:00'),
    endTime: new Date('2025-10-20T10:30:00'),
    procedureType: 'Cleaning',
    status: 'scheduled',
    bookingSource: 'manual',
    notes: 'First visit for new patient',
    insuranceProvider: 'Guardian',
    estimatedCost: 150,
    patientCost: 30,
    createdBy: 'user-1',
    createdAt: new Date('2025-10-14T15:30:00'),
    updatedAt: new Date('2025-10-14T15:30:00'),
  },
  {
    id: 'apt-7',
    patientId: mockPatients[6].id, // Amanda White
    doctorId: mockDoctors[1].id,
    startTime: new Date('2025-10-20T13:00:00'),
    endTime: new Date('2025-10-20T14:00:00'),
    procedureType: 'Crown',
    status: 'scheduled',
    bookingSource: 'manual',
    notes: 'Crown prep and impression',
    insuranceProvider: 'Cigna Dental',
    estimatedCost: 1500,
    patientCost: 450,
    createdBy: 'user-1',
    createdAt: new Date('2025-10-10T09:45:00'),
    updatedAt: new Date('2025-10-10T09:45:00'),
    confirmed: true,
  },

  // TUESDAY - October 21, 2025
  {
    id: 'apt-8',
    patientId: mockPatients[7].id, // Robert Brown
    doctorId: mockDoctors[0].id,
    startTime: new Date('2025-10-21T08:00:00'),
    endTime: new Date('2025-10-21T08:30:00'),
    procedureType: 'Cleaning',
    status: 'scheduled',
    bookingSource: 'ai',
    aiConfidenceScore: 96,
    insuranceProvider: 'Delta Dental',
    estimatedCost: 150,
    patientCost: 30,
    createdBy: 'system',
    createdAt: new Date('2025-10-15T08:20:00'),
    updatedAt: new Date('2025-10-15T08:20:00'),
  },
  {
    id: 'apt-9',
    patientId: mockPatients[0].id, // Sarah Johnson (2nd appointment)
    doctorId: mockDoctors[1].id,
    startTime: new Date('2025-10-21T11:00:00'),
    endTime: new Date('2025-10-21T12:00:00'),
    procedureType: 'Filling',
    status: 'scheduled',
    bookingSource: 'manual',
    notes: 'Cavity on tooth #18',
    insuranceProvider: 'Delta Dental',
    estimatedCost: 300,
    patientCost: 60,
    createdBy: 'user-1',
    createdAt: new Date('2025-10-16T14:00:00'),
    updatedAt: new Date('2025-10-16T14:00:00'),
  },
  {
    id: 'apt-10',
    patientId: mockPatients[1].id, // Michael Chen (follow-up)
    doctorId: mockDoctors[1].id,
    startTime: new Date('2025-10-21T14:30:00'),
    endTime: new Date('2025-10-21T15:00:00'),
    procedureType: 'Consultation',
    status: 'scheduled',
    bookingSource: 'ai',
    aiConfidenceScore: 89,
    notes: 'Post-root canal check-up',
    insuranceProvider: 'Cigna Dental',
    estimatedCost: 0,
    patientCost: 0,
    createdBy: 'system',
    createdAt: new Date('2025-10-17T10:30:00'),
    updatedAt: new Date('2025-10-17T10:30:00'),
  },

  // WEDNESDAY - October 22, 2025
  {
    id: 'apt-11',
    patientId: mockPatients[2].id, // Emily Rodriguez
    doctorId: mockDoctors[0].id,
    startTime: new Date('2025-10-22T09:30:00'),
    endTime: new Date('2025-10-22T10:00:00'),
    procedureType: 'X-Ray',
    status: 'scheduled',
    bookingSource: 'manual',
    notes: 'Full mouth X-ray series',
    insuranceProvider: 'Aetna Dental',
    estimatedCost: 200,
    patientCost: 40,
    createdBy: 'user-1',
    createdAt: new Date('2025-10-15T11:00:00'),
    updatedAt: new Date('2025-10-15T11:00:00'),
  },
  {
    id: 'apt-12',
    patientId: mockPatients[3].id, // James Taylor (rescheduled)
    doctorId: mockDoctors[2].id,
    startTime: new Date('2025-10-22T13:00:00'),
    endTime: new Date('2025-10-22T14:30:00'),
    procedureType: 'Orthodontics',
    status: 'scheduled',
    bookingSource: 'manual',
    notes: 'Braces installation - first appointment',
    rescheduledFrom: 'apt-100', // Original appointment ID
    rescheduledReason: 'Patient requested different time',
    insuranceProvider: 'MetLife',
    estimatedCost: 5000,
    patientCost: 2000,
    createdBy: 'user-1',
    createdAt: new Date('2025-10-09T10:00:00'),
    updatedAt: new Date('2025-10-16T16:30:00'),
  },

  // THURSDAY - October 23, 2025
  {
    id: 'apt-13',
    patientId: mockPatients[4].id, // Lisa Anderson
    doctorId: mockDoctors[1].id,
    startTime: new Date('2025-10-23T10:00:00'),
    endTime: new Date('2025-10-23T11:00:00'),
    procedureType: 'Root Canal',
    status: 'scheduled',
    bookingSource: 'ai',
    aiConfidenceScore: 91,
    notes: 'Emergency root canal',
    insuranceProvider: 'Delta Dental',
    estimatedCost: 1200,
    patientCost: 240,
    createdBy: 'system',
    createdAt: new Date('2025-10-16T15:45:00'),
    updatedAt: new Date('2025-10-16T15:45:00'),
  },
  {
    id: 'apt-14',
    patientId: mockPatients[6].id, // Amanda White
    doctorId: mockDoctors[0].id,
    startTime: new Date('2025-10-23T14:00:00'),
    endTime: new Date('2025-10-23T14:30:00'),
    procedureType: 'Cleaning',
    status: 'scheduled',
    bookingSource: 'manual',
    insuranceProvider: 'Cigna Dental',
    estimatedCost: 150,
    patientCost: 30,
    createdBy: 'user-1',
    createdAt: new Date('2025-10-14T09:00:00'),
    updatedAt: new Date('2025-10-14T09:00:00'),
  },

  // FRIDAY - October 24, 2025
  {
    id: 'apt-15',
    patientId: mockPatients[7].id, // Robert Brown
    doctorId: mockDoctors[0].id,
    startTime: new Date('2025-10-24T09:00:00'),
    endTime: new Date('2025-10-24T10:00:00'),
    procedureType: 'Whitening',
    status: 'scheduled',
    bookingSource: 'ai',
    aiConfidenceScore: 87,
    notes: 'Professional teeth whitening session',
    estimatedCost: 400,
    patientCost: 400, // Cosmetic, no insurance
    createdBy: 'system',
    createdAt: new Date('2025-10-17T13:00:00'),
    updatedAt: new Date('2025-10-17T13:00:00'),
  },
  {
    id: 'apt-16',
    patientId: mockPatients[5].id, // David Martinez
    doctorId: mockDoctors[2].id,
    startTime: new Date('2025-10-24T11:00:00'),
    endTime: new Date('2025-10-24T11:30:00'),
    procedureType: 'Consultation',
    status: 'scheduled',
    bookingSource: 'manual',
    notes: 'Discuss braces options',
    estimatedCost: 0,
    patientCost: 0,
    createdBy: 'user-1',
    createdAt: new Date('2025-10-16T10:30:00'),
    updatedAt: new Date('2025-10-16T10:30:00'),
  },
  {
    id: 'apt-17',
    patientId: mockPatients[0].id, // Sarah Johnson
    doctorId: mockDoctors[0].id,
    startTime: new Date('2025-10-24T15:00:00'),
    endTime: new Date('2025-10-24T15:30:00'),
    procedureType: 'Consultation',
    status: 'scheduled',
    bookingSource: 'ai',
    aiConfidenceScore: 94,
    notes: 'Follow-up on filling',
    insuranceProvider: 'Delta Dental',
    estimatedCost: 0,
    patientCost: 0,
    createdBy: 'system',
    createdAt: new Date('2025-10-17T14:15:00'),
    updatedAt: new Date('2025-10-17T14:15:00'),
  },

  // PAST APPOINTMENT (October 16, 2025 - Yesterday)
  {
    id: 'apt-18',
    patientId: mockPatients[1].id, // Michael Chen
    doctorId: mockDoctors[0].id,
    startTime: new Date('2025-10-16T10:00:00'),
    endTime: new Date('2025-10-16T10:30:00'),
    procedureType: 'Consultation',
    status: 'completed',
    bookingSource: 'manual',
    notes: 'Emergency consult before root canal',
    insuranceProvider: 'Cigna Dental',
    estimatedCost: 75,
    patientCost: 15,
    createdBy: 'user-1',
    createdAt: new Date('2025-10-15T16:00:00'),
    updatedAt: new Date('2025-10-16T10:30:00'),
    confirmed: true,
  },

  // NEXT WEEK - October 27, 2025 (Monday)
  {
    id: 'apt-19',
    patientId: mockPatients[2].id, // Emily Rodriguez
    doctorId: mockDoctors[1].id,
    startTime: new Date('2025-10-27T09:00:00'),
    endTime: new Date('2025-10-27T10:00:00'),
    procedureType: 'Crown',
    status: 'scheduled',
    bookingSource: 'ai',
    aiConfidenceScore: 93,
    notes: 'Crown installation after prep',
    insuranceProvider: 'Aetna Dental',
    estimatedCost: 1500,
    patientCost: 450,
    createdBy: 'system',
    createdAt: new Date('2025-10-17T15:00:00'),
    updatedAt: new Date('2025-10-17T15:00:00'),
  },
  {
    id: 'apt-20',
    patientId: mockPatients[4].id, // Lisa Anderson
    doctorId: mockDoctors[0].id,
    startTime: new Date('2025-10-27T13:30:00'),
    endTime: new Date('2025-10-27T14:00:00'),
    procedureType: 'Consultation',
    status: 'scheduled',
    bookingSource: 'manual',
    notes: 'Post-root canal follow-up',
    insuranceProvider: 'Delta Dental',
    estimatedCost: 0,
    patientCost: 0,
    createdBy: 'user-1',
    createdAt: new Date('2025-10-17T11:00:00'),
    updatedAt: new Date('2025-10-17T11:00:00'),
  },

  // CANCELED APPOINTMENT
  {
    id: 'apt-21',
    patientId: mockPatients[3].id, // James Taylor
    doctorId: mockDoctors[0].id,
    startTime: new Date('2025-10-18T14:00:00'),
    endTime: new Date('2025-10-18T14:30:00'),
    procedureType: 'Cleaning',
    status: 'canceled',
    bookingSource: 'ai',
    aiConfidenceScore: 90,
    notes: 'Patient canceled due to scheduling conflict',
    createdBy: 'system',
    createdAt: new Date('2025-10-11T09:00:00'),
    updatedAt: new Date('2025-10-16T17:00:00'),
  },
];

/**
 * Helper function to get appointments for a specific doctor
 */
export function getAppointmentsByDoctor(doctorId: string): Appointment[] {
  return mockAppointments.filter((apt) => apt.doctorId === doctorId);
}

/**
 * Helper function to get appointments for a specific date
 */
export function getAppointmentsByDate(date: Date): Appointment[] {
  return mockAppointments.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return (
      aptDate.getFullYear() === date.getFullYear() &&
      aptDate.getMonth() === date.getMonth() &&
      aptDate.getDate() === date.getDate()
    );
  });
}

/**
 * Helper function to get appointments in a date range
 */
export function getAppointmentsByDateRange(
  startDate: Date,
  endDate: Date
): Appointment[] {
  return mockAppointments.filter((apt) => {
    const aptDate = new Date(apt.startTime);
    return aptDate >= startDate && aptDate <= endDate;
  });
}

/**
 * Helper function to get AI vs Manual booking counts
 */
export function getBookingSourceCounts() {
  const ai = mockAppointments.filter((apt) => apt.bookingSource === 'ai').length;
  const manual = mockAppointments.filter((apt) => apt.bookingSource === 'manual').length;
  
  return {
    ai,
    manual,
    total: ai + manual,
    aiPercentage: ((ai / (ai + manual)) * 100).toFixed(1),
    manualPercentage: ((manual / (ai + manual)) * 100).toFixed(1),
  };
}
