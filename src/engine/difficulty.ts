import type { ClueMode, DifficultyParams, Placement, Puzzle, SpecialKind } from './types';
import { cellsOf } from './validator';
import { DIRECTIONS } from './directions';

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const clamp01 = (x: number) => clamp(x, 0, 1);
const round1 = (x: number) => Math.round(x * 10) / 10;

/** Which special flavours a campaign level carries (deterministic, unbounded). */
export function levelSpecials(level: number): SpecialKind[] {
  const out: SpecialKind[] = [];
  if (level % 25 === 0) out.push('gauntlet');
  else if (level % 10 === 0) out.push('milestone');
  else if (level >= 11 && ((level - 1) % 10 === 0 || (level - 1) % 25 === 0)) out.push('relaxing');
  if (out.length === 0) {
    if (level >= 101 && level % 9 === 0) out.push('clue');
    else if (level >= 51 && level % 6 === 0) out.push('clue');
  }
  return out;
}

export function clueModeFor(level: number, specials: SpecialKind[]): ClueMode {
  if (!specials.includes('clue')) return 'none';
  return level >= 101 && level % 9 === 0 ? 'full' : 'partial';
}

export interface ParamOptions {
  expert?: boolean;
  mastery?: boolean;
  /** Journey puzzles ignore the campaign's special-level pattern. */
  ignoreSpecials?: boolean;
}

/**
 * Maps a level number to every knob that shapes a puzzle.
 * There is no upper bound: growth is smooth and saturating, so level 5,000
 * is as well-defined as level 5. Level 1 is Medium by design.
 */
export function paramsForLevel(level: number, opts: ParamOptions = {}): DifficultyParams {
  const L = Math.max(1, Math.floor(level));
  const specials: SpecialKind[] = opts.ignoreSpecials ? [] : levelSpecials(L);
  if (opts.mastery) specials.push('mastery');

  let eff = L;
  if (specials.includes('relaxing')) eff = Math.max(1, Math.round(L * 0.7));
  if (specials.includes('gauntlet')) eff = L + 8;
  if (specials.includes('milestone')) eff = L + 2;
  if (specials.includes('mastery')) eff = L + 12;

  // Past level ~100 the base ramp has saturated, so a slow logarithmic "tail"
  // keeps nudging directions, decoys and overlap upward forever.
  const tail = Math.max(0, Math.log2(Math.max(1, L) / 100));

  let size = Math.min(18, 12 + Math.floor(Math.log2(eff) * 1.1));
  const wordCount = Math.min(26, 11 + Math.floor((eff - 1) / 5)) + (specials.includes('milestone') ? 2 : 0);
  const bonusCount = 1 + (eff >= 10 ? 1 : 0) + (eff >= 60 ? 1 : 0);
  const minLen = 4 + (eff >= 40 ? 1 : 0) + (eff >= 100 ? 1 : 0) + (eff >= 400 ? 1 : 0);
  let vocabTarget = Math.min(4.8, 2.0 + eff * 0.035);
  let backProb = clamp(clamp(0.28 + eff * 0.007, 0.28, 0.66) + tail * 0.025, 0.28, 0.8);
  let diagProb = clamp(clamp(0.32 + eff * 0.006, 0.32, 0.68) + tail * 0.025, 0.32, 0.8);
  let decoyRate = clamp(clamp(0.1 + eff * 0.005, 0.1, 0.55) + tail * 0.015, 0.1, 0.65);
  let decoyFragments = clamp(Math.floor(eff / 5), 0, 20) + Math.round(tail * 3);
  const overlapPref = clamp(clamp(0.15 + eff * 0.005, 0.15, 0.7) + tail * 0.02, 0.15, 0.85);
  const targetLen = Math.min(10.5 + tail * 0.3, 6.2 + eff * 0.045);
  let xp = 1;
  if (specials.includes('relaxing')) xp *= 0.8;
  if (specials.includes('milestone')) xp *= 1.5;
  if (specials.includes('gauntlet')) xp *= 2;
  if (specials.includes('mastery')) xp *= 2;

  if (opts.expert) {
    size = Math.min(20, size + 2);
    vocabTarget = Math.min(5, vocabTarget + 0.6);
    backProb = clamp(backProb + 0.08, 0, 0.75);
    diagProb = clamp(diagProb + 0.06, 0, 0.75);
    decoyRate = clamp(decoyRate + 0.1, 0, 0.6);
    decoyFragments += 4;
    xp *= 1.5;
  }

  return {
    level: L,
    effectiveLevel: eff,
    gridSize: size,
    wordCount,
    bonusCount,
    minLen,
    maxLen: Math.min(size - 1, 9 + Math.floor(eff / 12)),
    targetLen,
    vocabTarget,
    backProb,
    diagProb,
    overlapPref,
    decoyRate,
    decoyFragments,
    maxDensity: 0.58 - (size - 12) * 0.01,
    specials,
    clueMode: opts.mastery ? 'partial' : opts.ignoreSpecials ? 'none' : clueModeFor(L, specials),
    xpMultiplier: xp,
  };
}

// ---------------------------------------------------------------------------
// Difficulty score (0–100)
// ---------------------------------------------------------------------------

export interface DifficultyStats {
  size: number;
  wordCount: number;
  avgLen: number;
  backFrac: number;
  diagFrac: number;
  avgVocab: number;
  /** 0–1: similar-looking sequences (decoy fragments, words sharing prefixes/suffixes). */
  similar: number;
  /** 0–1: how much word paths cross each other. */
  overlap: number;
  /** Letters hidden / grid cells. */
  density: number;
}

export function scoreFromStats(s: DifficultyStats): number {
  const gridN = clamp01((s.size - 10) / 10);
  const wordsN = clamp01((s.wordCount - 8) / 16);
  const lenN = clamp01((s.avgLen - 5) / 6);
  const dirN = 0.5 * s.backFrac + 0.5 * s.diagFrac;
  const vocabN = clamp01((s.avgVocab - 1) / 4);
  const sum =
    0.14 * gridN +
    0.12 * wordsN +
    0.14 * lenN +
    0.18 * dirN +
    0.16 * vocabN +
    0.1 * clamp01(s.similar) +
    0.1 * clamp01(s.overlap) +
    0.06 * clamp01(s.density / 0.5);
  return round1(clamp(16 + 80 * sum, 0, 100));
}

export function difficultyLabel(score: number): string {
  if (score < 30) return 'Gentle';
  if (score < 45) return 'Medium';
  if (score < 58) return 'Medium-Hard';
  if (score < 72) return 'Hard';
  if (score < 86) return 'Expert';
  return 'Master';
}

/** Score predicted from the knobs alone (used for previews before a grid exists). */
export function estimateScore(p: DifficultyParams): number {
  return scoreFromStats({
    size: p.gridSize,
    wordCount: p.wordCount,
    avgLen: p.targetLen,
    backFrac: p.backProb,
    diagFrac: p.diagProb,
    avgVocab: p.vocabTarget,
    similar: p.decoyFragments / 12 + 0.05,
    overlap: p.overlapPref * 0.9,
    density: (p.wordCount * p.targetLen) / (p.gridSize * p.gridSize),
  });
}

/** Score measured from the puzzle that was actually generated. */
export function measurePuzzle(placements: Placement[], size: number, decoys: number): number {
  const all = placements;
  const targets = placements.filter((p) => p.kind === 'target');
  const n = Math.max(1, targets.length);
  const dirOf = (p: Placement) => DIRECTIONS.find((d) => d.dr === p.dr && d.dc === p.dc)!;
  const back = all.filter((p) => dirOf(p).backward).length / Math.max(1, all.length);
  const diag = all.filter((p) => dirOf(p).axis === 'd').length / Math.max(1, all.length);
  const counts = new Map<number, number>();
  for (const p of all) for (const cell of cellsOf(p)) counts.set(cell.r * size + cell.c, (counts.get(cell.r * size + cell.c) ?? 0) + 1);
  let crossings = 0;
  for (const v of counts.values()) if (v > 1) crossings++;
  let affixPairs = 0;
  for (let i = 0; i < targets.length; i++) {
    for (let j = i + 1; j < targets.length; j++) {
      const a = targets[i].word;
      const b = targets[j].word;
      if (a.slice(0, 3) === b.slice(0, 3) || a.slice(-3) === b.slice(-3)) affixPairs++;
    }
  }
  const sumLen = targets.reduce((m, p) => m + p.word.length, 0);
  return scoreFromStats({
    size,
    wordCount: targets.length,
    avgLen: sumLen / n,
    backFrac: back,
    diagFrac: diag,
    avgVocab: targets.reduce((m, p) => m + p.difficulty, 0) / n,
    similar: (decoys + 2 * affixPairs) / 12,
    overlap: crossings / (n * 0.8),
    density: sumLen / (size * size),
  });
}

export function describePuzzleDifficulty(p: Puzzle): string {
  return `${p.difficulty.label} · ${Math.round(p.difficulty.score)}`;
}
