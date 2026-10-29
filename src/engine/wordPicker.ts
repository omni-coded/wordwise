import type { DifficultyParams, PoolEntry } from './types';
import type { Rng } from './rng';
import { wordsConflict } from './validator';

export interface PickInput {
  pool: PoolEntry[];
  params: DifficultyParams;
  rng: Rng;
  topicId?: string;
  /** Weight multiplier for words in `topicId` (default 4). */
  topicBoost?: number;
  mustInclude?: string[];
  deprioritize?: ReadonlySet<string>;
  /** Hard cap on target words (e.g. pool smaller than the level wants). */
  maxTargets?: number;
}

export interface PickResult {
  targets: PoolEntry[];
  bonus: PoolEntry[];
}

/**
 * Chooses the hidden vocabulary: weighted by vocabulary difficulty, preferred
 * length and topic, skipping words that could be confused with each other
 * (substrings, mirrors) and respecting the grid's letter budget.
 */
export function pickWords(input: PickInput): PickResult {
  const { pool, params, rng } = input;
  const size = params.gridSize;
  const budget = Math.floor(size * size * params.maxDensity);
  const want = Math.min(params.wordCount, input.maxTargets ?? params.wordCount);

  const boost = input.topicBoost ?? 4;
  // Words from the focus topic may run a little longer than the level's usual window, so a themed puzzle
  // is not starved of its own vocabulary at low levels.
  const fitsGrid = (e: PoolEntry) => {
    const topical = !!input.topicId && e.topic === input.topicId;
    const cap = topical ? Math.min(params.maxLen + 3, size - 1) : Math.min(params.maxLen, size - 1);
    return e.word.length >= 4 && e.word.length <= cap;
  };
  let candidates = pool.filter(fitsGrid);
  // If the length window is too tight for this category, relax it up to the grid size.
  if (candidates.length < want + params.bonusCount + 2) {
    candidates = pool.filter((e) => e.word.length >= 4 && e.word.length <= size - 1);
  }

  // A strong topic focus (journeys) lets the theme outweigh the level's preferred word length and difficulty;
  // the default gentle nudge (campaign) leaves difficulty targeting in charge.
  const strongFocus = boost >= 8;
  const weight = (e: PoolEntry): number => {
    const topical = !!input.topicId && e.topic === input.topicId;
    const dv = e.difficulty - params.vocabTarget;
    let vocabFactor = Math.exp(-(dv * dv) / (2 * 0.85 * 0.85)) + 0.03;
    const dl = e.word.length - params.targetLen;
    let lenFactor = Math.exp(-(dl * dl) / (2 * 2.2 * 2.2)) + 0.05;
    if (topical && strongFocus) {
      vocabFactor = Math.max(vocabFactor, 0.5);
      lenFactor = Math.max(lenFactor, 0.5);
    }
    let w = vocabFactor * lenFactor;
    if (e.word.length < params.minLen) w *= 0.25;
    if (topical) w *= boost;
    if (input.deprioritize?.has(e.id)) w *= 0.45;
    return w * (0.7 + 0.6 * rng.next());
  };

  const targets: PoolEntry[] = [];
  let cells = 0;
  const take = (e: PoolEntry, cap: number, into: PoolEntry[], all: PoolEntry[]): boolean => {
    if (all.some((x) => wordsConflict(x.word, e.word))) return false;
    if (cells + e.word.length > cap) return false;
    into.push(e);
    all.push(e);
    cells += e.word.length;
    return true;
  };

  const chosen: PoolEntry[] = [];
  let remaining = candidates.slice();
  for (const id of input.mustInclude ?? []) {
    const e = remaining.find((x) => x.id === id);
    if (e && targets.length < want) {
      take(e, budget + 6, targets, chosen);
      remaining = remaining.filter((x) => x.id !== id);
    }
  }
  // Words that did not fit the target budget are kept back: they may still fit as (shorter-cap) bonus words.
  const skipped: PoolEntry[] = [];
  while (targets.length < want && remaining.length > 0) {
    const idx = rng.weightedIndex(remaining.map(weight));
    const [e] = remaining.splice(idx, 1);
    if (!take(e, budget, targets, chosen)) skipped.push(e);
  }
  remaining = remaining.concat(skipped);

  // Bonus words: shorter, easier to stumble on, never ambiguous with the list.
  const bonus: PoolEntry[] = [];
  const bonusWeight = (e: PoolEntry) => {
    const lenW = e.word.length <= 8 ? 1 : 0.35;
    const dv = e.difficulty - params.vocabTarget;
    return (Math.exp(-(dv * dv) / (2 * 1.1 * 1.1)) + 0.05) * lenW * (0.6 + 0.8 * rng.next());
  };
  while (bonus.length < params.bonusCount && remaining.length > 0) {
    const idx = rng.weightedIndex(remaining.map(bonusWeight));
    const [e] = remaining.splice(idx, 1);
    take(e, budget + 14, bonus, chosen);
  }
  return { targets, bonus };
}

/** Which target words are shown as definitions instead of terms. */
export function pickClueIds(targets: PoolEntry[], mode: DifficultyParams['clueMode'], rng: Rng): string[] {
  if (mode === 'none') return [];
  if (mode === 'full') return targets.map((t) => t.id);
  const k = Math.max(2, Math.round(targets.length * 0.4));
  return rng.shuffle(targets).slice(0, k).map((t) => t.id);
}
