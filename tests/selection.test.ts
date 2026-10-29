import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cellsBetween, snapToLine, matchPlacement, cellsOf, DIRECTIONS, generatePuzzle } from '../src/engine';
import { POOL } from './fixtures';

const S = 12;

test('cellsBetween: all 8 directions, inclusive, and null for off-line pairs', () => {
  const a = { r: 5, c: 5 };
  for (const d of DIRECTIONS) {
    const b = { r: 5 + d.dr * 3, c: 5 + d.dc * 3 };
    const line = cellsBetween(a, b)!;
    assert.equal(line.length, 4, d.id);
    assert.deepEqual(line[0], a);
    assert.deepEqual(line[3], b);
  }
  assert.equal(cellsBetween(a, { r: 6, c: 8 }), null);
  assert.deepEqual(cellsBetween(a, a), [a]);
});

test('snapToLine: snaps a pointer to each of the 8 directions (with wobble)', () => {
  const start = { r: 5, c: 5 };
  for (const d of DIRECTIONS) {
    const wobbleX = d.dr === 0 ? 0 : 0.18;
    const wobbleY = d.dc === 0 ? 0 : -0.15;
    const x = 5.5 + d.dc * 3 + wobbleX;
    const y = 5.5 + d.dr * 3 + wobbleY;
    const end = snapToLine(start, x, y, S);
    assert.deepEqual(end, { r: 5 + d.dr * 3, c: 5 + d.dc * 3 }, `direction ${d.id}`);
  }
});

test('snapToLine: tiny drags stay on the start cell; far drags clamp to the board', () => {
  assert.deepEqual(snapToLine({ r: 3, c: 3 }, 3.6, 3.55, S), { r: 3, c: 3 });
  assert.deepEqual(snapToLine({ r: 10, c: 10 }, 40, 40, S), { r: 11, c: 11 });
  assert.deepEqual(snapToLine({ r: 0, c: 0 }, -9, -9, S), { r: 0, c: 0 });
  assert.deepEqual(snapToLine({ r: 0, c: 4 }, 100, 0.5, S), { r: 0, c: 11 });
});

test('matchPlacement matches exact cells in either direction only', () => {
  const puzzle = generatePuzzle(
    { seed: 'sel-1', mode: 'campaign', level: 1, categoryId: 'fixture' },
    POOL,
    { title: 't', theme: 't', topicId: 'a' },
  );
  const p = puzzle.placements[0];
  const cells = cellsOf(p);
  assert.equal(matchPlacement(puzzle.placements, cells)?.entryId, p.entryId);
  assert.equal(matchPlacement(puzzle.placements, [...cells].reverse())?.entryId, p.entryId);
  assert.equal(matchPlacement(puzzle.placements, cells.slice(0, -1)), null, 'a prefix is not the word');
  assert.equal(matchPlacement(puzzle.placements, cells.slice(1)), null, 'a suffix is not the word');
  const shifted = cells.map((c) => ({ r: c.r, c: Math.min(S, c.c + 1) }));
  assert.equal(matchPlacement(puzzle.placements, shifted), null);
});
