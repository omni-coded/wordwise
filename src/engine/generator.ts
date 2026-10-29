import { BLOCKED_SEQUENCES } from './blocklist';
import { DIRECTIONS, pickDirection } from './directions';
import { Rng } from './rng';
import type { Cell, Placement, WordSpec } from './types';
import { findOccurrences, pathKey, cellsOf } from './validator';

export interface GenOptions {
  size: number;
  diagProb: number;
  backProb: number;
  overlapPref: number;
  decoyRate: number;
  decoyFragments: number;
}

export interface GenResult {
  grid: string[];
  placements: Placement[];
  decoys: number;
  attempts: number;
}

// English letter frequencies, flattened so filler does not give words away.
const FREQ: Record<string, number> = {
  E: 127, T: 91, A: 82, O: 75, I: 70, N: 67, S: 63, R: 60, H: 61, D: 43, L: 40, C: 28, U: 28,
  M: 24, W: 24, F: 22, G: 20, Y: 20, P: 19, B: 15, V: 10, K: 8, J: 3, X: 3, Q: 2, Z: 2,
};
const LETTERS = Object.keys(FREQ);
const CUM: number[] = [];
{
  let total = 0;
  for (const l of LETTERS) {
    total += Math.pow(FREQ[l], 0.75);
    CUM.push(total);
  }
}
function freqLetter(rng: Rng): string {
  const x = rng.next() * CUM[CUM.length - 1];
  for (let i = 0; i < CUM.length; i++) if (x < CUM[i]) return LETTERS[i];
  return 'E';
}

type Grid = (string | null)[][];

function startRange(d: number, len: number, n: number): [number, number] {
  if (d > 0) return [0, n - len];
  if (d < 0) return [len - 1, n - 1];
  return [0, n - 1];
}

/** Returns overlap count (cells already holding the same letter) or -1 if it can't fit. */
function fits(g: Grid, word: string, r: number, c: number, dr: number, dc: number): number {
  let overlap = 0;
  for (let i = 0; i < word.length; i++) {
    const cell = g[r + dr * i][c + dc * i];
    if (cell === null) continue;
    if (cell !== word[i]) return -1;
    overlap++;
  }
  return overlap;
}

function write(g: Grid, word: string, r: number, c: number, dr: number, dc: number): void {
  for (let i = 0; i < word.length; i++) g[r + dr * i][c + dc * i] = word[i];
}

interface Candidate {
  r: number;
  c: number;
  dr: number;
  dc: number;
  overlap: number;
}

function placeWord(g: Grid, w: WordSpec, o: GenOptions, rng: Rng): Placement | null {
  const n = o.size;
  const len = w.word.length;
  if (len > n) return null;
  const cands: Candidate[] = [];
  for (let t = 0; t < 90 && cands.length < 28; t++) {
    const d = pickDirection(rng, o.diagProb, o.backProb);
    const [r0, r1] = startRange(d.dr, len, n);
    const [c0, c1] = startRange(d.dc, len, n);
    const r = rng.int(r0, r1);
    const c = rng.int(c0, c1);
    const ov = fits(g, w.word, r, c, d.dr, d.dc);
    if (ov >= 0) cands.push({ r, c, dr: d.dr, dc: d.dc, overlap: ov });
  }
  if (cands.length === 0) {
    // Exhaustive fallback so a crowded grid still gets a chance.
    for (const d of DIRECTIONS) {
      const [r0, r1] = startRange(d.dr, len, n);
      const [c0, c1] = startRange(d.dc, len, n);
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const ov = fits(g, w.word, r, c, d.dr, d.dc);
          if (ov >= 0) cands.push({ r, c, dr: d.dr, dc: d.dc, overlap: ov });
        }
      }
    }
    if (cands.length === 0) return null;
  }
  let chosen: Candidate;
  const best = cands.reduce((m, x) => Math.max(m, x.overlap), 0);
  if (best > 0 && best < len && rng.chance(o.overlapPref)) {
    chosen = rng.pick(cands.filter((x) => x.overlap === best));
  } else {
    // Prefer placements that do not swallow the whole word inside other words.
    const proper = cands.filter((x) => x.overlap < len);
    chosen = rng.pick(proper.length ? proper : cands);
  }
  write(g, w.word, chosen.r, chosen.c, chosen.dr, chosen.dc);
  return { ...w, r: chosen.r, c: chosen.c, dr: chosen.dr, dc: chosen.dc };
}

/** Near-miss traps: word prefixes/suffixes and one-letter mutations written into empty cells. */
function placeDecoys(g: Grid, words: WordSpec[], o: GenOptions, rng: Rng): number {
  const n = o.size;
  const listed = new Set(words.map((w) => w.word));
  let placed = 0;
  for (let k = 0; k < o.decoyFragments; k++) {
    const w = rng.pick(words).word;
    let text: string;
    const mode = rng.next();
    if (mode < 0.4 && w.length >= 6) {
      text = w.slice(0, rng.int(3, w.length - 2));
    } else if (mode < 0.65 && w.length >= 6) {
      text = w.slice(rng.int(2, w.length - 3));
    } else {
      const i = rng.int(1, w.length - 2);
      let letter = freqLetter(rng);
      while (letter === w[i]) letter = freqLetter(rng);
      text = w.slice(0, i) + letter + w.slice(i + 1);
    }
    if (listed.has(text) || text.length < 3) continue;
    for (let t = 0; t < 30; t++) {
      const d = pickDirection(rng, o.diagProb, o.backProb);
      const [r0, r1] = startRange(d.dr, text.length, n);
      const [c0, c1] = startRange(d.dc, text.length, n);
      const r = rng.int(r0, r1);
      const c = rng.int(c0, c1);
      let free = true;
      for (let i = 0; i < text.length; i++) {
        if (g[r + d.dr * i][c + d.dc * i] !== null) {
          free = false;
          break;
        }
      }
      if (!free) continue;
      write(g, text, r, c, d.dr, d.dc);
      placed++;
      break;
    }
  }
  return placed;
}

function tryGenerate(words: WordSpec[], o: GenOptions, rng: Rng): Omit<GenResult, 'attempts'> | null {
  const n = o.size;
  const g: Grid = Array.from({ length: n }, () => Array<string | null>(n).fill(null));

  // Longest words first; shuffle first so equal lengths vary by seed.
  const order = rng.shuffle(words).sort((a, b) => b.word.length - a.word.length);
  const placements: Placement[] = [];
  for (const w of order) {
    const p = placeWord(g, w, o, rng);
    if (!p) return null;
    placements.push(p);
  }
  const owned: boolean[][] = Array.from({ length: n }, () => Array<boolean>(n).fill(false));
  for (const p of placements) for (const cell of cellsOf(p)) owned[cell.r][cell.c] = true;

  const decoys = placeDecoys(g, words, o, rng);

  // Fill the rest. A share of filler reuses the puzzle's own letters (camouflage).
  const pool = Array.from(new Set(words.flatMap((w) => w.word.split(''))));
  const filler = (): string => (rng.chance(o.decoyRate) ? rng.pick(pool) : freqLetter(rng));
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (g[r][c] === null) g[r][c] = filler();

  // Repair loop: remove accidental second copies of hidden words and crude sequences.
  const ownKeys = new Map(placements.map((p) => [p.entryId, pathKey(cellsOf(p), n)]));
  for (let iter = 0; iter < 80; iter++) {
    const rows = g.map((row) => row.join(''));
    const toFix: Cell[][] = [];
    for (const p of placements) {
      for (const path of findOccurrences(rows, p.word)) {
        if (pathKey(path, n) !== ownKeys.get(p.entryId)) toFix.push(path);
      }
    }
    const mustFixCount = toFix.length;
    for (const bad of BLOCKED_SEQUENCES) {
      for (const path of findOccurrences(rows, bad)) {
        if (path.some((cell) => !owned[cell.r][cell.c])) toFix.push(path);
      }
    }
    if (toFix.length === 0) {
      return { grid: rows, placements, decoys };
    }
    for (let i = 0; i < toFix.length; i++) {
      const free = toFix[i].filter((cell) => !owned[cell.r][cell.c]);
      if (free.length === 0) {
        if (i < mustFixCount) return null; // a second copy made purely of hidden words: retry whole grid
        continue;
      }
      const cell = rng.pick(free);
      const old = g[cell.r][cell.c];
      let letter = filler();
      while (letter === old) letter = freqLetter(rng);
      g[cell.r][cell.c] = letter;
    }
  }
  return null;
}

/**
 * Builds a word-search grid containing every word, deterministically from `seed`.
 * Returns null if no attempt succeeded (caller reduces the word set / grows the grid).
 */
export function generateWordSearch(
  words: WordSpec[],
  opts: GenOptions,
  seed: string,
  maxAttempts = 40,
): GenResult | null {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const rng = new Rng(`${seed}#${attempt}`);
    const res = tryGenerate(words, opts, rng);
    if (res) return { ...res, attempts: attempt + 1 };
  }
  return null;
}
