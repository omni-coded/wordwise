import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paramsForLevel, estimateScore, difficultyLabel, levelSpecials } from '../src/engine';

const plain = (L: number) => levelSpecials(L).length === 0;

test('level 1 starts at Medium, never "easy"', () => {
  const p = paramsForLevel(1);
  const s = estimateScore(p);
  assert.equal(difficultyLabel(s), 'Medium');
  assert.ok(s >= 34 && s <= 46, `score ${s}`);
  assert.equal(p.gridSize, 12);
  assert.ok(p.wordCount >= 10 && p.wordCount <= 12);
});

test('no level, including relaxing ones, drops below Medium', () => {
  for (let L = 1; L <= 3000; L++) {
    assert.ok(estimateScore(paramsForLevel(L)) >= 30, `level ${L}`);
  }
});

test('difficulty rises steadily across the documented bands', () => {
  const avg = (lo: number, hi: number) => {
    let sum = 0, n = 0;
    for (let L = lo; L <= hi; L++) if (plain(L)) { sum += estimateScore(paramsForLevel(L)); n++; }
    return sum / n;
  };
  const bands = [avg(1, 10), avg(11, 25), avg(26, 50), avg(51, 100), avg(101, 200), avg(201, 400)];
  for (let i = 1; i < bands.length; i++) assert.ok(bands[i] > bands[i - 1] - 0.01, `band ${i}: ${bands}`);
  assert.ok(bands[3] > bands[0] + 25, `levels 51–100 should be far harder than 1–10: ${bands}`);
});

test('difficulty ramps smoothly between consecutive regular levels', () => {
  let prev: number | null = null;
  for (let L = 1; L <= 400; L++) {
    if (!plain(L)) { prev = null; continue; }
    const s = estimateScore(paramsForLevel(L));
    if (prev !== null) assert.ok(Math.abs(s - prev) <= 4, `jump ${prev} -> ${s} at level ${L}`);
    prev = s;
  }
});

test('relaxing levels follow hard ones and are easier than their neighbours', () => {
  for (const L of [11, 21, 26, 31, 51, 76, 101]) {
    assert.ok(levelSpecials(L).includes('relaxing'), `L${L}`);
    assert.ok(estimateScore(paramsForLevel(L)) < estimateScore(paramsForLevel(L - 1)), `L${L} easier than L${L - 1}`);
  }
});

test('milestone and gauntlet levels are tougher spikes', () => {
  assert.ok(levelSpecials(10).includes('milestone'));
  assert.ok(levelSpecials(25).includes('gauntlet'));
  assert.ok(paramsForLevel(25).xpMultiplier > paramsForLevel(24).xpMultiplier);
});

test('unbounded: parameters stay finite and capped at any level', () => {
  for (const L of [100, 500, 1000, 10_000, 1_000_000]) {
    const p = paramsForLevel(L);
    for (const [k, v] of Object.entries(p)) if (typeof v === 'number') assert.ok(Number.isFinite(v), `${k} @${L}`);
    assert.ok(p.gridSize <= 18 && p.wordCount <= 28);
    assert.ok(p.vocabTarget <= 4.8 && p.backProb <= 0.8);
  }
  assert.ok(paramsForLevel(5000).minLen >= paramsForLevel(5).minLen);
});

test('clue levels appear from level 51 and fully-clued ones from 101', () => {
  assert.equal(paramsForLevel(54).clueMode, 'partial');
  assert.equal(paramsForLevel(108).clueMode, 'full');
  assert.equal(paramsForLevel(30).clueMode, 'none');
});

test('expert mode raises grid size and difficulty', () => {
  const a = paramsForLevel(20);
  const b = paramsForLevel(20, { expert: true });
  assert.ok(b.gridSize >= a.gridSize + 2 - 0 && b.gridSize <= 20);
  assert.ok(estimateScore(b) > estimateScore(a));
});

test('difficulty keeps adapting beyond level 100 (no flat ceiling)', () => {
  const at = (L: number) => estimateScore(paramsForLevel(L));
  const regular = (L: number) => { while (!plain(L)) L++; return L; };
  const marks = [100, 200, 400, 800, 1600].map(regular).map(at);
  for (let i = 1; i < marks.length; i++) assert.ok(marks[i] > marks[i - 1], `marks ${marks}`);
  assert.ok(marks[marks.length - 1] <= 100);
});
