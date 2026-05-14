'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '@/lib/api-config';
import { KPIData, Patient, Appointment, Call, ActionItem } from '@/lib/schemas';

// Mock API client (replace with actual implementation)
const apiClient = {
  get: async <T,>(url: string): Promise<T> => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {} as T;
  },
  post: async <T,>(url: string, data: any): Promise<T> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {} as T;
  },
  put: async <T,>(url: string, data: any): Promise<T> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {} as T;
  },
  delete: async (url: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
  },
};

// KPI Hooks
export function useKPIData() {
  return useQuery({
    queryKey: ['kpi', 'today'],
    queryFn: () => apiClient.get<KPIData>(ENDPOINTS.INSIGHTS_TODAY),
  });
}

// Patient Hooks
export function useRecentPatients() {
  return useQuery({
    queryKey: ['patients', 'recent'],
    queryFn: () => apiClient.get<Patient[]>(ENDPOINTS.PATIENTS_RECENT),
  });
}

export function usePatientDetails(patientId: string) {
  return useQuery({
    queryKey: ['patient', patientId],
    queryFn: () => apiClient.get<Patient>(ENDPOINTS.PATIENT_DETAILS(patientId)),
    enabled: !!patientId,
  });
}

// Appointment Hooks
export function useAppointments(filters?: {
  view?: string;
  providerIds?: string[];
  roomIds?: string[];
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: ['appointments', filters],
    queryFn: () => apiClient.get<Appointment[]>(ENDPOINTS.CALENDAR),
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<Appointment>) =>
      apiClient.post<Appointment>(ENDPOINTS.APPOINTMENTS, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Appointment> & { id: string }) =>
      apiClient.put<Appointment>(ENDPOINTS.APPOINTMENT_DETAILS(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

// Call Hooks
export function useRecentCalls() {
  return useQuery({
    queryKey: ['calls', 'recent'],
    queryFn: () => apiClient.get<Call[]>(ENDPOINTS.CALLS_RECENT),
  });
}

// Action Items Hooks
export function useActionItems() {
  return useQuery({
    queryKey: ['queue', 'actions'],
    queryFn: () => apiClient.get<ActionItem[]>(ENDPOINTS.QUEUE_ACTIONS),
  });
}

// Insurance Hooks
export function useInsuranceEligibility(patientId: string) {
  return useQuery({
    queryKey: ['insurance', 'eligibility', patientId],
    queryFn: () =>
      apiClient.get(ENDPOINTS.INSURANCE_ELIGIBILITY(patientId)),
    enabled: !!patientId,
  });
}
