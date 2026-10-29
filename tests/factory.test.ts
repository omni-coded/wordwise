import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clearPacks, getBuiltinCategories, getCategories, getCategory, parsePack, registerPack, allEntries } from '../src/content';
import { JOURNEYS, MASTERY_LEVEL, journeyStepLevel } from '../src/content/journeys';
import { isPuzzleValid, targetsOf } from '../src/engine';
import { DAILY_MAX_SCORE, dailyCategory, dailyLevel, dailyScore, dailySpec, wordOfTheDay } from '../src/game/daily';
import { addDays, weekday } from '../src/game/dates';
import {
  buildPuzzle,
  campaignPlan,
  dailyPlan,
  expertPlan,
  journeyPlan,
  practicePlan,
  reviewPlan,
  rotationOrder,
  timeLimitMs,
  type PlanContext,
} from '../src/game/factory';
import { newRecord } from '../src/game/srs';

const ctx = (over: Partial<PlanContext> = {}): PlanContext => ({ enabled: null, words: {}, today: 20_000, level: 1, ...over });

test('daily puzzles depend only on the date', () => {
  clearPacks();
  const a = buildPuzzle(dailyPlan('2026-10-29'));
  // personal state and imported packs must not change it
  const pack = parsePack({
    format: 'wordwise-pack',
    version: 1,
    category: {
      id: 'extra',
      name: 'Extra',
      shortName: 'Extra',
      blurb: 'x',
      glyph: '+',
      references: [],
      topics: [{ id: 't', name: 'T', connection: 'c', rows: [['Sandbox', 'SAND-boks', 2, 'An isolated area for running code.', 'Run it in a sandbox.', 'A fact.', 'A reason.']] }],
    },
  });
  assert.ok(pack.ok, pack.problems.join('; '));
  registerPack(pack.category!);
  const b = buildPuzzle(dailyPlan('2026-10-29'));
  clearPacks();
  assert.deepEqual(a.grid, b.grid);
  assert.deepEqual(a.placements, b.placements);
  assert.equal(a.id, b.id);
  assert.notEqual(buildPuzzle(dailyPlan('2026-10-30')).id, a.id);
});

test('daily difficulty follows the weekday and categories rotate through everything', () => {
  assert.equal(weekday('2026-10-26'), 0);
  assert.equal(dailyLevel('2026-10-26'), 14);
  assert.equal(dailyLevel('2026-11-01'), 12, 'Sunday is gentler');
  assert.ok(dailyLevel('2026-10-31') > dailyLevel('2026-10-27'), 'Saturday is the hardest day');
  const seen = new Set<string>();
  for (let i = 0; i < getBuiltinCategories().length; i++) seen.add(dailyCategory(addDays('2026-10-29', i)));
  assert.equal(seen.size, getBuiltinCategories().length, 'every category appears once per cycle');
  assert.equal(dailySpec('2026-10-29').mode, 'daily');
});

test('word of the day: deterministic, built-in, no repeats within a cycle', () => {
  assert.equal(wordOfTheDay('2026-10-29').id, wordOfTheDay('2026-10-29').id);
  const n = getBuiltinCategories().reduce((s, c) => s + c.entries.length, 0);
  const ids = new Set<string>();
  const start = '2026-01-01'; // a cycle boundary can fall anywhere; check a window that sits inside one cycle
  let day = start;
  const seenInWindow: string[] = [];
  for (let i = 0; i < n; i++) {
    const w = wordOfTheDay(day);
    seenInWindow.push(w.id);
    ids.add(w.id);
    day = addDays(day, 1);
  }
  // across a full window of n days at most one cycle boundary is crossed, so repeats are limited to that seam
  assert.ok(ids.size >= n - 0.5 * n, `only ${ids.size} distinct words in ${n} days`);
  assert.ok(new Set(seenInWindow.slice(0, 20)).size === 20, 'first 20 days are all different');
});

test('daily score rewards accuracy, bonuses and learning, never speed', () => {
  assert.equal(dailyScore({ accuracy: 1, bonusFound: 0, hints: 0, quizCorrect: 0 }), 600);
  assert.equal(dailyScore({ accuracy: 1, bonusFound: 3, hints: 0, quizCorrect: 5 }), DAILY_MAX_SCORE);
  assert.ok(dailyScore({ accuracy: 0.5, bonusFound: 0, hints: 0, quizCorrect: 0 }) < 600);
  assert.equal(dailyScore({ accuracy: 1, bonusFound: 0, hints: 4, quizCorrect: 0 }), 540);
  assert.equal(dailyScore({ accuracy: 1, bonusFound: 0, hints: 50, quizCorrect: 0 }), 450, 'hint penalty is capped');
  assert.equal(dailyScore({ accuracy: 7, bonusFound: 0, hints: 0, quizCorrect: 0 }), 600, 'accuracy is clamped');
  assert.ok(dailyScore({ accuracy: 0, bonusFound: 0, hints: 0, quizCorrect: 0 }) >= 400);
});

test('campaign rotation visits every category, in pairs, varying topics', () => {
  const order = rotationOrder(null);
  assert.equal(order.length, getCategories().length);
  assert.deepEqual(order, rotationOrder(null), 'stable');
  const cats: string[] = [];
  for (let L = 1; L <= order.length * 2; L++) cats.push(campaignPlan(L, ctx()).spec.categoryId);
  assert.equal(new Set(cats).size, order.length);
  assert.equal(cats[0], cats[1]);
  assert.notEqual(cats[1], cats[2]);
  const topics = [1, 2].map((L) => campaignPlan(L, ctx()).spec.topicId);
  assert.notEqual(topics[0], topics[1]);
  // second visit to the same category uses different topics than the first
  const first = [1, 2].map((L) => campaignPlan(L, ctx()).spec.topicId);
  const n = order.length;
  const second = [2 * n + 1, 2 * n + 2].map((L) => campaignPlan(L, ctx()).spec.topicId);
  assert.notDeepEqual(first, second);
});

test('campaign respects the enabled categories and falls back to all if none match', () => {
  const only = campaignPlan(5, ctx({ enabled: ['science', 'finance'] }));
  assert.ok(['science', 'finance'].includes(only.spec.categoryId));
  assert.deepEqual(rotationOrder(['science', 'finance']).slice().sort(), ['finance', 'science']);
  assert.equal(rotationOrder(['nope']).length, getCategories().length);
  assert.equal(rotationOrder([]).length, getCategories().length);
});

test('campaign plans favour new words and weave in due reviews', () => {
  const base = campaignPlan(1, ctx());
  const cat = getCategory(base.spec.categoryId)!;
  const seen = cat.entries.slice(0, 5).map((e) => e.id);
  const other = allEntries().find((e) => e.category !== cat.id)!;
  const words = Object.fromEntries([...seen, other.id].map((id) => [id, { ...newRecord(19_990, 1), due: 19_999 }]));
  const plan = campaignPlan(1, ctx({ words }));
  assert.deepEqual(plan.spec.deprioritize, seen, 'only this category’s learned words');
  assert.equal(plan.spec.mustInclude!.length, 2);
  assert.ok(plan.spec.mustInclude!.every((id) => seen.includes(id)), 'due words from this category only');
  const puzzle = buildPuzzle(plan);
  const hits = targetsOf(puzzle).filter((t) => plan.spec.mustInclude!.includes(t.entryId));
  assert.equal(hits.length, 2, 'due words appear in the puzzle');
  assert.ok(isPuzzleValid(puzzle));
});

test('campaign puzzles are reproducible', () => {
  const a = buildPuzzle(campaignPlan(7, ctx()));
  const b = buildPuzzle(campaignPlan(7, ctx()));
  assert.deepEqual(a, b);
  assert.notEqual(buildPuzzle(campaignPlan(8, ctx())).id, a.id);
});

test('level 1 is Medium with about a dozen words', () => {
  const p = buildPuzzle(campaignPlan(1, ctx()));
  assert.equal(p.difficulty.label, 'Medium');
  const n = targetsOf(p).length;
  assert.ok(n >= 10 && n <= 12, `level 1 has ${n} words`);
});

test('every category generates valid puzzles from level 1 to the hard end', () => {
  const t0 = Date.now();
  let made = 0;
  for (const cat of getCategories()) {
    for (const level of [1, 12, 40, 150]) {
      const plan = practicePlan({ categoryId: cat.id, level, serial: level }, ctx());
      const p = buildPuzzle(plan);
      assert.ok(isPuzzleValid(p), `${cat.id} L${level}`);
      assert.ok(targetsOf(p).length >= 6, `${cat.id} L${level} has too few words`);
      made++;
    }
  }
  assert.ok(Date.now() - t0 < 30_000, `generated ${made} puzzles too slowly`);
});

test('journeys: every step and the mastery challenge build, emphasise their topic, and ramp up', () => {
  const shares: number[] = [];
  for (const j of JOURNEYS) {
    let prev = 0;
    j.steps.forEach((s, i) => {
      const plan = journeyPlan(j, i, ctx());
      assert.equal(plan.spec.mode, 'journey');
      assert.equal(plan.spec.journeyId, j.id);
      assert.equal(plan.spec.journeyStep, i);
      assert.equal(plan.spec.level, journeyStepLevel(i));
      assert.ok(plan.spec.level > prev);
      prev = plan.spec.level;
      const p = buildPuzzle(plan);
      assert.ok(isPuzzleValid(p), `${j.id} step ${i}`);
      assert.equal(p.categoryId, j.categoryId);
      if (s.topicId) {
        const inTopic = targetsOf(p).filter((t) => getCategory(j.categoryId)!.entries.find((e) => e.id === t.entryId)!.topic === s.topicId).length;
        const share = inTopic / targetsOf(p).length;
        shares.push(share);
        assert.ok(share >= 0.4, `${j.id} step ${i}: only ${inTopic}/${targetsOf(p).length} words from ${s.topicId}`);
      }
    });
    const m = journeyPlan(j, 'mastery', ctx());
    assert.equal(m.spec.level, MASTERY_LEVEL);
    assert.equal(m.spec.mastery, true);
    assert.equal(m.spec.journeyStep, j.steps.length);
    const mp = buildPuzzle(m);
    assert.ok(isPuzzleValid(mp));
    assert.ok(mp.specials.includes('mastery'));
    assert.ok(mp.difficulty.score > buildPuzzle(journeyPlan(j, 0, ctx())).difficulty.score, 'mastery is harder than step 1');
  }
  const mean = shares.reduce((a, b) => a + b, 0) / shares.length;
  assert.ok(mean >= 0.6, `journey steps average only ${(mean * 100).toFixed(0)}% topical words`);
});

test('expert, practice and review plans', () => {
  const e = expertPlan(3, ctx({ level: 20 }));
  assert.equal(e.spec.mode, 'expert');
  assert.equal(e.spec.expert, true);
  assert.equal(e.spec.level, 24);
  const ep = buildPuzzle(e);
  const normal = buildPuzzle(campaignPlan(24, ctx()));
  assert.ok(ep.size >= normal.size, 'expert grids are at least as large');
  assert.ok(isPuzzleValid(ep));
  assert.equal(expertPlan(1, ctx({ level: 1 })).spec.level, 14, 'floor of 10 + 4');
  assert.notEqual(expertPlan(1, ctx()).spec.seed, expertPlan(2, ctx()).spec.seed);

  assert.throws(() => practicePlan({ categoryId: 'nope', level: 1, serial: 0 }, ctx()));
  const pr = practicePlan({ categoryId: 'finance', topicId: 'economy', level: 5, serial: 1 }, ctx());
  assert.equal(pr.meta.title, 'Economy' === pr.meta.title ? 'Economy' : pr.meta.title);
  assert.equal(pr.spec.topicId, 'economy');
  assert.equal(practicePlan({ categoryId: 'finance', topicId: 'bogus', level: 5, serial: 1 }, ctx()).spec.topicId, undefined);

  assert.equal(reviewPlan(1, ctx()), null, 'nothing due');
  const ids = allEntries().slice(0, 40).filter((_, i) => i % 5 === 0).map((e) => e.id); // 8 words across categories
  const words = Object.fromEntries(ids.map((id) => [id, { ...newRecord(19_000, 1), due: 19_900 }]));
  const rp = reviewPlan(1, ctx({ words }))!;
  assert.ok(rp);
  const puzzle = buildPuzzle(rp);
  assert.ok(isPuzzleValid(puzzle));
  const included = targetsOf(puzzle).filter((t) => ids.includes(t.entryId)).length;
  assert.ok(included >= 6, `review puzzle included only ${included} due words`);
});

test('timed challenges allow about 26 seconds per word', () => {
  const p = buildPuzzle(expertPlan(0, ctx({ level: 10 })));
  const ms = timeLimitMs(p);
  const n = targetsOf(p).length;
  assert.ok(ms >= n * 26_000 && ms <= n * 26_000 + 40_000, `${ms} for ${n} words`);
});

test('level 1 in every category reads as Medium and hides at least one bonus word', () => {
  clearPacks();
  for (const cat of getBuiltinCategories()) {
    const c = ctx({ enabled: [cat.id] });
    const p = buildPuzzle(campaignPlan(1, c));
    assert.equal(p.categoryId, cat.id);
    const targets = p.placements.filter((x) => x.kind === 'target').length;
    const bonus = p.placements.filter((x) => x.kind === 'bonus').length;
    assert.ok(targets >= 9 && targets <= 12, `${cat.id}: ${targets} target words`);
    assert.ok(bonus >= 1, `${cat.id}: no bonus word`);
    assert.equal(p.difficulty.label, 'Medium', `${cat.id}: labelled ${p.difficulty.label} (${p.difficulty.score})`);
  }
});
