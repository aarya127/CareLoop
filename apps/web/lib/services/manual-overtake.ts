/**
 * Manual overtake / handoff session state — in-memory stub.
 * Tracks which staff member has control of a live AI call.
 */

export type OvertakeAction =
  | 'handoff.request'
  | 'handoff.accept'
  | 'handoff.resume_ai'
  | 'call.end';

export interface ControlSession {
  callId: string;
  status: 'ai' | 'handoff_requested' | 'staff' | 'ended';
  staffUserId?: string;
  updatedAt: string;
}

const sessions = new Map<string, ControlSession>();

function now() {
  return new Date().toISOString();
}

export function getOrCreateControlSession(callId: string): ControlSession {
  if (!sessions.has(callId)) {
    sessions.set(callId, { callId, status: 'ai', updatedAt: now() });
  }
  return sessions.get(callId)!;
}

export function requestHandoff(callId: string, _userId: string): ControlSession {
  const s = getOrCreateControlSession(callId);
  s.status = 'handoff_requested';
  s.updatedAt = now();
  return s;
}

export function activateStaff(callId: string, userId: string): ControlSession {
  const s = getOrCreateControlSession(callId);
  s.status = 'staff';
  s.staffUserId = userId;
  s.updatedAt = now();
  return s;
}

export function resumeAi(callId: string, _userId: string): ControlSession {
  const s = getOrCreateControlSession(callId);
  s.status = 'ai';
  s.staffUserId = undefined;
  s.updatedAt = now();
  return s;
}

export function endCall(callId: string, _userId: string): ControlSession {
  const s = getOrCreateControlSession(callId);
  s.status = 'ended';
  s.updatedAt = now();
  return s;
}
