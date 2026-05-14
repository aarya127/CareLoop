const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://careloop-tf2l.onrender.com';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Audit API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface AuditLogEntry {
  id: string;
  eventTime: string;
  eventType: string;
  outcome: string;
  actorUserId: string | null;
  targetUserId: string | null;
  ip: string | null;
  authMethod: string | null;
  sessionId: string | null;
  requestId: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AuditLogResponse {
  rows: AuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditFilters {
  eventType?: string;
  outcome?: string;
  actorUserId?: string;
  targetUserId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export const auditApi = {
  getLog: (filters: AuditFilters = {}) => {
    const params = new URLSearchParams();
    if (filters.eventType) params.set('eventType', filters.eventType);
    if (filters.outcome) params.set('outcome', filters.outcome);
    if (filters.actorUserId) params.set('actorUserId', filters.actorUserId);
    if (filters.targetUserId) params.set('targetUserId', filters.targetUserId);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.limit != null) params.set('limit', String(filters.limit));
    if (filters.offset != null) params.set('offset', String(filters.offset));
    const qs = params.toString();
    return get<AuditLogResponse>(`/audit${qs ? `?${qs}` : ''}`);
  },
};
