/**
 * Booking Service Client
 * Type-safe wrapper for appointment management
 */

import type {
  Appointment,
  APIResponse,
  APIError,
  PaginatedResponse,
} from './api-types';
import { auditLog, trackAPICall } from './audit-service';

// Configuration
const BOOKING_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_BOOKING_SERVICE_URL || 'https://api.careloop.com/booking';
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

interface CreateAppointmentRequest {
  patient_id: string;
  provider_id: string;
  start_time: string; // ISO 8601
  end_time: string;
  procedure_type: string;
  notes?: string;
  booking_source: 'ai' | 'manual' | 'rescheduled';
  booking_channel?: 'voice' | 'sms' | 'web' | 'staff' | 'web_chat' | 'phone' | 'in_person';
  ai_confidence?: number;
  suggested_by_ai?: boolean;
}

interface UpdateAppointmentRequest {
  start_time?: string;
  end_time?: string;
  provider_id?: string;
  procedure_type?: string;
  notes?: string;
  status?: Appointment['status'];
}

interface CoverageEstimateRequest {
  patient_id: string;
  procedure_type: string;
  provider_id: string;
  appointment_date: string;
}

interface CoverageEstimate {
  total_cost: number;
  insurance_coverage: number;
  patient_responsibility: number;
  copay?: number;
  deductible_applied?: number;
  coverage_percentage: number;
}

class BookingServiceClient {
  /**
   * Make authenticated request with retry logic
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<APIResponse<T>> {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    try {
      const token = typeof window !== 'undefined'
        ? localStorage.getItem('auth_token')
        : null;

      if (!token) {
        throw new Error('No authentication token found');
      }

      const url = `${BOOKING_SERVICE_BASE_URL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-request-id': requestId,
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
      });

      // Track successful API call
      if (response.ok) {
        trackAPICall(
          endpoint,
          options.method || 'GET',
          true,
          undefined,
          requestId
        );
      }

      if (!response.ok) {
        const error: APIError = await response.json().catch(() => ({
          code: 'UNKNOWN_ERROR',
          message: `HTTP ${response.status}: ${response.statusText}`,
          request_id: requestId,
        }));

        // Retry on 5xx errors
        if (response.status >= 500 && retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.request<T>(endpoint, options, retryCount + 1);
        }

        throw error;
      }

      const data: APIResponse<T> = await response.json();
      return data;

    } catch (error: any) {
      // Track API error
      trackAPICall(
        endpoint,
        options.method || 'GET',
        false,
        error.message,
        requestId
      );

      // Retry on network errors
      if (retryCount < MAX_RETRIES && error.name === 'AbortError') {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * Get all appointments for a patient
   */
  async getAppointments(
    patientId: string,
    filter?: {
      from_date?: string;
      to_date?: string;
      status?: Appointment['status'][];
      limit?: number;
      offset?: number;
    }
  ): Promise<PaginatedResponse<Appointment>> {
    auditLog({
      action: 'view_patient_calendar',
      patient_id: patientId,
      source: 'booking_service_client',
      metadata: { endpoint: '/appointments', filter },
    });

    const params = new URLSearchParams();
    params.append('patient_id', patientId);
    if (filter?.from_date) params.append('from_date', filter.from_date);
    if (filter?.to_date) params.append('to_date', filter.to_date);
    if (filter?.status) params.append('status', filter.status.join(','));
    if (filter?.limit) params.append('limit', filter.limit.toString());
    if (filter?.offset) params.append('offset', filter.offset.toString());

    const response = await this.request<PaginatedResponse<Appointment>>(
      `/appointments?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Create a new appointment with idempotency
   */
  async createAppointment(
    request: CreateAppointmentRequest
  ): Promise<Appointment> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'create_appointment',
      patient_id: request.patient_id,
      source: 'booking_service_client',
      metadata: {
        endpoint: '/appointments',
        idempotency_key: idempotencyKey,
        booking_source: request.booking_source,
        procedure_type: request.procedure_type,
      },
    });

    const response = await this.request<Appointment>(
      '/appointments',
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(request),
      }
    );

    return response.data;
  }

  /**
   * Update an existing appointment
   */
  async updateAppointment(
    appointmentId: string,
    patientId: string,
    updates: UpdateAppointmentRequest
  ): Promise<Appointment> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'edit_appointment',
      patient_id: patientId,
      resource_type: 'appointment',
      resource_id: appointmentId,
      source: 'booking_service_client',
      metadata: {
        endpoint: `/appointments/${appointmentId}`,
        idempotency_key: idempotencyKey,
        updates,
      },
    });

    const response = await this.request<Appointment>(
      `/appointments/${appointmentId}`,
      {
        method: 'PATCH',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(updates),
      }
    );

    return response.data;
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(
    appointmentId: string,
    patientId: string,
    reason?: string
  ): Promise<Appointment> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'cancel_appointment',
      patient_id: patientId,
      resource_type: 'appointment',
      resource_id: appointmentId,
      source: 'booking_service_client',
      metadata: {
        endpoint: `/appointments/${appointmentId}/cancel`,
        idempotency_key: idempotencyKey,
        reason,
      },
    });

    const response = await this.request<Appointment>(
      `/appointments/${appointmentId}/cancel`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ reason }),
      }
    );

    return response.data;
  }

  /**
   * Reschedule an appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    patientId: string,
    newStartTime: string,
    newEndTime: string,
    reason?: string
  ): Promise<Appointment> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'reschedule_appointment',
      patient_id: patientId,
      resource_type: 'appointment',
      resource_id: appointmentId,
      source: 'booking_service_client',
      metadata: {
        endpoint: `/appointments/${appointmentId}/reschedule`,
        idempotency_key: idempotencyKey,
        new_start_time: newStartTime,
        new_end_time: newEndTime,
        reason,
      },
    });

    const response = await this.request<Appointment>(
      `/appointments/${appointmentId}/reschedule`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          start_time: newStartTime,
          end_time: newEndTime,
          reason,
        }),
      }
    );

    return response.data;
  }

  /**
   * Get insurance coverage estimate for a procedure
   */
  async getCoverageEstimate(
    request: CoverageEstimateRequest
  ): Promise<CoverageEstimate> {
    auditLog({
      action: 'view_insurance_details',
      patient_id: request.patient_id,
      source: 'booking_service_client',
      metadata: {
        endpoint: '/coverage/estimate',
        procedure_type: request.procedure_type,
      },
    });

    const response = await this.request<CoverageEstimate>(
      '/coverage/estimate',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    );

    return response.data;
  }

  /**
   * Confirm an appointment (patient confirmed)
   */
  async confirmAppointment(
    appointmentId: string,
    patientId: string
  ): Promise<Appointment> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'edit_appointment',
      patient_id: patientId,
      resource_type: 'appointment',
      resource_id: appointmentId,
      source: 'booking_service_client',
      metadata: {
        endpoint: `/appointments/${appointmentId}/confirm`,
        idempotency_key: idempotencyKey,
      },
    });

    const response = await this.request<Appointment>(
      `/appointments/${appointmentId}/confirm`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );

    return response.data;
  }

  /**
   * Check in patient for appointment
   */
  async checkInAppointment(
    appointmentId: string,
    patientId: string
  ): Promise<Appointment> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'edit_appointment',
      patient_id: patientId,
      resource_type: 'appointment',
      resource_id: appointmentId,
      source: 'booking_service_client',
      metadata: {
        endpoint: `/appointments/${appointmentId}/checkin`,
        idempotency_key: idempotencyKey,
      },
    });

    const response = await this.request<Appointment>(
      `/appointments/${appointmentId}/checkin`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      }
    );

    return response.data;
  }
}

// Singleton instance
export const bookingServiceClient = new BookingServiceClient();

// Convenience functions
export async function getAppointments(
  patientId: string,
  filter?: Parameters<typeof bookingServiceClient.getAppointments>[1]
) {
  return bookingServiceClient.getAppointments(patientId, filter);
}

export async function createAppointment(request: CreateAppointmentRequest) {
  return bookingServiceClient.createAppointment(request);
}

export async function updateAppointment(
  appointmentId: string,
  patientId: string,
  updates: UpdateAppointmentRequest
) {
  return bookingServiceClient.updateAppointment(appointmentId, patientId, updates);
}

export async function cancelAppointment(
  appointmentId: string,
  patientId: string,
  reason?: string
) {
  return bookingServiceClient.cancelAppointment(appointmentId, patientId, reason);
}

export async function rescheduleAppointment(
  appointmentId: string,
  patientId: string,
  newStartTime: string,
  newEndTime: string,
  reason?: string
) {
  return bookingServiceClient.rescheduleAppointment(
    appointmentId,
    patientId,
    newStartTime,
    newEndTime,
    reason
  );
}

export async function getCoverageEstimate(request: CoverageEstimateRequest) {
  return bookingServiceClient.getCoverageEstimate(request);
}

export async function confirmAppointment(appointmentId: string, patientId: string) {
  return bookingServiceClient.confirmAppointment(appointmentId, patientId);
}

export async function checkInAppointment(appointmentId: string, patientId: string) {
  return bookingServiceClient.checkInAppointment(appointmentId, patientId);
}

// Export types
export type {
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  CoverageEstimateRequest,
  CoverageEstimate,
};
