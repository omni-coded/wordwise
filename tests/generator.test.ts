import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DIRECTIONS, cellsOf, findOccurrences, generatePuzzle, validatePuzzle, pathKey, BLOCKED_SEQUENCES,
  type Puzzle, type PuzzleSpec,
} from '../src/engine';
import { POOL } from './fixtures';

const meta = { title: 'Fixture', theme: 'Fixture', topicId: 'a' };
const spec = (level: number, seed = `g-${level}`, extra: Partial<PuzzleSpec> = {}): PuzzleSpec => ({
  seed, mode: 'campaign', level, categoryId: 'fixture', ...extra,
});

test('level 1 is Medium: 11 hidden words on a 12x12 grid, plus a hidden bonus word', () => {
  const p = generatePuzzle(spec(1), POOL, meta);
  const targets = p.placements.filter((x) => x.kind === 'target');
  assert.ok(targets.length >= 10 && targets.length <= 12, `targets=${targets.length}`);
  assert.equal(p.size, 12);
  assert.ok(p.placements.some((x) => x.kind === 'bonus'));
  assert.equal(p.difficulty.label, 'Medium');
});

test('every word is present and unique in 240 generated puzzles across 1…2000', () => {
  const levels = [...Array.from({ length: 120 }, (_, i) => i + 1), ...Array.from({ length: 120 }, (_, i) => 120 + i * 16)];
  for (const level of levels) {
    const p = generatePuzzle(spec(level), POOL, meta);
    const errs = validatePuzzle(p);
    assert.deepEqual(errs, [], `level ${level}`);
    for (const pl of p.placements) {
      const occ = findOccurrences(p.grid, pl.word);
      assert.equal(occ.length, 1, `${pl.word} at level ${level}`);
      assert.equal(pathKey(occ[0], p.size), pathKey(cellsOf(pl), p.size));
    }
  }
});

test('generation is deterministic from the spec and varies with the seed', () => {
  const a = generatePuzzle(spec(7, 'same'), POOL, meta);
  const b = generatePuzzle(spec(7, 'same'), POOL, meta);
  const c = generatePuzzle(spec(7, 'other'), POOL, meta);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.grid, c.grid);
});

test('all 8 directions are used, and harder levels use more backward/diagonal placements', () => {
  const used = new Set<string>();
  const frac = (lo: number, hi: number) => {
    let back = 0, diag = 0, total = 0;
    for (let level = lo; level <= hi; level++) {
      const p = generatePuzzle(spec(level, `d-${level}`), POOL, meta);
      for (const pl of p.placements) {
        const d = DIRECTIONS.find((x) => x.dr === pl.dr && x.dc === pl.dc)!;
        used.add(d.id);
        total++;
        if (d.backward) back++;
        if (d.axis === 'd') diag++;
      }
    }
    return { back: back / total, diag: diag / total };
  };
  const early = frac(1, 30);
  const late = frac(200, 230);
  assert.equal(used.size, 8, `directions used: ${[...used]}`);
  assert.ok(late.back > early.back, `back ${early.back} -> ${late.back}`);
  assert.ok(late.diag > early.diag, `diag ${early.diag} -> ${late.diag}`);
});

test('filler never spells blocked sequences', () => {
  for (let i = 1; i <= 60; i++) {
    const p = generatePuzzle(spec(i, `b-${i}`), POOL, meta);
    const owned = new Set(p.placements.flatMap((pl) => cellsOf(pl).map((c) => c.r * p.size + c.c)));
    for (const bad of BLOCKED_SEQUENCES) {
      for (const path of findOccurrences(p.grid, bad)) {
        assert.ok(path.every((c) => owned.has(c.r * p.size + c.c)), `${bad} in filler at level ${i}`);
      }
    }
  }
});

test('expert, clue and mastery variants stay valid', () => {
  const variants: Puzzle[] = [
    generatePuzzle(spec(30, 'x1', { mode: 'expert', expert: true }), POOL, meta),
    generatePuzzle(spec(54, 'x2'), POOL, meta), // level 54: clue level
    generatePuzzle(spec(8, 'x3', { mode: 'journey', mastery: true }), POOL, meta),
  ];
  for (const p of variants) assert.deepEqual(validatePuzzle(p), []);
  assert.ok(variants[0].size > generatePuzzle(spec(30, 'x1'), POOL, meta).size - 1);
  assert.ok(variants[1].clueIds.length > 0);
  assert.ok(variants[2].specials.includes('mastery'));
});

test('validatePuzzle catches a tampered grid', () => {
  const p = generatePuzzle(spec(3), POOL, meta);
  const pl = p.placements[0];
  const c = cellsOf(pl)[1];
  const row = p.grid[c.r].split('');
  row[c.c] = row[c.c] === 'Q' ? 'Z' : 'Q';
  const broken: Puzzle = { ...p, grid: p.grid.map((r, i) => (i === c.r ? row.join('') : r)) };
  assert.ok(validatePuzzle(broken).length > 0);
});

test('high-level generation stays fast', () => {
  const t0 = performance.now();
  const N = 30;
  for (let i = 0; i < N; i++) generatePuzzle(spec(1000 + i, `perf-${i}`), POOL, meta);
  const per = (performance.now() - t0) / N;
  assert.ok(per < 250, `avg ${per.toFixed(1)}ms per puzzle`);
});
