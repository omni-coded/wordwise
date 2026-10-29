import { addDays, dayNumber, fromDayNumber, isDateKey, weekStart, type DateKey } from './dates';

/** One entry per calendar day on which the player completed a puzzle or a review. */
export interface DayActivity {
  puzzles: number;
  reviews: number;
  xp: number;
}
export type ActivityMap = Record<DateKey, DayActivity>;

export const WEEKLY_ACTIVE_DAYS = 3;

const active = (a: ActivityMap, key: DateKey): boolean => {
  const d = a[key];
  return !!d && d.puzzles + d.reviews > 0;
};

/**
 * Consecutive active days ending today. A streak is still alive (but "at risk") if today has no activity yet
 * and yesterday had some; it is broken once a whole day is missed.
 */
export function dailyStreak(a: ActivityMap, today: DateKey): { current: number; status: 'active' | 'at-risk' | 'none' } {
  let cursor = today;
  let status: 'active' | 'at-risk' | 'none' = 'active';
  if (!active(a, cursor)) {
    cursor = addDays(today, -1);
    status = 'at-risk';
    if (!active(a, cursor)) return { current: 0, status: 'none' };
  }
  let n = 0;
  while (active(a, cursor)) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return { current: n, status };
}

/** Longest run of consecutive active days anywhere in the history. */
export function bestDailyStreak(a: ActivityMap): number {
  const days = Object.keys(a)
    .filter((k) => isDateKey(k) && active(a, k))
    .map(dayNumber)
    .sort((x, y) => x - y);
  let best = 0;
  let run = 0;
  let prev = -Infinity;
  for (const d of days) {
    run = d === prev + 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

function activeDaysByWeek(a: ActivityMap): Map<DateKey, number> {
  const weeks = new Map<DateKey, number>();
  for (const k of Object.keys(a)) {
    if (!isDateKey(k) || !active(a, k)) continue;
    const w = weekStart(k);
    weeks.set(w, (weeks.get(w) ?? 0) + 1);
  }
  return weeks;
}

/**
 * Consecutive weeks (Monday–Sunday) with at least three active days. The current week counts once it qualifies;
 * until then the streak is measured up to last week so a new week never shows an unfair reset.
 */
export function weeklyStreak(a: ActivityMap, today: DateKey): { current: number; thisWeekDays: number } {
  const weeks = activeDaysByWeek(a);
  const thisWeek = weekStart(today);
  const thisWeekDays = weeks.get(thisWeek) ?? 0;
  let cursor = thisWeekDays >= WEEKLY_ACTIVE_DAYS ? thisWeek : fromDayNumber(dayNumber(thisWeek) - 7);
  let n = 0;
  while ((weeks.get(cursor) ?? 0) >= WEEKLY_ACTIVE_DAYS) {
    n++;
    cursor = fromDayNumber(dayNumber(cursor) - 7);
  }
  return { current: n, thisWeekDays };
}

export function bestWeeklyStreak(a: ActivityMap): number {
  const weeks = [...activeDaysByWeek(a).entries()]
    .filter(([, n]) => n >= WEEKLY_ACTIVE_DAYS)
    .map(([w]) => dayNumber(w))
    .sort((x, y) => x - y);
  let best = 0;
  let run = 0;
  let prev = -Infinity;
  for (const w of weeks) {
    run = w === prev + 7 ? run + 1 : 1;
    if (run > best) best = run;
    prev = w;
  }
  return best;
}

/** Drops history older than `keepDays` so the save file cannot grow without bound. */
export function pruneActivity(a: ActivityMap, today: DateKey, keepDays = 800): ActivityMap {
  const min = dayNumber(today) - keepDays;
  const out: ActivityMap = {};
  for (const [k, v] of Object.entries(a)) if (isDateKey(k) && dayNumber(k) >= min) out[k] = v;
  return out;
}

export function addActivity(a: ActivityMap, key: DateKey, add: Partial<DayActivity>): ActivityMap {
  const cur = a[key] ?? { puzzles: 0, reviews: 0, xp: 0 };
  return {
    ...a,
    [key]: { puzzles: cur.puzzles + (add.puzzles ?? 0), reviews: cur.reviews + (add.reviews ?? 0), xp: cur.xp + (add.xp ?? 0) },
  };
}
