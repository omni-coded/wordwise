import type { Cell, Placement, Puzzle } from './types';
import type { Rng } from './rng';
import { matchPlacement } from './selection';
import { cellsOf } from './validator';

export interface SessionState {
  puzzleId: string;
  found: string[]; // target entry ids, discovery order
  bonusFound: string[];
  attempts: number; // evaluated selections (duplicates and tiny drags excluded)
  correct: number;
  hintsUsed: number;
  hinted: string[];
  elapsedMs: number;
  status: 'playing' | 'complete' | 'failed';
}

export type SubmitKind = 'found' | 'bonus' | 'duplicate' | 'miss' | 'short';
export interface SubmitResult {
  kind: SubmitKind;
  placement?: Placement;
}

export const MIN_SELECTION = 3;

export function newSession(puzzle: Puzzle): SessionState {
  return {
    puzzleId: puzzle.id,
    found: [],
    bonusFound: [],
    attempts: 0,
    correct: 0,
    hintsUsed: 0,
    hinted: [],
    elapsedMs: 0,
    status: 'playing',
  };
}

export function targetsOf(p: Puzzle): Placement[] {
  return p.placements.filter((x) => x.kind === 'target');
}
export function bonusesOf(p: Puzzle): Placement[] {
  return p.placements.filter((x) => x.kind === 'bonus');
}
export function remainingTargets(p: Puzzle, s: SessionState): Placement[] {
  return targetsOf(p).filter((x) => !s.found.includes(x.entryId));
}
export function accuracy(s: SessionState): number {
  return s.attempts === 0 ? 1 : s.correct / s.attempts;
}

/**
 * Evaluates a finished selection. Pure: returns a new state and what happened.
 * - fewer than 3 cells: ignored (accidental touch), costs nothing
 * - already-found word: 'duplicate', never rewarded twice
 * - anything else that is not exactly a hidden word: a counted miss
 */
export function submitSelection(
  puzzle: Puzzle,
  state: SessionState,
  cells: readonly Cell[],
): { state: SessionState; result: SubmitResult } {
  if (state.status !== 'playing' || cells.length < MIN_SELECTION) {
    return { state, result: { kind: 'short' } };
  }
  const hit = matchPlacement(puzzle.placements, cells);
  if (!hit) {
    return { state: { ...state, attempts: state.attempts + 1 }, result: { kind: 'miss' } };
  }
  const list = hit.kind === 'target' ? state.found : state.bonusFound;
  if (list.includes(hit.entryId)) {
    return { state, result: { kind: 'duplicate', placement: hit } };
  }
  const next: SessionState = {
    ...state,
    attempts: state.attempts + 1,
    correct: state.correct + 1,
    found: hit.kind === 'target' ? [...state.found, hit.entryId] : state.found,
    bonusFound: hit.kind === 'bonus' ? [...state.bonusFound, hit.entryId] : state.bonusFound,
  };
  if (isComplete(puzzle, next)) next.status = 'complete';
  return { state: next, result: { kind: hit.kind === 'target' ? 'found' : 'bonus', placement: hit } };
}

export function isComplete(puzzle: Puzzle, s: SessionState): boolean {
  return targetsOf(puzzle).every((t) => s.found.includes(t.entryId));
}

/** Prefers a word that has not been hinted yet. */
export function pickHintTarget(puzzle: Puzzle, s: SessionState, rng: Rng): Placement | null {
  const left = remainingTargets(puzzle, s);
  if (left.length === 0) return null;
  const fresh = left.filter((x) => !s.hinted.includes(x.entryId));
  return rng.pick(fresh.length ? fresh : left);
}

export function applyHint(s: SessionState, p: Placement): SessionState {
  return {
    ...s,
    hintsUsed: s.hintsUsed + 1,
    hinted: s.hinted.includes(p.entryId) ? s.hinted : [...s.hinted, p.entryId],
  };
}

export function hintCell(p: Placement): Cell {
  return cellsOf(p)[0];
}
