/**
 * Daily Brain Challenge and Word of the Day.
 * Everything here is a pure function of the calendar date and the shipped (built-in) content, so every player
 * gets the same puzzle, the same questions and the same word on the same day. Imported packs, settings and
 * personal progress deliberately play no part.
 */
import { getBuiltinCategories } from '../content';
import type { Entry } from '../content/schema';
import { Rng } from '../engine/rng';
import type { PuzzleSpec } from '../engine/types';
import { dayNumber, weekday, type DateKey } from './dates';

export const DAILY_QUIZ_QUESTIONS = 5;

/** Monday … Sunday: the week builds toward Saturday and Sunday is a gentler day. */
const DAILY_LEVELS = [14, 16, 18, 21, 24, 28, 12];

export function dailyLevel(key: DateKey): number {
  return DAILY_LEVELS[weekday(key)];
}

let order: string[] | null = null;

/** Built-in categories in a fixed, shuffled order; the daily puzzle cycles through them. */
export function dailyCategoryOrder(): string[] {
  if (!order) {
    const ids = getBuiltinCategories().map((c) => c.id).sort();
    order = new Rng('wordwise|daily-order').shuffle(ids);
  }
  return order;
}

export function dailyCategory(key: DateKey): string {
  const o = dailyCategoryOrder();
  return o[((dayNumber(key) % o.length) + o.length) % o.length];
}

export function dailySeed(key: DateKey): string {
  return `wordwise|daily|${key}`;
}

export function dailySpec(key: DateKey): PuzzleSpec {
  return { seed: dailySeed(key), mode: 'daily', level: dailyLevel(key), categoryId: dailyCategory(key) };
}

export function dailyQuizSeed(key: DateKey): string {
  return `wordwise|daily-quiz|${key}`;
}

let wotdEntries: Entry[] | null = null;
const wotdCycles = new Map<number, string[]>();

/** One word per day, never repeating within a cycle through the whole built-in vocabulary. */
export function wordOfTheDay(key: DateKey): Entry {
  wotdEntries ??= getBuiltinCategories()
    .flatMap((c) => c.entries)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
  const entries = wotdEntries;
  const n = entries.length;
  const d = dayNumber(key);
  const cycle = Math.floor(d / n);
  let ids = wotdCycles.get(cycle);
  if (!ids) {
    ids = new Rng(`wordwise|wotd|${cycle}`).shuffle(entries.map((e) => e.id));
    wotdCycles.set(cycle, ids);
  }
  const id = ids[((d % n) + n) % n];
  return entries.find((e) => e.id === id)!;
}

export interface DailyScoreInput {
  accuracy: number; // 0–1
  bonusFound: number;
  hints: number;
  quizCorrect: number;
}

/** Daily score: accuracy, bonus words and what you learned. Time is never a factor. */
export function dailyScore({ accuracy, bonusFound, hints, quizCorrect }: DailyScoreInput): number {
  const a = Math.min(1, Math.max(0, accuracy));
  const penalty = Math.min(150, hints * 15);
  return Math.max(0, 400 + Math.round(200 * a * a) + bonusFound * 30 - penalty + quizCorrect * 60);
}

export const DAILY_MAX_SCORE = 400 + 200 + 3 * 30 + DAILY_QUIZ_QUESTIONS * 60;
