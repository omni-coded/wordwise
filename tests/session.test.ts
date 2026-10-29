import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePuzzle, newSession, submitSelection, cellsOf, remainingTargets, targetsOf, bonusesOf,
  isComplete, pickHintTarget, applyHint, accuracy, Rng, type Puzzle,
} from '../src/engine';
import { POOL } from './fixtures';

const make = (): Puzzle =>
  generatePuzzle({ seed: 'sess', mode: 'campaign', level: 1, categoryId: 'f' }, POOL, { title: 't', theme: 't', topicId: 'a' });

test('finding a word works forwards and backwards, and duplicates are never rewarded twice', () => {
  const p = make();
  let s = newSession(p);
  const t = targetsOf(p)[0];
  let r = submitSelection(p, s, cellsOf(t));
  assert.equal(r.result.kind, 'found');
  s = r.state;
  assert.deepEqual(s.found, [t.entryId]);
  r = submitSelection(p, s, [...cellsOf(t)].reverse());
  assert.equal(r.result.kind, 'duplicate');
  assert.deepEqual(r.state.found, [t.entryId]);
  assert.equal(r.state.correct, 1);
});

test('tiny selections are ignored; wrong selections count as attempts only', () => {
  const p = make();
  const s = newSession(p);
  const t = cellsOf(targetsOf(p)[0]);
  assert.equal(submitSelection(p, s, t.slice(0, 2)).result.kind, 'short');
  assert.equal(submitSelection(p, s, t.slice(0, 2)).state.attempts, 0);
  const wrong = submitSelection(p, s, t.slice(0, 3));
  assert.equal(wrong.result.kind, 'miss');
  assert.equal(wrong.state.attempts, 1);
  assert.equal(wrong.state.found.length, 0);
});

test('bonus words are tracked separately and do not gate completion', () => {
  const p = make();
  let s = newSession(p);
  const bonus = bonusesOf(p)[0];
  const rb = submitSelection(p, s, cellsOf(bonus));
  assert.equal(rb.result.kind, 'bonus');
  s = rb.state;
  assert.deepEqual(s.bonusFound, [bonus.entryId]);
  assert.equal(s.found.length, 0);
  assert.equal(isComplete(p, s), false);
  for (const t of targetsOf(p)) s = submitSelection(p, s, cellsOf(t)).state;
  assert.equal(isComplete(p, s), true);
  assert.equal(s.status, 'complete');
  assert.equal(remainingTargets(p, s).length, 0);
  assert.equal(accuracy(s), 1);
});

test('no further selections are accepted after completion', () => {
  const p = make();
  let s = newSession(p);
  for (const t of targetsOf(p)) s = submitSelection(p, s, cellsOf(t)).state;
  const after = submitSelection(p, s, cellsOf(bonusesOf(p)[0]));
  assert.equal(after.result.kind, 'short');
  assert.equal(after.state.bonusFound.length, 0);
});

test('hints prefer fresh words and only target unfound words', () => {
  const p = make();
  let s = newSession(p);
  const rng = new Rng('h');
  const seen = new Set<string>();
  for (let i = 0; i < targetsOf(p).length; i++) {
    const h = pickHintTarget(p, s, rng)!;
    assert.ok(!seen.has(h.entryId));
    seen.add(h.entryId);
    s = applyHint(s, h);
  }
  assert.equal(s.hintsUsed, targetsOf(p).length);
  const first = targetsOf(p)[0];
  s = submitSelection(p, s, cellsOf(first)).state;
  for (let i = 0; i < 20; i++) assert.notEqual(pickHintTarget(p, s, rng)!.entryId, first.entryId);
});
