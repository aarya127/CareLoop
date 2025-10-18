/**
 * Audit Logging Service
 * HIPAA/PHIPA compliant audit trail for all patient data access
 */

export type AuditAction =
  // Authentication
  | 'user_login'
  | 'user_logout'
  | 'session_restored'
  | 'token_refreshed'
  // Patient access
  | 'view_patient_profile'
  | 'view_patient_list'
  | 'edit_patient_info'
  | 'create_patient'
  | 'delete_patient'
  // Appointments
  | 'view_patient_calendar'
  | 'create_appointment'
  | 'edit_appointment'
  | 'cancel_appointment'
  | 'reschedule_appointment'
  // Communications
  | 'view_conversation'
  | 'send_message'
  | 'initiate_call'
  | 'play_recording'
  | 'view_call_history'
  // Sensitive data
  | 'reveal_sensitive'
  | 'view_insurance_details'
  | 'export_patient_data'
  // Clinical
  | 'view_dental_records'
  | 'edit_dental_notes'
  | 'view_xray'
  | 'upload_xray'
  | 'view_periodontal_chart'
  | 'edit_periodontal_data'
  // System
  | 'api_success'
  | 'api_error'
  | 'ux_click';

export interface AuditLogEntry {
  id?: string;
  timestamp?: Date;
  action: AuditAction;
  actor_id?: string; // User performing the action
  patient_id?: string; // Patient being accessed (if applicable)
  resource_type?: string; // e.g., 'patient', 'appointment', 'conversation'
  resource_id?: string; // ID of the specific resource
  source: string; // e.g., 'card_button', 'drawer', 'calendar_view'
  ip_address?: string;
  user_agent?: string;
  request_id?: string; // For correlating with API calls
  metadata?: Record<string, any>; // Additional context
  result?: 'success' | 'failure' | 'denied';
  error_message?: string;
}

export interface AuditLogFilter {
  actor_id?: string;
  patient_id?: string;
  action?: AuditAction | AuditAction[];
  from_date?: Date;
  to_date?: Date;
  source?: string;
  result?: 'success' | 'failure' | 'denied';
  limit?: number;
  offset?: number;
}

class AuditService {
  private buffer: AuditLogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 50;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor() {
    // Start auto-flush
    if (typeof window !== 'undefined') {
      this.startAutoFlush();
    }
  }

  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ip_address: await this.getClientIP(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      result: 'success',
      ...entry,
    };

    // Add to buffer
    this.buffer.push(fullEntry);

    // Flush if buffer is full
    if (this.buffer.length >= this.BUFFER_SIZE) {
      await this.flush();
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', {
        action: fullEntry.action,
        actor: fullEntry.actor_id,
        patient: fullEntry.patient_id,
        source: fullEntry.source,
        timestamp: fullEntry.timestamp,
      });
    }
  }

  /**
   * Flush buffered logs to server
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    try {
      // In production: POST /api/audit/logs
      await fetch('/api/audit/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ logs }),
      });
    } catch (error) {
      console.error('Failed to flush audit logs:', error);
      // Retry logic could be added here
    }
  }

  /**
   * Start automatic flush timer
   */
  private startAutoFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Stop automatic flush
   */
  public stopAutoFlush(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  /**
   * Get client IP address (best effort)
   */
  private async getClientIP(): Promise<string | undefined> {
    // In production, this would come from server-side
    // For now, return undefined (server will fill it in)
    return undefined;
  }

  /**
   * Query audit logs (admin only)
   */
  async query(filter: AuditLogFilter): Promise<AuditLogEntry[]> {
    try {
      const params = new URLSearchParams();
      if (filter.actor_id) params.append('actor_id', filter.actor_id);
      if (filter.patient_id) params.append('patient_id', filter.patient_id);
      if (filter.action) {
        const actions = Array.isArray(filter.action) ? filter.action : [filter.action];
        actions.forEach((a) => params.append('action', a));
      }
      if (filter.from_date) params.append('from', filter.from_date.toISOString());
      if (filter.to_date) params.append('to', filter.to_date.toISOString());
      if (filter.source) params.append('source', filter.source);
      if (filter.result) params.append('result', filter.result);
      if (filter.limit) params.append('limit', filter.limit.toString());
      if (filter.offset) params.append('offset', filter.offset.toString());

      const response = await fetch(`/api/audit/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to query audit logs');

      const data = await response.json();
      return data.logs;
    } catch (error) {
      console.error('Audit query error:', error);
      return [];
    }
  }

  /**
   * Get audit trail for a specific patient
   */
  async getPatientAuditTrail(patientId: string, limit = 100): Promise<AuditLogEntry[]> {
    return this.query({
      patient_id: patientId,
      limit,
    });
  }

  /**
   * Get user activity log
   */
  async getUserActivity(actorId: string, limit = 100): Promise<AuditLogEntry[]> {
    return this.query({
      actor_id: actorId,
      limit,
    });
  }
}

// Singleton instance
const auditService = new AuditService();

/**
 * Convenience function for logging audit events
 */
export async function auditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
  return auditService.log(entry);
}

/**
 * Convenience function for logging UX interactions
 */
export async function trackUXClick(element: string, metadata?: Record<string, any>): Promise<void> {
  return auditService.log({
    action: 'ux_click',
    source: element,
    metadata,
  });
}

/**
 * Convenience function for logging API calls
 */
export async function trackAPICall(
  endpoint: string,
  method: string,
  success: boolean,
  error?: string,
  requestId?: string
): Promise<void> {
  return auditService.log({
    action: success ? 'api_success' : 'api_error',
    source: 'api_client',
    metadata: { endpoint, method },
    result: success ? 'success' : 'failure',
    error_message: error,
    request_id: requestId,
  });
}

export default auditService;
