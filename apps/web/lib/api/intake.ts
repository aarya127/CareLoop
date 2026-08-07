import { api } from '@/lib/api';
import type { IntakeDraft, IntakeDraftData, IntakeSubmitResult } from '@/types/intake';

export const intakeApi = {
  /** Exchange a signed clinic link for a new draft capability. */
  async createDraft(linkToken: string): Promise<IntakeDraft> {
    const draft = await api.post<IntakeDraft>('/intake/drafts', { linkToken });
    if (draft.accessToken && typeof window !== 'undefined') {
      sessionStorage.setItem(`intake-token-${draft.id}`, draft.accessToken);
    }
    return draft;
  },

  /** Fetch a draft by id */
  getDraft(id: string): Promise<IntakeDraft> {
    return api.get<IntakeDraft>(`/intake/drafts/${id}`, { headers: intakeHeaders(id) });
  },

  /** Partial-update (auto-save) one or more sections */
  updateDraft(id: string, data: Partial<IntakeDraftData>): Promise<IntakeDraft> {
    return api.patch<IntakeDraft>(`/intake/drafts/${id}`, data, { headers: intakeHeaders(id) });
  },

  /**
   * Submit a draft — idempotent via Idempotency-Key header.
   * Caller must provide a stable idempotencyKey (e.g. crypto.randomUUID stored in localStorage).
   */
  submitDraft(id: string, idempotencyKey: string): Promise<IntakeSubmitResult> {
    return api.post<IntakeSubmitResult>(
      `/intake/drafts/${id}/submit`,
      {},
      { headers: { ...intakeHeaders(id), 'Idempotency-Key': idempotencyKey } },
    );
  },
};

function intakeHeaders(id: string): Record<string, string> {
  const token = typeof window !== 'undefined' ? sessionStorage.getItem(`intake-token-${id}`) : null;
  return token ? { 'X-Intake-Token': token } : {};
}
