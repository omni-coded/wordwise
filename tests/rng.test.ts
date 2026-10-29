import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Rng, hashString } from '../src/engine';

test('same seed -> same sequence; different seed -> different', () => {
  const a = new Rng('wordwise');
  const b = new Rng('wordwise');
  const c = new Rng('wordwise2');
  const sa = Array.from({ length: 20 }, () => a.next());
  const sb = Array.from({ length: 20 }, () => b.next());
  const sc = Array.from({ length: 20 }, () => c.next());
  assert.deepEqual(sa, sb);
  assert.notDeepEqual(sa, sc);
  assert.ok(sa.every((x) => x >= 0 && x < 1));
});

test('int() stays within inclusive bounds and hits both ends', () => {
  const r = new Rng(7);
  const seen = new Set<number>();
  for (let i = 0; i < 500; i++) {
    const v = r.int(3, 6);
    assert.ok(v >= 3 && v <= 6);
    seen.add(v);
  }
  assert.deepEqual([...seen].sort(), [3, 4, 5, 6]);
});

test('shuffle is a permutation and does not mutate input', () => {
  const src = [1, 2, 3, 4, 5, 6, 7, 8];
  const out = new Rng('x').shuffle(src);
  assert.deepEqual(src, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual([...out].sort((a, b) => a - b), src);
});

test('weightedIndex respects weights and zero weights', () => {
  const r = new Rng('w');
  const counts = [0, 0, 0];
  for (let i = 0; i < 3000; i++) counts[r.weightedIndex([0, 1, 9])]++;
  assert.equal(counts[0], 0);
  assert.ok(counts[2] > counts[1] * 4);
});

test('hashString is stable', () => {
  assert.equal(hashString('abc'), hashString('abc'));
  assert.notEqual(hashString('abc'), hashString('abd'));
});
