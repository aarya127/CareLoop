import { z } from 'zod';

// Patient Schemas
export const PatientSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  phone: z.string(),
  email: z.string().email().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  }).optional(),
  tags: z.array(z.string()).default([]),
  avatar: z.string().optional(),
});

export type Patient = z.infer<typeof PatientSchema>;

// Insurance Schemas
export const InsuranceSchema = z.object({
  patientId: z.string(),
  payer: z.string(),
  plan: z.string(),
  memberId: z.string(),
  groupNumber: z.string().optional(),
  eligibilityStatus: z.enum(['active', 'inactive', 'pending', 'unknown']),
  deductible: z.number(),
  deductibleMet: z.number(),
  remainingBenefits: z.number(),
  lastVerified: z.string().optional(),
});

export type Insurance = z.infer<typeof InsuranceSchema>;

// Appointment Schemas
export const AppointmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  providerId: z.string(),
  roomId: z.string().optional(),
  title: z.string(),
  type: z.enum(['new_patient', 'hygiene', 'procedure', 'emergency', 'follow_up']),
  start: z.string(),
  end: z.string(),
  status: z.enum(['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']),
  notes: z.string().optional(),
  insurancePending: z.boolean().default(false),
  balanceDue: z.boolean().default(false),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

// KPI Schemas
export const KPIDataSchema = z.object({
  todayAppointments: z.object({
    count: z.number(),
    sparkline: z.array(z.number()),
  }),
  utilization: z.object({
    percentage: z.number(),
    trend: z.number(),
  }),
  cancellations: z.object({
    count: z.number(),
    trend: z.array(z.number()),
  }),
  insuranceVerifications: z.object({
    pending: z.number(),
  }),
});

export type KPIData = z.infer<typeof KPIDataSchema>;

// Call Schemas
export const CallSchema = z.object({
  id: z.string(),
  patientId: z.string().optional(),
  direction: z.enum(['inbound', 'outbound']),
  status: z.enum(['ringing', 'in_progress', 'completed', 'failed']),
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.number().optional(),
  summary: z.string().optional(),
  intents: z.array(z.string()).default([]),
  recordingUrl: z.string().optional(),
});

export type Call = z.infer<typeof CallSchema>;

// Action Item Schemas
export const ActionItemSchema = z.object({
  id: z.string(),
  type: z.enum(['insurance_needed', 'callback', 'pre_auth_missing', 'balance_collect']),
  patientId: z.string(),
  patientName: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  createdAt: z.string(),
});

export type ActionItem = z.infer<typeof ActionItemSchema>;
