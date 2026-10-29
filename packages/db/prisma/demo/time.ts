// Calendar helpers that work in the practice's time zone regardless of the
// time zone of the machine running the seed.

export interface LocalDate {
  y: number;
  m: number; // 1-12
  d: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function zonedParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {
    y: get('year'),
    m: get('month'),
    d: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/** The calendar date it currently is in `timeZone`. */
export function localDateOf(date: Date, timeZone: string): LocalDate {
  const { y, m, d } = zonedParts(date, timeZone);
  return { y, m, d };
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const t = new Date(Date.UTC(date.y, date.m - 1, date.d) + days * DAY_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

/** 0 = Sunday … 6 = Saturday. */
export function dayOfWeek(date: LocalDate): number {
  return new Date(Date.UTC(date.y, date.m - 1, date.d)).getUTCDay();
}

export function isWeekday(date: LocalDate): boolean {
  const dow = dayOfWeek(date);
  return dow >= 1 && dow <= 5;
}

export function dayKey(date: LocalDate): string {
  return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
}

/** The instant at `minutes` past local midnight on `date` in `timeZone`. */
export function atLocal(date: LocalDate, minutes: number, timeZone: string): Date {
  const guess = Date.UTC(date.y, date.m - 1, date.d, Math.floor(minutes / 60), minutes % 60);
  const p = zonedParts(new Date(guess), timeZone);
  const offset = Date.UTC(p.y, p.m - 1, p.d, p.hour, p.minute, p.second) - guess;
  return new Date(guess - offset);
}

export const addMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60_000);
export const addMs = (date: Date, ms: number) => new Date(date.getTime() + ms);
export { DAY_MS };
