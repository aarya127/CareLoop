/**
 * Voice orchestrator stub — delegates to the configured provider (vapi/retell/pipecat).
 * Real implementation lives in the API service; this client-side module is a placeholder.
 */

export interface StartCallOptions {
  orchestrator?: 'vapi' | 'retell' | 'pipecat';
  to: string;
  patientId?: string;
  practiceId?: string;
}

export async function startVoiceCall(options: StartCallOptions): Promise<unknown> {
  throw new Error('Voice orchestrator not configured in this environment.');
}
