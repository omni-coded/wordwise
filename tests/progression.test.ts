import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generatePuzzle } from '../src/engine';
import { newSession, targetsOf, type SessionState } from '../src/engine';
import { poolFor } from '../src/content';
import {
  FREE_HINTS,
  GRID_THEMES,
  HIGHLIGHT_STYLES,
  HINT_COST,
  completionXp,
  consolationXp,
  coinsForCompletion,
  hintCost,
  isUnlocked,
  knowledgePoints,
  newUnlocks,
  precisionMet,
  quizRewards,
  rankFor,
  rankTitle,
  reviewRewards,
  starsAfterQuiz,
  starsBeforeQuiz,
} from '../src/game/progression';

const spec = (mode: 'campaign' | 'practice' = 'campaign', level = 1) => ({ seed: `p|${mode}|${level}`, mode, level, categoryId: 'finance' });
const puzzle = (mode: 'campaign' | 'practice' = 'campaign', level = 1) =>
  generatePuzzle(spec(mode, level), poolFor('finance'), { title: 't', theme: 'th', topicId: 'economy' });

function played(p: ReturnType<typeof puzzle>, over: Partial<SessionState> = {}): SessionState {
  const found = targetsOf(p).map((t) => t.entryId);
  return { ...newSession(p), found, attempts: found.length, correct: found.length, status: 'complete', ...over };
}

test('XP rewards completion, discovery and precision, and never speed', () => {
  const p = puzzle();
  const targets = targetsOf(p).length;
  const slow = completionXp({ puzzle: p, session: played(p, { elapsedMs: 3_600_000 }), newWords: 0 });
  const fast = completionXp({ puzzle: p, session: played(p, { elapsedMs: 5_000 }), newWords: 0 });
  assert.deepEqual(slow, fast, 'elapsed time has no effect');
  assert.equal(slow.base, 30 + 5 * targets);
  assert.equal(slow.precision, Math.round(slow.base * 0.2));
  assert.equal(slow.unassisted, Math.round(slow.base * 0.1));
  assert.equal(slow.total, slow.base + slow.precision + slow.unassisted);

  const sloppy = completionXp({ puzzle: p, session: played(p, { attempts: targets * 3, hintsUsed: 4 }), newWords: 3 });
  assert.equal(sloppy.precision, 0);
  assert.equal(sloppy.unassisted, 0);
  assert.equal(sloppy.discovery, 12);
  assert.ok(sloppy.total > sloppy.base, 'discovery still pays');

  const bonus = completionXp({ puzzle: p, session: played(p, { bonusFound: ['a', 'b'] }), newWords: 0 });
  assert.equal(bonus.bonusWords, 30);
});

test('special levels and practice scale XP', () => {
  const normal = completionXp({ puzzle: puzzle('campaign', 24), session: played(puzzle('campaign', 24)), newWords: 0 });
  const gauntlet = puzzle('campaign', 25); // gauntlet: ×2
  const g = completionXp({ puzzle: gauntlet, session: played(gauntlet), newWords: 0 });
  assert.ok(g.base > normal.base * 1.8, `${g.base} vs ${normal.base}`);

  const pr = puzzle('practice');
  const cp = puzzle('campaign');
  const a = completionXp({ puzzle: pr, session: played(pr), newWords: 5 });
  const b = completionXp({ puzzle: cp, session: played(cp), newWords: 5 });
  assert.ok(a.total < b.total * 0.75);
});

test('stars: finish, be precise, then know what you found', () => {
  const p = puzzle();
  const clean = played(p);
  assert.equal(starsBeforeQuiz(clean), 2);
  assert.ok(precisionMet(clean));
  const guessy = played(p, { attempts: 40, correct: 11 });
  assert.equal(starsBeforeQuiz(guessy), 1);
  const hinted = played(p, { hintsUsed: FREE_HINTS + 1 });
  assert.equal(starsBeforeQuiz(hinted), 1);
  assert.equal(starsBeforeQuiz(played(p, { hintsUsed: FREE_HINTS })), 2, 'free hints do not cost the star');

  assert.equal(starsAfterQuiz(2, 0.6), 3);
  assert.equal(starsAfterQuiz(2, 0.59), 2);
  assert.equal(starsAfterQuiz(2, null), 2);
  assert.equal(starsAfterQuiz(1, 1), 2);
  assert.equal(starsAfterQuiz(3, 0), 3);
});

test('hints are free at first, then cost coins', () => {
  assert.equal(hintCost({ hintsUsed: 0 }), 0);
  assert.equal(hintCost({ hintsUsed: FREE_HINTS - 1 }), 0);
  assert.equal(hintCost({ hintsUsed: FREE_HINTS }), HINT_COST);
  assert.equal(hintCost({ hintsUsed: 9 }), HINT_COST);
});

test('coin and quiz rewards', () => {
  assert.equal(coinsForCompletion(1, 0), 7);
  assert.equal(coinsForCompletion(3, 2), 15);
  assert.deepEqual(quizRewards(3, 5), { xp: 30, coins: 3 });
  assert.deepEqual(quizRewards(5, 5), { xp: 70, coins: 8 });
  assert.deepEqual(quizRewards(2, 2), { xp: 20, coins: 2 }, 'no perfect bonus on tiny quizzes');
  assert.deepEqual(quizRewards(0, 5), { xp: 0, coins: 0 });
  assert.deepEqual(reviewRewards(10, 10), { xp: 95, coins: 7 });
  assert.deepEqual(reviewRewards(3, 10), { xp: 24, coins: 1 });
  assert.equal(knowledgePoints(4), 40);
});

test('a timed-out challenge still pays for what was learned', () => {
  const p = puzzle();
  const s = { ...newSession(p), found: ['a', 'b', 'c'], bonusFound: ['d'] };
  assert.equal(consolationXp(s, 2), 9 + 5 + 8);
  assert.equal(consolationXp(newSession(p), 0), 0);
});

test('ranks climb monotonically and continue forever', () => {
  assert.equal(rankFor(0).title, 'Newcomer');
  assert.equal(rankFor(199).index, 0);
  assert.equal(rankFor(200).title, 'Curious Mind');
  assert.equal(rankFor(-50).index, 0);
  assert.equal(rankFor(Number.NaN).index, 0);
  let prev = -1;
  for (let xp = 0; xp <= 200_000; xp += 250) {
    const r = rankFor(xp);
    assert.ok(r.index >= prev);
    assert.ok(r.floor <= xp && xp < r.next, `xp ${xp} outside [${r.floor}, ${r.next})`);
    assert.ok(r.progress >= 0 && r.progress < 1);
    prev = r.index;
  }
  assert.equal(rankFor(38_000).title, 'Laureate');
  assert.equal(rankFor(50_000).title, 'Laureate 2');
  assert.equal(rankTitle(13), 'Laureate 3');
  assert.ok(rankFor(1e9).index > 12);
});

test('unlockables are tied to rank, with defaults always open', () => {
  assert.ok(isUnlocked(GRID_THEMES[0], 0));
  assert.ok(isUnlocked(HIGHLIGHT_STYLES[0], 0));
  const midnight = GRID_THEMES.find((t) => t.id === 'midnight')!;
  assert.ok(!isUnlocked(midnight, 199));
  assert.ok(isUnlocked(midnight, 200));
  assert.deepEqual(newUnlocks(0, 100), []);
  assert.deepEqual(newUnlocks(150, 250).map((u) => u.id), ['midnight']);
  assert.deepEqual(newUnlocks(0, 700).map((u) => u.id).sort(), ['marker', 'midnight', 'parchment']);
  assert.deepEqual(newUnlocks(500, 100), []);
  const ids = [...GRID_THEMES, ...HIGHLIGHT_STYLES].map((u) => u.id);
  assert.equal(new Set(ids).size, ids.length);
});
