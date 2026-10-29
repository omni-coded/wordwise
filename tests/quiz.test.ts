import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allEntries, getCategory } from '../src/content';
import { Rng } from '../src/engine/rng';
import { wordsConflict } from '../src/engine/validator';
import { BLANK, QUESTION_KINDS, blankOut, buildQuestion, buildQuiz, gradeQuiz, isCorrect, pickDistractors } from '../src/game/quiz';

const ALL = allEntries();

test('blankOut replaces whole-word matches case-insensitively, falling back to substrings', () => {
  assert.equal(blankOut('Inflation erodes savings; inflation is persistent.', 'Inflation'), `${BLANK} erodes savings; ${BLANK} is persistent.`);
  assert.equal(blankOut('Banks hold collateral.', 'collateral'), `Banks hold ${BLANK}.`);
  assert.equal(blankOut('Two-step authentication helps.', 'authentication'), `Two-step ${BLANK} helps.`);
  assert.equal(blankOut('Open-source tools are free.', 'Open-source'), `${BLANK} tools are free.`);
  assert.equal(blankOut('The interests add up.', 'interest'), `The ${BLANK}s add up.`, 'no whole word, so the substring is blanked');
});

test('every entry yields every question kind with sound options', () => {
  for (const entry of ALL) {
    for (const kind of QUESTION_KINDS) {
      const q = buildQuestion(entry, kind, ALL, new Rng(`${entry.id}:${kind}`));
      assert.ok(q, `${entry.id}/${kind}`);
      assert.equal(q!.options.length, 4, `${entry.id}/${kind} options`);
      const texts = q!.options.map((o) => o.text);
      assert.equal(new Set(texts).size, 4, `${entry.id}/${kind} duplicate options`);
      assert.equal(new Set(q!.options.map((o) => o.id)).size, 4);
      const correct = q!.options.find((o) => o.id === q!.correctId)!;
      assert.ok(correct, `${entry.id}/${kind} correct option present`);
      assert.equal(correct.text, kind === 'definition' ? entry.definition : entry.term);
      assert.equal(q!.entryId, entry.id);
      assert.ok(q!.explanation.includes(entry.term));
      if (kind === 'cloze') {
        assert.ok(q!.stem.includes(BLANK), `${entry.id} cloze has a blank`);
        assert.ok(!new RegExp(`\\b${entry.term}\\b`, 'i').test(q!.stem), `${entry.id} cloze leaks its answer`);
      }
      if (kind !== 'definition') {
        // no wrong option may appear inside the question text, and none may be confusable with the answer
        for (const o of q!.options) {
          if (o.id === q!.correctId) continue;
          assert.ok(!new RegExp(`\\b${o.text}`, 'i').test(q!.stem), `${entry.id}/${kind}: option "${o.text}" appears in the stem`);
          const other = ALL.find((e) => e.term === o.text)!;
          assert.ok(!wordsConflict(other.word, entry.word), `${entry.id}: confusable distractor ${other.word}`);
        }
      }
    }
  }
});

test('distractors prefer the same topic', () => {
  const cat = getCategory('finance')!;
  const entry = cat.entries.find((e) => e.topic === 'economy')!;
  let sameTopic = 0;
  let sameCategory = 0;
  let total = 0;
  for (let i = 0; i < 60; i++) {
    for (const d of pickDistractors(entry, ALL, 3, new Rng(`s${i}`), '')) {
      if (d.category === entry.category) sameCategory++;
      total++;
      if (d.category === entry.category && d.topic === entry.topic) sameTopic++;
    }
  }
  assert.ok(sameTopic / total > 0.25, `only ${sameTopic}/${total} came from the same topic`);
  assert.ok(sameCategory / total > 0.6, `only ${sameCategory}/${total} came from the same category even with a global pool`);
  // with a category-sized pool the choices are mostly same-topic
  let local = 0;
  let localTotal = 0;
  for (let i = 0; i < 60; i++) {
    for (const d of pickDistractors(entry, cat.entries, 3, new Rng(`l${i}`), '')) {
      localTotal++;
      if (d.topic === entry.topic) local++;
    }
  }
  assert.ok(local / localTotal > 0.4, `only ${local}/${localTotal} same-topic with a category pool`);
});

test('questions are deterministic per seed and vary across seeds', () => {
  const entries = ALL.slice(0, 40);
  const a = buildQuiz({ entries, count: 5, seed: 'daily|2026-10-29', pool: ALL });
  const b = buildQuiz({ entries, count: 5, seed: 'daily|2026-10-29', pool: ALL });
  const c = buildQuiz({ entries, count: 5, seed: 'daily|2026-10-30', pool: ALL });
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.map((q) => q.id), c.map((q) => q.id));
  assert.equal(a.length, 5);
  assert.equal(new Set(a.map((q) => q.entryId)).size, 5, 'one question per word');
  assert.ok(new Set(a.map((q) => q.kind)).size >= 2, 'mixes formats');
});

test('quiz size is bounded by the entries available', () => {
  const few = ALL.slice(0, 3);
  assert.equal(buildQuiz({ entries: few, count: 10, seed: 'x', pool: ALL }).length, 3);
  assert.equal(buildQuiz({ entries: [], count: 5, seed: 'x', pool: ALL }).length, 0);
  assert.equal(buildQuiz({ entries: few, count: 0, seed: 'x', pool: ALL }).length, 0);
});

test('tiny pools degrade gracefully instead of throwing', () => {
  const two = ALL.slice(0, 2);
  const qs = buildQuiz({ entries: two, count: 2, seed: 'tiny' });
  for (const q of qs) assert.ok(q.options.length >= 2);
  assert.equal(buildQuestion(ALL[0], 'term', [ALL[0]], new Rng('x')), null, 'no distractors available');
  assert.deepEqual(buildQuiz({ entries: [ALL[0]], count: 1, seed: 'x' }), []);
});

test('restricting formats is honoured', () => {
  const qs = buildQuiz({ entries: ALL.slice(0, 30), count: 8, seed: 'k', pool: ALL, kinds: ['cloze'] });
  assert.ok(qs.length > 0 && qs.every((q) => q.kind === 'cloze'));
});

test('grading counts correct answers; unanswered is wrong', () => {
  const qs = buildQuiz({ entries: ALL.slice(0, 20), count: 4, seed: 'g', pool: ALL });
  const answers: Record<string, string> = {};
  qs.forEach((q, i) => {
    if (i < 2) answers[q.id] = q.correctId;
    else if (i === 2) answers[q.id] = q.options.find((o) => o.id !== q.correctId)!.id;
  });
  const res = gradeQuiz(qs, answers);
  assert.equal(res.correct, 2);
  assert.equal(res.total, 4);
  assert.equal(res.ratio, 0.5);
  assert.deepEqual(res.perEntry.map((p) => p.correct), [true, true, false, false]);
  assert.ok(isCorrect(qs[0], qs[0].correctId));
  assert.ok(!isCorrect(qs[0], 'zz'));
  assert.deepEqual(gradeQuiz([], {}), { correct: 0, total: 0, ratio: 0, perEntry: [] });
});

test('correct answers are not always in the same position', () => {
  const counts: Record<string, number> = {};
  for (let i = 0; i < 80; i++) {
    const q = buildQuestion(ALL[i], 'term', ALL, new Rng(`pos${i}`))!;
    counts[q.correctId] = (counts[q.correctId] ?? 0) + 1;
  }
  assert.ok(Object.keys(counts).length === 4, JSON.stringify(counts));
  for (const n of Object.values(counts)) assert.ok(n >= 8, JSON.stringify(counts));
});
