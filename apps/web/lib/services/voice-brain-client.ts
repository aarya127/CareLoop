/**
 * Voice Brain Client
 * Type-safe wrapper for AI conversations, messaging, and appointment conversion
 */

import type {
  Conversation,
  Message,
  SendMessageRequest,
  ConvertToAppointmentRequest,
  Appointment,
  APIResponse,
  APIError,
  PaginatedResponse,
} from './api-types';
import { auditLog, trackAPICall } from './audit-service';

// Configuration
const VOICE_BRAIN_BASE_URL = process.env.NEXT_PUBLIC_VOICE_BRAIN_URL || 'https://api.careloop.com/voice-brain';
const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Rate limiting
const MESSAGE_RATE_LIMIT = 10; // messages per minute
const RATE_LIMIT_WINDOW_MS = 60000;

interface GetConversationsFilter {
  patient_id?: string;
  channel?: Conversation['channel'][];
  status?: Conversation['status'][];
  assigned_to?: string;
  unread_only?: boolean;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

interface GetMessagesFilter {
  conversation_id: string;
  from_date?: string;
  to_date?: string;
  sender?: Message['sender'][];
  limit?: number;
  offset?: number;
}

interface EscalateRequest {
  conversation_id: string;
  patient_id: string;
  reason: string;
  assign_to?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

interface MarkResolvedRequest {
  conversation_id: string;
  patient_id: string;
  resolution_notes?: string;
  follow_up_required?: boolean;
}

class VoiceBrainClient {
  private messageTimestamps: number[] = [];

  /**
   * Check rate limit before sending message
   */
  private checkRateLimit(): void {
    const now = Date.now();
    this.messageTimestamps = this.messageTimestamps.filter(
      ts => now - ts < RATE_LIMIT_WINDOW_MS
    );

    if (this.messageTimestamps.length >= MESSAGE_RATE_LIMIT) {
      throw new Error(`Rate limit exceeded: Maximum ${MESSAGE_RATE_LIMIT} messages per minute`);
    }

    this.messageTimestamps.push(now);
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

      const url = `${VOICE_BRAIN_BASE_URL}${endpoint}`;
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
   * Get conversations with filters
   */
  async getConversations(
    filter: GetConversationsFilter
  ): Promise<PaginatedResponse<Conversation>> {
    if (filter.patient_id) {
      auditLog({
        action: 'view_conversation',
        patient_id: filter.patient_id,
        source: 'voice_brain_client',
        metadata: { endpoint: '/conversations', filter },
      });
    }

    const params = new URLSearchParams();
    if (filter.patient_id) params.append('patient_id', filter.patient_id);
    if (filter.channel) params.append('channel', filter.channel.join(','));
    if (filter.status) params.append('status', filter.status.join(','));
    if (filter.assigned_to) params.append('assigned_to', filter.assigned_to);
    if (filter.unread_only) params.append('unread_only', 'true');
    if (filter.from_date) params.append('from_date', filter.from_date);
    if (filter.to_date) params.append('to_date', filter.to_date);
    if (filter.limit) params.append('limit', filter.limit.toString());
    if (filter.offset) params.append('offset', filter.offset.toString());

    const response = await this.request<PaginatedResponse<Conversation>>(
      `/conversations?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    filter: GetMessagesFilter
  ): Promise<PaginatedResponse<Message>> {
    const params = new URLSearchParams();
    params.append('conversation_id', filter.conversation_id);
    if (filter.from_date) params.append('from_date', filter.from_date);
    if (filter.to_date) params.append('to_date', filter.to_date);
    if (filter.sender) params.append('sender', filter.sender.join(','));
    if (filter.limit) params.append('limit', filter.limit.toString());
    if (filter.offset) params.append('offset', filter.offset.toString());

    const response = await this.request<PaginatedResponse<Message>>(
      `/messages?${params.toString()}`
    );

    return response.data;
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    request: SendMessageRequest,
    patientId: string
  ): Promise<Message> {
    // Check rate limit
    this.checkRateLimit();

    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'send_message',
      patient_id: patientId,
      source: 'voice_brain_client',
      metadata: {
        endpoint: '/messages',
        idempotency_key: idempotencyKey,
        conversation_id: request.conversation_id,
      },
    });

    const response = await this.request<Message>(
      '/messages',
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
   * Upload file attachment (image, PDF, etc.)
   */
  async uploadAttachment(
    conversationId: string,
    patientId: string,
    file: File
  ): Promise<{ file_id: string; url: string }> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'send_message',
      patient_id: patientId,
      source: 'voice_brain_client',
      metadata: {
        endpoint: '/attachments',
        idempotency_key: idempotencyKey,
        conversation_id: conversationId,
        file_name: file.name,
        file_size: file.size,
      },
    });

    const formData = new FormData();
    formData.append('conversation_id', conversationId);
    formData.append('file', file);

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null;

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${VOICE_BRAIN_BASE_URL}/attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Idempotency-Key': idempotencyKey,
        'x-request-id': crypto.randomUUID(),
      },
      body: formData,
      signal: AbortSignal.timeout(30000), // 30 seconds for file upload
    });

    if (!response.ok) {
      throw new Error(`Failed to upload attachment: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * Escalate conversation to human agent
   */
  async escalateConversation(
    request: EscalateRequest
  ): Promise<Conversation> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'send_message',
      patient_id: request.patient_id,
      source: 'voice_brain_client',
      metadata: {
        endpoint: `/conversations/${request.conversation_id}/escalate`,
        idempotency_key: idempotencyKey,
        reason: request.reason,
        assign_to: request.assign_to,
        priority: request.priority,
      },
    });

    const response = await this.request<Conversation>(
      `/conversations/${request.conversation_id}/escalate`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          reason: request.reason,
          assign_to: request.assign_to,
          priority: request.priority || 'medium',
        }),
      }
    );

    return response.data;
  }

  /**
   * Convert conversation to appointment
   * Uses smart datetime parsing from conversation context
   */
  async convertToAppointment(
    request: ConvertToAppointmentRequest,
    patientId: string
  ): Promise<Appointment> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'create_appointment',
      patient_id: patientId,
      source: 'voice_brain_client',
      metadata: {
        endpoint: `/conversations/${request.conversation_id}/convert-to-appointment`,
        idempotency_key: idempotencyKey,
        procedure_code: request.procedure_code,
        booking_source: 'ai',
      },
    });

    const response = await this.request<Appointment>(
      `/conversations/${request.conversation_id}/convert-to-appointment`,
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
   * Mark conversation as resolved
   */
  async markResolved(
    request: MarkResolvedRequest
  ): Promise<Conversation> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'send_message',
      patient_id: request.patient_id,
      source: 'voice_brain_client',
      metadata: {
        endpoint: `/conversations/${request.conversation_id}/resolve`,
        idempotency_key: idempotencyKey,
        follow_up_required: request.follow_up_required,
      },
    });

    const response = await this.request<Conversation>(
      `/conversations/${request.conversation_id}/resolve`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          resolution_notes: request.resolution_notes,
          follow_up_required: request.follow_up_required || false,
        }),
      }
    );

    return response.data;
  }

  /**
   * Reopen a resolved conversation
   */
  async reopenConversation(
    conversationId: string,
    patientId: string,
    reason?: string
  ): Promise<Conversation> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'send_message',
      patient_id: patientId,
      source: 'voice_brain_client',
      metadata: {
        endpoint: `/conversations/${conversationId}/reopen`,
        idempotency_key: idempotencyKey,
        reason,
      },
    });

    const response = await this.request<Conversation>(
      `/conversations/${conversationId}/reopen`,
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
   * Assign conversation to agent
   */
  async assignConversation(
    conversationId: string,
    patientId: string,
    assignTo: string
  ): Promise<Conversation> {
    const idempotencyKey = crypto.randomUUID();

    auditLog({
      action: 'send_message',
      patient_id: patientId,
      source: 'voice_brain_client',
      metadata: {
        endpoint: `/conversations/${conversationId}/assign`,
        idempotency_key: idempotencyKey,
        assign_to: assignTo,
      },
    });

    const response = await this.request<Conversation>(
      `/conversations/${conversationId}/assign`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({ assign_to: assignTo }),
      }
    );

    return response.data;
  }

  /**
   * Mark messages as read
   */
  async markAsRead(
    conversationId: string,
    patientId: string,
    messageIds?: string[]
  ): Promise<void> {
    await this.request(
      `/conversations/${conversationId}/read`,
      {
        method: 'POST',
        body: JSON.stringify({ message_ids: messageIds }),
      }
    );
  }

  /**
   * Get conversation summary (AI-generated)
   */
  async getConversationSummary(
    conversationId: string,
    patientId: string
  ): Promise<{
    summary: string;
    key_points: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    intent: string[];
    suggested_actions: string[];
  }> {
    const response = await this.request<any>(
      `/conversations/${conversationId}/summary`
    );

    return response.data;
  }

  /**
   * Search conversations by text
   */
  async searchConversations(
    query: string,
    patientId?: string,
    limit = 20
  ): Promise<Array<{
    conversation: Conversation;
    matches: Array<{ message_id: string; text: string; relevance: number }>;
  }>> {
    const params = new URLSearchParams();
    params.append('q', query);
    if (patientId) params.append('patient_id', patientId);
    params.append('limit', limit.toString());

    const response = await this.request<any>(
      `/conversations/search?${params.toString()}`
    );

    return response.data;
  }
}

// Singleton instance
export const voiceBrainClient = new VoiceBrainClient();

// Convenience functions
export async function getConversations(filter: GetConversationsFilter) {
  return voiceBrainClient.getConversations(filter);
}

export async function getMessages(filter: GetMessagesFilter) {
  return voiceBrainClient.getMessages(filter);
}

export async function sendMessage(request: SendMessageRequest, patientId: string) {
  return voiceBrainClient.sendMessage(request, patientId);
}

export async function uploadAttachment(
  conversationId: string,
  patientId: string,
  file: File
) {
  return voiceBrainClient.uploadAttachment(conversationId, patientId, file);
}

export async function escalateConversation(request: EscalateRequest) {
  return voiceBrainClient.escalateConversation(request);
}

export async function convertToAppointment(
  request: ConvertToAppointmentRequest,
  patientId: string
) {
  return voiceBrainClient.convertToAppointment(request, patientId);
}

export async function markResolved(request: MarkResolvedRequest) {
  return voiceBrainClient.markResolved(request);
}

export async function reopenConversation(
  conversationId: string,
  patientId: string,
  reason?: string
) {
  return voiceBrainClient.reopenConversation(conversationId, patientId, reason);
}

export async function assignConversation(
  conversationId: string,
  patientId: string,
  assignTo: string
) {
  return voiceBrainClient.assignConversation(conversationId, patientId, assignTo);
}

export async function markAsRead(
  conversationId: string,
  patientId: string,
  messageIds?: string[]
) {
  return voiceBrainClient.markAsRead(conversationId, patientId, messageIds);
}

export async function getConversationSummary(
  conversationId: string,
  patientId: string
) {
  return voiceBrainClient.getConversationSummary(conversationId, patientId);
}

export async function searchConversations(
  query: string,
  patientId?: string,
  limit?: number
) {
  return voiceBrainClient.searchConversations(query, patientId, limit);
}

// Export types
export type {
  GetConversationsFilter,
  GetMessagesFilter,
  EscalateRequest,
  MarkResolvedRequest,
};
