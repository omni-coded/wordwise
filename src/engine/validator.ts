import { DIRECTIONS } from './directions';
import type { Cell, Placement, Puzzle } from './types';

/** Grid cells covered by a placement, start → end. */
export function cellsOf(p: Pick<Placement, 'r' | 'c' | 'dr' | 'dc' | 'word'>): Cell[] {
  const out: Cell[] = [];
  for (let i = 0; i < p.word.length; i++) out.push({ r: p.r + p.dr * i, c: p.c + p.dc * i });
  return out;
}

/** Orientation-independent key for a straight path (so a palindrome counts once). */
export function pathKey(path: readonly Cell[], size: number): string {
  const a = path[0];
  const b = path[path.length - 1];
  const ka = a.r * size + a.c;
  const kb = b.r * size + b.c;
  return ka <= kb ? `${ka}-${kb}` : `${kb}-${ka}`;
}

/**
 * Independent solver: finds every straight-line occurrence of `word`
 * (any of the 8 directions) in the grid. Occurrences are de-duplicated so a
 * palindrome read in both directions counts once.
 */
export function findOccurrences(grid: readonly string[], word: string): Cell[][] {
  const n = grid.length;
  const len = word.length;
  const first = word[0];
  const out: Cell[][] = [];
  const seen = new Set<string>();
  for (let r = 0; r < n; r++) {
    const row = grid[r];
    for (let c = 0; c < n; c++) {
      if (row[c] !== first) continue;
      for (const d of DIRECTIONS) {
        const er = r + d.dr * (len - 1);
        const ec = c + d.dc * (len - 1);
        if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
        let ok = true;
        for (let i = 1; i < len; i++) {
          if (grid[r + d.dr * i][c + d.dc * i] !== word[i]) {
            ok = false;
            break;
          }
        }
        if (!ok) continue;
        const path: Cell[] = [];
        for (let i = 0; i < len; i++) path.push({ r: r + d.dr * i, c: c + d.dc * i });
        const key = pathKey(path, n);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(path);
      }
    }
  }
  return out;
}

const rev = (s: string) => s.split('').reverse().join('');

/** True when two hidden words could be confused (one inside the other, or its mirror). */
export function wordsConflict(a: string, b: string): boolean {
  if (a === b) return true;
  const rb = rev(b);
  const ra = rev(a);
  return a.includes(b) || a.includes(rb) || b.includes(a) || b.includes(ra);
}

/**
 * Full puzzle audit. Returns a list of problems (empty = valid & solvable).
 * Used by the generator before a puzzle is ever shown, and again when a saved
 * puzzle is loaded from storage.
 */
export function validatePuzzle(p: Puzzle): string[] {
  const errors: string[] = [];
  const n = p.size;
  if (!Number.isInteger(n) || n < 5) errors.push(`bad size ${n}`);
  if (p.grid.length !== n) errors.push('grid row count != size');
  for (let r = 0; r < p.grid.length; r++) {
    const row = p.grid[r];
    if (row.length !== n) errors.push(`row ${r} length ${row.length} != ${n}`);
    if (!/^[A-Z]+$/.test(row)) errors.push(`row ${r} has non A–Z characters`);
  }
  if (errors.length) return errors;

  const targets = p.placements.filter((x) => x.kind === 'target');
  if (targets.length === 0) errors.push('no target words');

  const ids = new Set<string>();
  for (const pl of p.placements) {
    if (ids.has(pl.entryId)) errors.push(`duplicate entry ${pl.entryId}`);
    ids.add(pl.entryId);
    if (!/^[A-Z]{3,}$/.test(pl.word)) errors.push(`${pl.entryId}: bad word`);
    const cells = cellsOf(pl);
    const end = cells[cells.length - 1];
    if (end.r < 0 || end.r >= n || end.c < 0 || end.c >= n || pl.r < 0 || pl.r >= n || pl.c < 0 || pl.c >= n) {
      errors.push(`${pl.word}: runs out of bounds`);
      continue;
    }
    if (!(Math.abs(pl.dr) <= 1 && Math.abs(pl.dc) <= 1 && (pl.dr !== 0 || pl.dc !== 0))) {
      errors.push(`${pl.word}: invalid direction`);
      continue;
    }
    const spelled = cells.map((cell) => p.grid[cell.r][cell.c]).join('');
    if (spelled !== pl.word) errors.push(`${pl.word}: grid spells ${spelled}`);
  }
  for (let i = 0; i < p.placements.length; i++) {
    for (let j = i + 1; j < p.placements.length; j++) {
      if (wordsConflict(p.placements[i].word, p.placements[j].word)) {
        errors.push(`ambiguous pair ${p.placements[i].word}/${p.placements[j].word}`);
      }
    }
  }
  if (errors.length) return errors;

  // Solver pass: each word must be findable, exactly once, exactly where placed.
  for (const pl of p.placements) {
    const found = findOccurrences(p.grid, pl.word);
    const own = pathKey(cellsOf(pl), n);
    if (found.length === 0) errors.push(`${pl.word}: not findable`);
    else if (found.length > 1) errors.push(`${pl.word}: appears ${found.length} times`);
    else if (pathKey(found[0], n) !== own) errors.push(`${pl.word}: found at a different location than placed`);
  }
  for (const id of p.clueIds) {
    const pl = p.placements.find((x) => x.entryId === id);
    if (!pl || pl.kind !== 'target') errors.push(`clue ${id} is not a target word`);
  }
  return errors;
}

export function isPuzzleValid(p: Puzzle): boolean {
  return validatePuzzle(p).length === 0;
}
