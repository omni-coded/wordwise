/**
 * Smart Review: a Leitner-box spaced-repetition scheduler.
 * A word starts in box 0. Each correct review moves it up a box and schedules the next review further out;
 * a wrong answer sends it back to box 0, due immediately.
 */
export const BOX_INTERVALS_DAYS = [0, 1, 3, 7, 16, 35] as const;
export const MAX_BOX = BOX_INTERVALS_DAYS.length - 1;

export type WordState = 'new' | 'learning' | 'familiar' | 'mastered';

export interface WordRecord {
  firstFound: number; // epoch ms
  timesFound: number; // appearances found in puzzles
  box: number; // 0 … MAX_BOX
  due: number; // day number when the next review is due
  right: number;
  wrong: number;
  last?: number; // day number of the last review
  favorite: boolean;
}

export function newRecord(today: number, now: number): WordRecord {
  return { firstFound: now, timesFound: 1, box: 0, due: today + 1, right: 0, wrong: 0, favorite: false };
}

/** Registers a word being found in a puzzle (creating its record the first time). */
export function recordFind(rec: WordRecord | undefined, today: number, now: number): WordRecord {
  return rec ? { ...rec, timesFound: rec.timesFound + 1 } : newRecord(today, now);
}

/**
 * Applies a quiz or review answer. A correct answer only advances the box when the word was actually due (or had
 * never been tested), so repeating a quiz cannot be used to farm progress. A wrong answer always resets it.
 */
export function review(rec: WordRecord, correct: boolean, today: number): WordRecord {
  if (!correct) return { ...rec, box: 0, due: today, wrong: rec.wrong + 1, last: today };
  const eligible = rec.due <= today || rec.last === undefined;
  if (!eligible) return { ...rec, right: rec.right + 1, last: today };
  const box = Math.min(MAX_BOX, rec.box + 1);
  return { ...rec, box, due: today + BOX_INTERVALS_DAYS[box], right: rec.right + 1, last: today };
}

export function isDue(rec: WordRecord | undefined, today: number): boolean {
  return !!rec && rec.due <= today;
}

/** Ids of words due for review, most overdue and weakest first. */
export function dueList(words: Record<string, WordRecord>, today: number, limit = 10): string[] {
  return Object.entries(words)
    .filter(([, r]) => r.due <= today)
    .sort(([ia, a], [ib, b]) => a.due - b.due || a.box - b.box || ia.localeCompare(ib))
    .slice(0, limit)
    .map(([id]) => id);
}

export function dueCount(words: Record<string, WordRecord>, today: number): number {
  let n = 0;
  for (const r of Object.values(words)) if (r.due <= today) n++;
  return n;
}

export function wordState(rec?: WordRecord): WordState {
  if (!rec) return 'new';
  if (rec.box >= 4) return 'mastered';
  if (rec.box >= 2) return 'familiar';
  return 'learning';
}

const WEIGHTS = [0.25, 0.5, 0.7, 0.85, 1, 1];

/** 0 for an unseen word, rising to 1 as it climbs the boxes. */
export function masteryWeight(rec?: WordRecord): number {
  return rec ? WEIGHTS[Math.min(MAX_BOX, Math.max(0, rec.box))] : 0;
}

export interface Mastery {
  percent: number; // 0–100
  discovered: number;
  mastered: number;
  total: number;
  title: string;
}

export const MASTERY_TITLES: Array<{ min: number; title: string }> = [
  { min: 90, title: 'Master' },
  { min: 75, title: 'Scholar' },
  { min: 50, title: 'Adept' },
  { min: 25, title: 'Apprentice' },
  { min: 0, title: 'Novice' },
];

export function masteryTitle(percent: number): string {
  return MASTERY_TITLES.find((t) => percent >= t.min)!.title;
}

export function masteryOf(entryIds: readonly string[], words: Record<string, WordRecord>): Mastery {
  let sum = 0;
  let discovered = 0;
  let mastered = 0;
  for (const id of entryIds) {
    const r = words[id];
    if (r) discovered++;
    if (r && r.box >= 4) mastered++;
    sum += masteryWeight(r);
  }
  const percent = entryIds.length ? Math.round((sum / entryIds.length) * 100) : 0;
  return { percent, discovered, mastered, total: entryIds.length, title: masteryTitle(percent) };
}
