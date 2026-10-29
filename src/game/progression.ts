/**
 * Rewards and progression. Nothing here pays for speed: XP comes from completing puzzles, finding bonus words,
 * discovering new vocabulary, playing precisely and answering questions about what was learned.
 */
import { accuracy, targetsOf, type SessionState } from '../engine/session';
import type { Puzzle } from '../engine/types';

export const FREE_HINTS = 2;
export const HINT_COST = 10; // coins per hint beyond the free ones
export const PRECISION_ACCURACY = 0.8;
export const QUIZ_STAR_RATIO = 0.6;
export const PRACTICE_XP_SCALE = 0.6;

/** True when the player was accurate and mostly unassisted: the second star. */
export function precisionMet(s: SessionState): boolean {
  return accuracy(s) >= PRECISION_ACCURACY && s.hintsUsed <= FREE_HINTS;
}

export function hintCost(s: Pick<SessionState, 'hintsUsed'>): number {
  return s.hintsUsed < FREE_HINTS ? 0 : HINT_COST;
}

export interface XpBreakdown {
  base: number;
  bonusWords: number;
  precision: number;
  unassisted: number;
  discovery: number;
  total: number;
}

export interface CompletionInput {
  puzzle: Puzzle;
  session: SessionState;
  /** Words found for the very first time in this puzzle (targets and bonus words). */
  newWords: number;
}

const scale = (n: number, k: number) => Math.round(n * k);

export function completionXp({ puzzle, session, newWords }: CompletionInput): XpBreakdown {
  const targets = targetsOf(puzzle).length;
  const k = puzzle.spec.mode === 'practice' ? PRACTICE_XP_SCALE : 1;
  const base = scale((30 + 5 * targets) * puzzle.params.xpMultiplier, k);
  const bonusWords = scale(session.bonusFound.length * 15, k);
  const precision = precisionMet(session) ? scale(base * 0.2, 1) : 0;
  const unassisted = session.hintsUsed === 0 ? scale(base * 0.1, 1) : 0;
  const discovery = scale(newWords * 4, k);
  return { base, bonusWords, precision, unassisted, discovery, total: base + bonusWords + precision + unassisted + discovery };
}

/** A timed challenge that runs out still teaches: partial credit for what was found. */
export function consolationXp(session: SessionState, newWords: number): number {
  return session.found.length * 3 + session.bonusFound.length * 5 + newWords * 4;
}

/** Stars earned from play alone (before any Fact Challenge): 1 for finishing, 2 for precision. */
export function starsBeforeQuiz(s: SessionState): 1 | 2 {
  return precisionMet(s) ? 2 : 1;
}

/** The third star comes from the Fact Challenge: knowing what you found, not just where it was. */
export function starsAfterQuiz(pre: 1 | 2 | 3, quizRatio: number | null): 1 | 2 | 3 {
  if (pre === 3) return 3;
  return quizRatio !== null && quizRatio >= QUIZ_STAR_RATIO ? ((pre + 1) as 2 | 3) : pre;
}

export function coinsForCompletion(stars: number, bonusFound: number): number {
  return 5 + stars * 2 + bonusFound * 2;
}

export interface Reward {
  xp: number;
  coins: number;
}

/** Fact Challenge: 10 XP and a coin per correct answer, plus a bonus for a perfect round of 3+ questions. */
export function quizRewards(correct: number, total: number): Reward {
  const perfect = total >= 3 && correct === total;
  return { xp: correct * 10 + (perfect ? 20 : 0), coins: correct + (perfect ? 3 : 0) };
}

/** Smart Review: slightly lighter, since the words were already seen once. */
export function reviewRewards(correct: number, total: number): Reward {
  const perfect = total >= 5 && correct === total;
  return { xp: correct * 8 + (perfect ? 15 : 0), coins: Math.floor(correct / 2) + (perfect ? 2 : 0) };
}

/** Knowledge points shown on the Fact Challenge card. */
export function knowledgePoints(correct: number): number {
  return correct * 10;
}

/* ──────────────────────────────── ranks ──────────────────────────────── */

export const RANK_TITLES = [
  'Newcomer',
  'Curious Mind',
  'Word Seeker',
  'Pathfinder',
  'Reader',
  'Scholar',
  'Analyst',
  'Savant',
  'Sage',
  'Polymath',
  'Luminary',
  'Laureate',
] as const;

const RANK_FLOORS = [0, 200, 600, 1300, 2400, 4000, 6300, 9500, 14000, 20000, 28000, 38000];
const RANK_STEP_BEYOND = 12000;

export interface Rank {
  index: number; // 0-based
  title: string;
  floor: number;
  next: number; // XP at which the next rank begins
  progress: number; // 0–1 through the current rank
}

function rankFloor(index: number): number {
  return index < RANK_FLOORS.length ? RANK_FLOORS[index] : RANK_FLOORS[RANK_FLOORS.length - 1] + (index - (RANK_FLOORS.length - 1)) * RANK_STEP_BEYOND;
}

export function rankFor(xp: number): Rank {
  const x = Math.max(0, Math.floor(xp) || 0);
  let index = 0;
  while (rankFloor(index + 1) <= x) index++;
  const floor = rankFloor(index);
  const next = rankFloor(index + 1);
  const title = index < RANK_TITLES.length ? RANK_TITLES[index] : `${RANK_TITLES[RANK_TITLES.length - 1]} ${index - RANK_TITLES.length + 2}`;
  return { index, title, floor, next, progress: (x - floor) / (next - floor) };
}

export function rankTitle(index: number): string {
  return index < RANK_TITLES.length ? RANK_TITLES[index] : `${RANK_TITLES[RANK_TITLES.length - 1]} ${index - RANK_TITLES.length + 2}`;
}

/* ─────────────────────────────── unlockables ─────────────────────────────── */

export interface Unlockable {
  id: string;
  name: string;
  blurb: string;
  rank: number; // minimum rank index
}

export const GRID_THEMES: Unlockable[] = [
  { id: 'ivory', name: 'Ivory', blurb: 'Warm paper with navy ink.', rank: 0 },
  { id: 'midnight', name: 'Midnight', blurb: 'Deep navy with soft gold letters.', rank: 1 },
  { id: 'parchment', name: 'Parchment', blurb: 'Aged paper and sepia ink.', rank: 2 },
  { id: 'slate', name: 'Slate', blurb: 'Cool charcoal with pale type.', rank: 3 },
  { id: 'sage', name: 'Sage', blurb: 'Muted green, quiet and calm.', rank: 5 },
  { id: 'dusk', name: 'Dusk', blurb: 'Plum twilight with rose accents.', rank: 7 },
  { id: 'ink', name: 'Ink', blurb: 'Near-black with crisp white letters.', rank: 9 },
];

export const HIGHLIGHT_STYLES: Unlockable[] = [
  { id: 'capsule', name: 'Capsule', blurb: 'A soft rounded band over the word.', rank: 0 },
  { id: 'marker', name: 'Marker', blurb: 'A translucent highlighter stroke.', rank: 2 },
  { id: 'underline', name: 'Underline', blurb: 'A confident line beneath the letters.', rank: 4 },
  { id: 'outline', name: 'Outline', blurb: 'A thin gold frame, letters left clear.', rank: 6 },
  { id: 'glow', name: 'Glow', blurb: 'A gentle halo around the word.', rank: 8 },
];

export function isUnlocked(item: Unlockable, xp: number): boolean {
  return rankFor(xp).index >= item.rank;
}

/** Everything newly available when XP moves from `before` to `after`. */
export function newUnlocks(before: number, after: number): Unlockable[] {
  const a = rankFor(before).index;
  const b = rankFor(after).index;
  if (b <= a) return [];
  return [...GRID_THEMES, ...HIGHLIGHT_STYLES].filter((u) => u.rank > a && u.rank <= b);
}
