/**
 * The shape of everything WordWise saves. Plain JSON-serialisable data only, so it can live in localStorage,
 * be exported and re-imported, and be validated on load (see storage.ts).
 */
import type { Puzzle, PuzzleMode } from '../engine/types';
import type { SessionState } from '../engine/session';
import type { DateKey } from './dates';
import type { Question } from './quiz';
import type { WordRecord } from './srs';
import type { ActivityMap } from './streaks';
import type { XpBreakdown } from './progression';
import { CONTENT_VERSION } from '../content';

export const APP_ID = 'wordwise';
export const SAVE_VERSION = 1;

/* ─────────────────────────────── settings ─────────────────────────────── */

export type ThemeMode = 'system' | 'light' | 'dark';
export type TextSize = 'small' | 'medium' | 'large' | 'xlarge';
export type MotionPref = 'system' | 'reduce' | 'full';

export const THEME_MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];
export const TEXT_SIZES: readonly TextSize[] = ['small', 'medium', 'large', 'xlarge'];
export const MOTION_PREFS: readonly MotionPref[] = ['system', 'reduce', 'full'];

export interface Settings {
  theme: ThemeMode;
  textSize: TextSize;
  motion: MotionPref;
  highContrast: boolean;
  /** Use a plain sans-serif everywhere instead of the editorial serif. */
  plainFont: boolean;
  sound: boolean;
  sfxVolume: number; // 0–1
  music: boolean;
  musicVolume: number; // 0–1
  haptics: boolean;
  showTimer: boolean;
  /** Hides the timer, in-play toasts and score chrome so only the grid and word list remain. */
  focusMode: boolean;
  /** Show a "learn" card the moment a word is found. */
  learnToasts: boolean;
  /** Expert Challenges run against a clock; turn off for an untimed version. */
  expertTimed: boolean;
  gridTheme: string;
  highlightStyle: string;
  /** Category ids included in campaign rotation; null means all of them. */
  enabledCategories: string[] | null;
}

export function defaultSettings(): Settings {
  return {
    theme: 'system',
    textSize: 'medium',
    motion: 'system',
    highContrast: false,
    plainFont: false,
    sound: true,
    sfxVolume: 0.6,
    music: false,
    musicVolume: 0.35,
    haptics: true,
    showTimer: false,
    focusMode: false,
    learnToasts: true,
    expertTimed: true,
    gridTheme: 'ivory',
    highlightStyle: 'capsule',
    enabledCategories: null,
  };
}

/* ──────────────────────────────── stats ──────────────────────────────── */

export interface CategoryStats {
  puzzles: number;
  found: number;
  quizCorrect: number;
  quizTotal: number;
}

export interface Stats {
  xp: number;
  coins: number;
  stars: number;
  puzzles: number;
  wordsFound: number; // every find, including repeats of a known word
  bonusFound: number;
  attempts: number;
  misses: number;
  hints: number;
  playMs: number;
  quizzes: number; // Fact Challenges finished
  quizAnswered: number;
  quizCorrect: number;
  perfectQuizzes: number;
  reviews: number; // Smart Review sessions finished
  reviewAnswered: number;
  reviewCorrect: number;
  dailyDone: number;
  expertDone: number;
  focusDone: number;
  cleanSweeps: number; // puzzles with zero wrong selections
  unassisted: number; // puzzles with zero hints
  threeStars: number;
  bestDailyStreak: number;
  bestWeeklyStreak: number;
  byCategory: Record<string, CategoryStats>;
}

export function emptyStats(): Stats {
  return {
    xp: 0,
    coins: 0,
    stars: 0,
    puzzles: 0,
    wordsFound: 0,
    bonusFound: 0,
    attempts: 0,
    misses: 0,
    hints: 0,
    playMs: 0,
    quizzes: 0,
    quizAnswered: 0,
    quizCorrect: 0,
    perfectQuizzes: 0,
    reviews: 0,
    reviewAnswered: 0,
    reviewCorrect: 0,
    dailyDone: 0,
    expertDone: 0,
    focusDone: 0,
    cleanSweeps: 0,
    unassisted: 0,
    threeStars: 0,
    bestDailyStreak: 0,
    bestWeeklyStreak: 0,
    byCategory: {},
  };
}

/* ───────────────────────────── progress records ───────────────────────────── */

export interface Campaign {
  /** The next level to play. */
  level: number;
  /** Best stars per completed level (key = level). */
  stars: Record<string, number>;
}

export interface JourneyProgress {
  /** Index of the next step to play; equals the step count once all are done. */
  next: number;
  stars: number[];
  /** Mastery challenge passed. */
  mastery: boolean;
  masteryAttempts: number;
}

export interface DailyResult {
  score: number;
  stars: number;
  xp: number;
  words: string[];
  quizCorrect: number;
  quizTotal: number;
  completedAt: number;
}

/* ───────────────────────────── in-flight state ───────────────────────────── */

export interface ActiveGame {
  puzzle: Puzzle;
  state: SessionState;
  startedAt: number;
  paused: boolean;
  /** Words found for the first time during this puzzle (for the discovery bonus). */
  fresh: string[];
  /** Time limit for timed challenges; null for untimed play. */
  limitMs: number | null;
}

export interface QuizState {
  kind: 'fact' | 'mastery';
  questions: Question[];
  /** question id → chosen option id */
  answers: Record<string, string>;
  /** Set once every question is answered and the rewards have been granted. */
  done: boolean;
  correct: number;
  attempt: number;
}

export interface Summary {
  id: string;
  puzzleId: string;
  mode: PuzzleMode;
  level: number;
  title: string;
  theme: string;
  categoryId: string;
  topicId: string;
  journeyId?: string;
  journeyStep?: number;
  mastery?: boolean;
  dailyKey?: DateKey;
  outcome: 'complete' | 'timeout';
  completedAt: number;
  elapsedMs: number;
  accuracy: number;
  hints: number;
  misses: number;
  attempts: number;
  words: Array<{ entryId: string; bonus: boolean; isNew: boolean }>;
  xp: XpBreakdown | null;
  /** Running total of XP granted for this puzzle, including the Fact Challenge. */
  xpTotal: number;
  coins: number;
  starsPre: number;
  stars: number;
  quiz: QuizState | null;
  rankBefore: number;
  rankAfter: number;
  unlocked: string[];
  streak: number;
  dailyScore?: number;
  /** Mastery challenge result once its quiz is finished. */
  masteryResult?: 'pass' | 'fail';
  journeyDone?: boolean;
}

export interface ReviewSession {
  startedAt: number;
  questions: Question[];
  answers: Record<string, string>;
  done: boolean;
  correct: number;
  xp: number;
  coins: number;
}

/* ───────────────────────────────── root ───────────────────────────────── */

export interface SaveData {
  app: typeof APP_ID;
  v: number;
  contentVersion: number;
  createdAt: number;
  updatedAt: number;
  onboarded: boolean;
  settings: Settings;
  stats: Stats;
  words: Record<string, WordRecord>;
  campaign: Campaign;
  journeys: Record<string, JourneyProgress>;
  daily: Record<DateKey, DailyResult>;
  activity: ActivityMap;
  /** achievement id → unlock time */
  achievements: Record<string, number>;
  /** Badges unlocked but not yet shown to the player. */
  unseenBadges: string[];
  game: ActiveGame | null;
  summary: Summary | null;
  review: ReviewSession | null;
  /** Raw JSON of imported content packs, re-validated on every load. */
  packs: unknown[];
  /** Counter that keeps practice and expert seeds fresh. */
  serial: number;
}

export function emptySave(now: number = Date.now()): SaveData {
  return {
    app: APP_ID,
    v: SAVE_VERSION,
    contentVersion: CONTENT_VERSION,
    createdAt: now,
    updatedAt: now,
    onboarded: false,
    settings: defaultSettings(),
    stats: emptyStats(),
    words: {},
    campaign: { level: 1, stars: {} },
    journeys: {},
    daily: {},
    activity: {},
    achievements: {},
    unseenBadges: [],
    game: null,
    summary: null,
    review: null,
    packs: [],
    serial: 0,
  };
}
