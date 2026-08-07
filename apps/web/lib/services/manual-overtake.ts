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
  practiceId: string;
  status: 'ai' | 'handoff_requested' | 'staff' | 'ended';
  staffUserId?: string;
  updatedAt: string;
}

const sessions = new Map<string, ControlSession>();

function now() {
  return new Date().toISOString();
}

function sessionKey(practiceId: string, callId: string): string {
  return JSON.stringify([practiceId, callId]);
}

export function getOrCreateControlSession(practiceId: string, callId: string): ControlSession {
  const key = sessionKey(practiceId, callId);
  if (!sessions.has(key)) {
    sessions.set(key, { callId, practiceId, status: 'ai', updatedAt: now() });
  }
  return sessions.get(key)!;
}

export function requestHandoff(
  practiceId: string,
  callId: string,
  _userId: string,
): ControlSession {
  const s = getOrCreateControlSession(practiceId, callId);
  s.status = 'handoff_requested';
  s.updatedAt = now();
  return s;
}

export function activateStaff(practiceId: string, callId: string, userId: string): ControlSession {
  const s = getOrCreateControlSession(practiceId, callId);
  s.status = 'staff';
  s.staffUserId = userId;
  s.updatedAt = now();
  return s;
}

export function resumeAi(practiceId: string, callId: string, _userId: string): ControlSession {
  const s = getOrCreateControlSession(practiceId, callId);
  s.status = 'ai';
  s.staffUserId = undefined;
  s.updatedAt = now();
  return s;
}

export function endCall(practiceId: string, callId: string, _userId: string): ControlSession {
  const s = getOrCreateControlSession(practiceId, callId);
  s.status = 'ended';
  s.updatedAt = now();
  return s;
}
