/**
 * Telephony Gateway Client
 * Type-safe wrapper for VoIP calls, recordings, and transcripts
 */

import type {
  CallRecord,
  InitiateCallRequest,
  CallTranscript,
  APIResponse,
  APIError,
  PaginatedResponse,
} from './api-types';
import { auditLog, trackAPICall } from './audit-service';

// Configuration
const TELEPHONY_GATEWAY_BASE_URL = process.env.NEXT_PUBLIC_TELEPHONY_GATEWAY_URL || 'https://api.careloop.com/telephony';
const DEFAULT_TIMEOUT = 15000; // 15 seconds for telephony
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// E.164 phone number regex
const E164_REGEX = /^\+[1-9]\d{1,14}$/;

interface GetCallHistoryFilter {
  patient_id?: string;
  direction?: 'inbound' | 'outbound';
  agent_type?: 'ai' | 'human';
  status?: CallRecord['status'][];
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

class TelephonyGatewayClient {
  /**
   * Validate E.164 phone number format
   */
  private validatePhoneNumber(phone: string): void {
    if (!E164_REGEX.test(phone)) {
      throw new Error(`Invalid E.164 phone number format: ${phone}. Expected format: +[country code][number]`);
    }
  }

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

      const url = `${TELEPHONY_GATEWAY_BASE_URL}${endpoint}`;
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
   * Get call history for a patient
   */
  async getCallHistory(
    filter: GetCallHistoryFilter
  ): Promise<PaginatedResponse<CallRecord>> {
    if (filter.patient_id) {
      auditLog({
        action: 'view_call_history',
        patient_id: filter.patient_id,
        source: 'telephony_gateway_client',
        metadata: { endpoint: '/calls', filter },
      });
    }

    const params = new URLSearchParams();
    if (filter.patient_id) params.append('patient_id', filter.patient_id);
    if (filter.direction) params.append('direction', filter.direction);
    if (filter.agent_type) params.append('agent_type', filter.agent_type);
    if (filter.status) params.append('status', filter.status.join(','));
    if (filter.from_date) params.append('from_date', filter.from_date);
    if (filter.to_date) params.append('to_date', filter.to_date);
    if (filter.limit) params.append('limit', filter.limit.toString());
    if (filter.offset) params.append('offset', filter.offset.toString());

    const response = await this.request<PaginatedResponse<CallRecord>>(
      `/calls?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Initiate an outbound call
   */
  async initiateCall(
    request: InitiateCallRequest,
    patientId: string
  ): Promise<CallRecord> {
    // Validate phone numbers
    this.validatePhoneNumber(request.to);
    this.validatePhoneNumber(request.from);

    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'initiate_call',
      patient_id: patientId,
      source: 'telephony_gateway_client',
      metadata: {
        endpoint: '/calls/initiate',
        idempotency_key: idempotencyKey,
        to: request.to,
        record: request.record,
      },
    });

    const response = await this.request<CallRecord>(
      '/calls/initiate',
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
   * Get call details by ID
   */
  async getCall(callId: string, patientId: string): Promise<CallRecord> {
    auditLog({
      action: 'view_call_history',
      patient_id: patientId,
      resource_type: 'call',
      resource_id: callId,
      source: 'telephony_gateway_client',
      metadata: { endpoint: `/calls/${callId}` },
    });

    const response = await this.request<CallRecord>(`/calls/${callId}`);
    return response.data;
  }

  /**
   * Get call transcript with ASR segments
   */
  async getCallTranscript(
    callId: string,
    patientId: string
  ): Promise<CallTranscript> {
    auditLog({
      action: 'view_call_history',
      patient_id: patientId,
      resource_type: 'call_transcript',
      resource_id: callId,
      source: 'telephony_gateway_client',
      metadata: { endpoint: `/calls/${callId}/transcript` },
    });

    const response = await this.request<CallTranscript>(
      `/calls/${callId}/transcript`
    );

    return response.data;
  }

  /**
   * Get signed URL for call recording
   * Requires consent validation before playback
   */
  async getRecordingUrl(
    callId: string,
    patientId: string,
    consentToRecord: boolean
  ): Promise<{ url: string; expires_at: string }> {
    // Validate consent before accessing recording
    if (!consentToRecord) {
      throw new Error('Cannot access recording: Patient has not consented to recording');
    }

    auditLog({
      action: 'play_recording',
      patient_id: patientId,
      resource_type: 'call_recording',
      resource_id: callId,
      source: 'telephony_gateway_client',
      metadata: { endpoint: `/calls/${callId}/recording` },
    });

    const response = await this.request<{ url: string; expires_at: string }>(
      `/calls/${callId}/recording`
    );

    return response.data;
  }

  /**
   * Download call recording as blob
   * Requires consent validation
   */
  async downloadRecording(
    callId: string,
    patientId: string,
    consentToRecord: boolean
  ): Promise<Blob> {
    if (!consentToRecord) {
      throw new Error('Cannot download recording: Patient has not consented to recording');
    }

    const { url } = await this.getRecordingUrl(callId, patientId, consentToRecord);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Update call metadata (notes, tags)
   */
  async updateCall(
    callId: string,
    patientId: string,
    updates: {
      notes?: string;
      tags?: string[];
      follow_up_required?: boolean;
    }
  ): Promise<CallRecord> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'view_call_history',
      patient_id: patientId,
      resource_type: 'call',
      resource_id: callId,
      source: 'telephony_gateway_client',
      metadata: {
        endpoint: `/calls/${callId}`,
        idempotency_key: idempotencyKey,
        updates,
      },
    });

    const response = await this.request<CallRecord>(
      `/calls/${callId}`,
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
   * Get call statistics for a patient
   */
  async getCallStats(
    patientId: string,
    dateRange?: { from: string; to: string }
  ): Promise<{
    total_calls: number;
    inbound_calls: number;
    outbound_calls: number;
    ai_handled: number;
    human_handled: number;
    average_duration_seconds: number;
    completed_calls: number;
    missed_calls: number;
  }> {
    const params = new URLSearchParams({ patient_id: patientId });
    if (dateRange) {
      params.append('from_date', dateRange.from);
      params.append('to_date', dateRange.to);
    }

    const response = await this.request<any>(
      `/calls/stats?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Request call callback (patient requests callback)
   */
  async requestCallback(
    patientId: string,
    phoneNumber: string,
    preferredTime?: string,
    reason?: string
  ): Promise<{ callback_id: string; scheduled_at: string }> {
    this.validatePhoneNumber(phoneNumber);

    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'initiate_call',
      patient_id: patientId,
      source: 'telephony_gateway_client',
      metadata: {
        endpoint: '/calls/callback',
        idempotency_key: idempotencyKey,
        preferred_time: preferredTime,
        reason,
      },
    });

    const response = await this.request<{ callback_id: string; scheduled_at: string }>(
      '/calls/callback',
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          patient_id: patientId,
          phone_number: phoneNumber,
          preferred_time: preferredTime,
          reason,
        }),
      }
    );

    return response.data;
  }
}

// Singleton instance
export const telephonyGatewayClient = new TelephonyGatewayClient();

// Convenience functions
export async function getCallHistory(filter: GetCallHistoryFilter) {
  return telephonyGatewayClient.getCallHistory(filter);
}

export async function initiateCall(request: InitiateCallRequest, patientId: string) {
  return telephonyGatewayClient.initiateCall(request, patientId);
}

export async function getCall(callId: string, patientId: string) {
  return telephonyGatewayClient.getCall(callId, patientId);
}

export async function getCallTranscript(callId: string, patientId: string) {
  return telephonyGatewayClient.getCallTranscript(callId, patientId);
}

export async function getRecordingUrl(
  callId: string,
  patientId: string,
  consentToRecord: boolean
) {
  return telephonyGatewayClient.getRecordingUrl(callId, patientId, consentToRecord);
}

export async function downloadRecording(
  callId: string,
  patientId: string,
  consentToRecord: boolean
) {
  return telephonyGatewayClient.downloadRecording(callId, patientId, consentToRecord);
}

export async function updateCall(
  callId: string,
  patientId: string,
  updates: Parameters<typeof telephonyGatewayClient.updateCall>[2]
) {
  return telephonyGatewayClient.updateCall(callId, patientId, updates);
}

export async function getCallStats(
  patientId: string,
  dateRange?: { from: string; to: string }
) {
  return telephonyGatewayClient.getCallStats(patientId, dateRange);
}

export async function requestCallback(
  patientId: string,
  phoneNumber: string,
  preferredTime?: string,
  reason?: string
) {
  return telephonyGatewayClient.requestCallback(patientId, phoneNumber, preferredTime, reason);
}

// Export types
export type { GetCallHistoryFilter };
