import { api } from '@/lib/api';
import type { IntakeDraft, IntakeDraftData, IntakeSubmitResult } from '@/types/intake';

export const intakeApi = {
  /** Create a new blank draft */
  createDraft(practiceId = 'demo-practice'): Promise<IntakeDraft> {
    return api.post<IntakeDraft>('/intake/drafts', { practiceId });
  },

  /** Fetch a draft by id */
  getDraft(id: string): Promise<IntakeDraft> {
    return api.get<IntakeDraft>(`/intake/drafts/${id}`);
  },

  /** Partial-update (auto-save) one or more sections */
  updateDraft(id: string, data: Partial<IntakeDraftData>): Promise<IntakeDraft> {
    return api.patch<IntakeDraft>(`/intake/drafts/${id}`, data);
  },

  /**
   * Submit a draft — idempotent via Idempotency-Key header.
   * Caller must provide a stable idempotencyKey (e.g. crypto.randomUUID stored in localStorage).
   */
  submitDraft(id: string, idempotencyKey: string): Promise<IntakeSubmitResult> {
    return api.post<IntakeSubmitResult>(
      `/intake/drafts/${id}/submit`,
      {},
      { headers: { 'Idempotency-Key': idempotencyKey } },
    );
  },
};
