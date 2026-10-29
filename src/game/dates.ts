/**
 * Calendar helpers. Dates are local civil dates written 'YYYY-MM-DD'; arithmetic goes through UTC day numbers
 * so daylight-saving changes can never skip or repeat a day.
 */
export type DateKey = string;

const pad = (n: number) => String(n).padStart(2, '0');
const KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function dateKey(d: Date = new Date()): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isDateKey(s: unknown): s is DateKey {
  if (typeof s !== 'string') return false;
  const m = KEY_RE.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
}

/** Whole days since 1970-01-01 for a civil date. */
export function dayNumber(key: DateKey): number {
  const m = KEY_RE.exec(key);
  if (!m || !isDateKey(key)) throw new RangeError(`invalid date key "${key}"`);
  return Math.round(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000);
}

export function fromDayNumber(n: number): DateKey {
  const t = new Date(n * 86_400_000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function addDays(key: DateKey, n: number): DateKey {
  return fromDayNumber(dayNumber(key) + n);
}

export function daysBetween(a: DateKey, b: DateKey): number {
  return dayNumber(b) - dayNumber(a);
}

/** ISO weekday index: 0 = Monday … 6 = Sunday. (1970-01-01 was a Thursday.) */
export function weekday(key: DateKey): number {
  return (((dayNumber(key) + 3) % 7) + 7) % 7;
}

/** The Monday that starts the week containing `key`; used as the week's identifier. */
export function weekStart(key: DateKey): DateKey {
  return addDays(key, -weekday(key));
}

export function todayNumber(now: number = Date.now()): number {
  return dayNumber(dateKey(new Date(now)));
}
