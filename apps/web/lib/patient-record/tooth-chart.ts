import type { ToothRecord } from '../types/dental-record';

export const ADULT_TEETH = Array.from({ length: 32 }, (_, i) => i + 1);

/** Union of base and EMR-charted teeth keyed by tooth number; the EMR entry wins. */
export function mergeToothChart(
  baseTeeth: ToothRecord[],
  emrByNumber: Map<number, ToothRecord>,
): ToothRecord[] {
  const byNumber = new Map(baseTeeth.map((t) => [t.tooth_number, t]));
  for (const [num, tooth] of emrByNumber) byNumber.set(num, tooth);
  return [...byNumber.values()].sort((a, b) => a.tooth_number - b.tooth_number);
}

/** Always 32 slots; `null` means "not charted" — never assume a tooth is healthy. */
export function buildArch(
  teeth: ToothRecord[],
): Array<{ tooth_number: number; tooth: ToothRecord | null }> {
  const byNumber = new Map(teeth.map((t) => [t.tooth_number, t]));
  return ADULT_TEETH.map((n) => ({ tooth_number: n, tooth: byNumber.get(n) ?? null }));
}

export function upsertTooth(teeth: ToothRecord[], next: ToothRecord): ToothRecord[] {
  const exists = teeth.some((t) => t.tooth_number === next.tooth_number);
  const updated = exists
    ? teeth.map((t) => (t.tooth_number === next.tooth_number ? next : t))
    : [...teeth, next];
  return updated.sort((a, b) => a.tooth_number - b.tooth_number);
}

/**
 * Teeth whose persisted form differs between `prev` and `next` (including newly
 * charted teeth and changes back to "healthy"). `toPersisted` is the EMR DTO
 * mapping, injected so this stays free of network code.
 */
export function teethToUpsert(
  prev: ToothRecord[],
  next: ToothRecord[],
  toPersisted: (t: ToothRecord) => unknown,
): ToothRecord[] {
  const prevByNum = new Map(prev.map((t) => [t.tooth_number, t]));
  return next.filter((t) => {
    const old = prevByNum.get(t.tooth_number);
    return !old || JSON.stringify(toPersisted(old)) !== JSON.stringify(toPersisted(t));
  });
}
