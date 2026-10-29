import type { Cell, Placement } from './types';
import { cellsOf } from './validator';

/** 8 compass steps ordered by angle (screen coordinates, y grows downward): E, SE, S, SW, W, NW, N, NE. */
const STEPS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1],
];

/** Cells on the straight line a→b (inclusive) or null if a and b are not aligned. */
export function cellsBetween(a: Cell, b: Cell): Cell[] | null {
  const dr = b.r - a.r;
  const dc = b.c - a.c;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  const out: Cell[] = [];
  for (let i = 0; i <= steps; i++) out.push({ r: a.r + sr * i, c: a.c + sc * i });
  return out;
}

/**
 * Turns a free pointer position into the end of a straight selection.
 * `x`, `y` are in grid units (column / row, fractional). The drag is snapped to
 * the nearest of the 8 directions and clamped to the board, so a slightly
 * wobbly finger still selects a clean line.
 */
export function snapToLine(start: Cell, x: number, y: number, size: number): Cell {
  const dx = x - (start.c + 0.5);
  const dy = y - (start.r + 0.5);
  if (Math.hypot(dx, dy) < 0.6) return start;
  const k = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
  const [sr, sc] = STEPS[k];
  const stepLen = Math.hypot(sr, sc);
  const proj = (dx * sc + dy * sr) / stepLen; // distance along the chosen direction
  let steps = Math.max(0, Math.round(proj / stepLen));
  const room = (s: number, pos: number) => (s > 0 ? size - 1 - pos : s < 0 ? pos : Infinity);
  steps = Math.min(steps, room(sr, start.r), room(sc, start.c));
  return { r: start.r + sr * steps, c: start.c + sc * steps };
}

export function pathString(grid: readonly string[], cells: readonly Cell[]): string {
  return cells.map((c) => grid[c.r][c.c]).join('');
}

/** Exact-position match (either reading direction). Letters alone are never enough. */
export function matchPlacement(placements: readonly Placement[], cells: readonly Cell[]): Placement | null {
  if (cells.length < 2) return null;
  const a = cells[0];
  const b = cells[cells.length - 1];
  for (const p of placements) {
    if (p.word.length !== cells.length) continue;
    const pc = cellsOf(p);
    const s = pc[0];
    const e = pc[pc.length - 1];
    const fwd = s.r === a.r && s.c === a.c && e.r === b.r && e.c === b.c;
    const bwd = s.r === b.r && s.c === b.c && e.r === a.r && e.c === a.c;
    if (fwd || bwd) return p;
  }
  return null;
}
