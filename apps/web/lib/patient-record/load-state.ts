import { ApiError } from '../http/api-error';

export type LoadFailure = 'unauthorized' | 'forbidden' | 'not_found' | 'network' | 'server';

export type SectionState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T; isEmpty: boolean }
  | { status: 'error'; reason: LoadFailure };

export type SectionResponse<T> =
  | { kind: 'data'; data: T }
  | { kind: 'empty' }
  | { kind: 'error'; reason: LoadFailure };

export function classifyHttpStatus(status: number): 'ok' | LoadFailure {
  if (status >= 200 && status < 300) return 'ok';
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  return 'server';
}

/**
 * Interprets a record/section response. "Nothing saved yet" (404, or a 200 whose
 * body is empty / `null` — Nest sends an empty body when a handler returns null)
 * is `empty`, which callers render as an editable blank record. Anything else
 * non-2xx is an `error`, which must never be rendered as blank-and-editable or a
 * save could overwrite real data.
 */
export async function readSectionResponse<T>(res: Response): Promise<SectionResponse<T>> {
  const outcome = classifyHttpStatus(res.status);
  if (outcome === 'not_found') return { kind: 'empty' };
  if (outcome !== 'ok') return { kind: 'error', reason: outcome };

  const text = await res.text().catch(() => '');
  if (!text.trim()) return { kind: 'empty' };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { kind: 'error', reason: 'server' };
  }
  if (parsed === null || typeof parsed !== 'object') return { kind: 'empty' };
  return { kind: 'data', data: parsed as T };
}

export function failureFromError(err: unknown): LoadFailure {
  if (err instanceof ApiError) {
    const outcome = classifyHttpStatus(err.status);
    return outcome === 'ok' ? 'server' : outcome;
  }
  return 'network';
}

export function canEdit(state: SectionState<unknown>): boolean {
  return state.status === 'ready';
}

export function readyState<T>(data: T, isEmpty: boolean): SectionState<T> {
  return { status: 'ready', data, isEmpty };
}
