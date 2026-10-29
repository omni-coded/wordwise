import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allEntries, clearPacks, getCategory, getEntry, listPacks } from '../src/content';
import { JOURNEYS, MASTERY_QUESTIONS } from '../src/content/journeys';
import { cellsOf, targetsOf, bonusesOf } from '../src/engine';
import {
  MAX_TICK_MS,
  abandonGame,
  ackBadges,
  addPack,
  answerReviewQuestion,
  answerSummaryQuestion,
  applySelection,
  beginGame,
  closeReview,
  completeOnboarding,
  dailyKeyOf,
  dismissSummary,
  hasActiveGame,
  meetWord,
  pauseGame,
  removePack,
  restartGame,
  resumeGame,
  retryMastery,
  startReview,
  tickGame,
  toggleFavorite,
  updateSettings,
  useHint,
} from '../src/game/actions';
import { buildPuzzle, campaignPlan, dailyPlan, expertPlan, journeyPlan, practicePlan, type PlanContext } from '../src/game/factory';
import { FREE_HINTS, HINT_COST, rankFor } from '../src/game/progression';
import { emptySave, type SaveData } from '../src/game/state';
import { sanitizeSave } from '../src/game/storage';
import { dayNumber } from '../src/game/dates';
import { review as srsReview } from '../src/game/srs';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const T = at(2026, 10, 29);

const ctxOf = (s: SaveData, now = T): PlanContext => ({
  enabled: s.settings.enabledCategories,
  words: s.words,
  today: dayNumber(new Date(now).toISOString().slice(0, 10)),
  level: s.campaign.level,
});

function start(save: SaveData, level = save.campaign.level, now = T): SaveData {
  return beginGame(save, buildPuzzle(campaignPlan(level, ctxOf(save, now))), now);
}

/** Finds every target word, returning the final save. */
function findAll(save: SaveData, now = T): SaveData {
  let s = save;
  for (const p of targetsOf(s.game!.puzzle)) {
    if (s.game!.state.found.includes(p.entryId)) continue;
    const out = applySelection(s, cellsOf(p), now);
    assert.equal(out.result.kind, 'found');
    s = out.save;
  }
  return s;
}

function answerAll(save: SaveData, correct: boolean | ((i: number) => boolean), now = T): SaveData {
  let s = save;
  const qs = s.summary!.quiz!.questions;
  qs.forEach((q, i) => {
    const wantRight = typeof correct === 'function' ? correct(i) : correct;
    const opt = wantRight ? q.correctId : q.options.find((o) => o.id !== q.correctId)!.id;
    s = answerSummaryQuestion(s, q.id, opt, now).save;
  });
  return s;
}

test('a first puzzle: finding every word completes it and writes a learning summary', () => {
  let s = start(emptySave(T));
  assert.ok(hasActiveGame(s));
  const puzzle = s.game!.puzzle;
  const n = targetsOf(puzzle).length;

  const [a, ...rest] = targetsOf(puzzle);
  const first = applySelection(s, cellsOf(a), T);
  assert.equal(first.result.kind, 'found');
  assert.equal(first.completed, false);
  assert.ok(first.save.words[a.entryId], 'the word is recorded the moment it is found');
  assert.equal(first.save.stats.wordsFound, 1);
  assert.deepEqual(first.save.game!.fresh, [a.entryId]);

  s = first.save;
  for (const p of rest.slice(0, -1)) s = applySelection(s, cellsOf(p), T).save;
  const last = applySelection(s, cellsOf(rest[rest.length - 1]), T);
  assert.equal(last.completed, true);
  s = last.save;

  assert.equal(s.game, null);
  const sum = s.summary!;
  assert.ok(sum);
  assert.equal(sum.outcome, 'complete');
  assert.equal(sum.mode, 'campaign');
  assert.equal(sum.level, 1);
  assert.equal(sum.words.length, n);
  assert.ok(sum.words.every((w) => w.isNew && !w.bonus));
  assert.equal(sum.xp!.discovery, 4 * n);
  assert.equal(sum.xpTotal, sum.xp!.total);
  assert.equal(s.stats.xp, sum.xp!.total);
  assert.equal(s.stats.coins, sum.coins);
  assert.equal(sum.starsPre, 2, 'clean play earns two stars');
  assert.equal(sum.stars, 2);
  assert.equal(s.stats.stars, 2);
  assert.equal(s.stats.puzzles, 1);
  assert.equal(s.stats.cleanSweeps, 1);
  assert.equal(s.stats.unassisted, 1);
  assert.equal(s.campaign.level, 2);
  assert.equal(s.campaign.stars['1'], 2);
  assert.equal(Object.keys(s.words).length, n);
  assert.equal(sum.streak, 1);
  assert.ok(s.achievements['first-word'] && s.achievements['first-puzzle']);
  assert.ok(s.unseenBadges.includes('first-puzzle'));
  assert.equal(s.activity['2026-10-29'].puzzles, 1);
  assert.ok(sum.quiz && sum.quiz.questions.length === 3 && !sum.quiz.done);
  assert.equal(s.stats.byCategory[puzzle.categoryId].puzzles, 1);
  assert.equal(s.stats.byCategory[puzzle.categoryId].found, n);
  assert.equal(rankFor(s.stats.xp).index, sum.rankAfter);
});

test('wrong, short and repeated selections are handled without rewarding them', () => {
  let s = start(emptySave(T));
  const p = targetsOf(s.game!.puzzle)[0];
  const cells = cellsOf(p);

  const tiny = applySelection(s, cells.slice(0, 2), T);
  assert.equal(tiny.result.kind, 'short');
  assert.equal(tiny.save.game!.state.attempts, 0);

  const wrong = applySelection(s, cells.slice(0, 3), T);
  assert.equal(wrong.result.kind, 'miss');
  assert.equal(wrong.save.game!.state.attempts, 1);
  s = wrong.save;

  s = applySelection(s, cells, T).save;
  const again = applySelection(s, cells, T);
  assert.equal(again.result.kind, 'duplicate');
  assert.equal(again.save.stats.wordsFound, 1, 'a duplicate is not counted twice');
  assert.equal(again.save.game!.state.found.length, 1);
});

test('misses and hints cost the precision star but the puzzle still completes', () => {
  let s = start(emptySave(T));
  const p0 = targetsOf(s.game!.puzzle)[0];
  for (let i = 0; i < 6; i++) s = applySelection(s, cellsOf(p0).slice(0, 3), T).save; // six wrong guesses
  s = findAll(s);
  assert.equal(s.summary!.starsPre, 1);
  assert.equal(s.summary!.xp!.precision, 0);
  assert.equal(s.stats.cleanSweeps, 0);
  assert.ok(s.summary!.misses >= 6);
});

test('bonus words are rewarded separately and never required', () => {
  let s = start(emptySave(T));
  const bonus = bonusesOf(s.game!.puzzle)[0];
  const out = applySelection(s, cellsOf(bonus), T);
  assert.equal(out.result.kind, 'bonus');
  s = out.save;
  assert.equal(s.game!.state.bonusFound.length, 1);
  assert.equal(s.stats.bonusFound, 1);
  assert.equal(s.game!.state.status, 'playing');
  s = findAll(s);
  assert.equal(s.summary!.xp!.bonusWords, 15);
  assert.ok(s.summary!.words.some((w) => w.bonus));
});

test('hints: free at first, then paid in coins; a refused hint changes nothing', () => {
  let s = start(emptySave(T));
  for (let i = 0; i < FREE_HINTS; i++) {
    const h = useHint(s, T);
    assert.ok(h.ok);
    if (h.ok) {
      assert.equal(h.cost, 0);
      s = h.save;
    }
  }
  assert.equal(s.game!.state.hintsUsed, FREE_HINTS);
  const refused = useHint(s, T);
  assert.deepEqual(refused, { ok: false, reason: 'coins' });

  s = { ...s, stats: { ...s.stats, coins: HINT_COST + 3 } };
  const paid = useHint(s, T);
  assert.ok(paid.ok);
  if (paid.ok) {
    assert.equal(paid.cost, HINT_COST);
    assert.equal(paid.save.stats.coins, 3);
    assert.equal(paid.save.game!.state.hintsUsed, FREE_HINTS + 1);
    assert.ok(targetsOf(paid.save.game!.puzzle).some((t) => t.entryId === paid.placement.entryId));
  }
  assert.deepEqual(useHint(emptySave(T), T), { ok: false, reason: 'no-game' });
  assert.deepEqual(useHint(pauseGame(s, T), T), { ok: false, reason: 'paused' });
});

test('pausing blocks play and the clock; resuming restores both', () => {
  let s = start(emptySave(T));
  s = tickGame(s, 1000, T);
  assert.equal(s.game!.state.elapsedMs, 1000);
  s = pauseGame(s, T);
  assert.equal(tickGame(s, 1000, T), s, 'no change while paused');
  const p = targetsOf(s.game!.puzzle)[0];
  const blocked = applySelection(s, cellsOf(p), T);
  assert.equal(blocked.result.kind, 'short');
  assert.equal(blocked.save.stats.wordsFound, 0);
  s = resumeGame(s, T);
  assert.equal(applySelection(s, cellsOf(p), T).result.kind, 'found');
  assert.equal(pauseGame(emptySave(T), T).game, null);
});

test('the clock ignores huge jumps and negative deltas', () => {
  let s = start(emptySave(T));
  s = tickGame(s, 10 * 60_000, T);
  assert.equal(s.game!.state.elapsedMs, MAX_TICK_MS);
  const same = tickGame(s, -5, T);
  assert.equal(same, s);
  assert.equal(tickGame(s, 0, T), s);
});

test('restart wipes progress in the puzzle but keeps coins spent', () => {
  let s = start({ ...emptySave(T), stats: { ...emptySave(T).stats, coins: 50 } });
  s = findAll({ ...s, game: { ...s.game!, state: { ...s.game!.state } } }, T);
  s = start(emptySave(T));
  const p = targetsOf(s.game!.puzzle)[0];
  s = applySelection(s, cellsOf(p), T).save;
  s = tickGame(s, 3000, T);
  const r = restartGame(s, T);
  assert.equal(r.game!.state.found.length, 0);
  assert.equal(r.game!.state.elapsedMs, 0);
  assert.deepEqual(r.game!.fresh, []);
  assert.equal(r.game!.puzzle, s.game!.puzzle);
  assert.equal(abandonGame(r, T).game, null);
});

test('Fact Challenge: answers feed spaced repetition, score the third star and pay out', () => {
  let s = findAll(start(emptySave(T)));
  const sum0 = s.summary!;
  const xpBefore = s.stats.xp;
  const q0 = sum0.quiz!.questions[0];

  const wrongOpt = q0.options.find((o) => o.id !== q0.correctId)!.id;
  const missed = answerSummaryQuestion(s, q0.id, wrongOpt, T);
  assert.equal(missed.correct, false);
  assert.equal(missed.save.words[q0.entryId].box, 0, 'a wrong answer keeps the word in box 0');
  assert.equal(missed.save.words[q0.entryId].wrong, 1);
  assert.equal(answerSummaryQuestion(missed.save, q0.id, q0.correctId, T).correct, null, 'cannot answer twice');
  assert.equal(answerSummaryQuestion(s, 'nope', 'a', T).correct, null);
  assert.equal(answerSummaryQuestion(s, q0.id, 'zz', T).correct, null);

  s = answerAll(s, true);
  const sum = s.summary!;
  assert.ok(sum.quiz!.done);
  assert.equal(sum.quiz!.correct, 3);
  assert.equal(sum.stars, 3);
  assert.equal(s.stats.stars, 3);
  assert.equal(s.stats.threeStars, 1);
  assert.equal(s.campaign.stars['1'], 3);
  assert.equal(s.stats.quizzes, 1);
  assert.equal(s.stats.perfectQuizzes, 1);
  assert.equal(s.stats.quizCorrect, 3);
  assert.equal(sum.xpTotal, sum0.xpTotal + 50, '3 × 10 + 20 perfect');
  assert.equal(s.stats.xp, xpBefore + 50);
  assert.equal(sum.coins, sum0.coins + 6);
  const firstAnswered = sum.quiz!.questions[0].entryId;
  assert.equal(s.words[firstAnswered].box, 1, 'first correct answer moves the word up');
  assert.ok(s.achievements['first-quiz'] && s.achievements['recall-perfect']);

  // already finished: further answers are ignored
  assert.equal(answerSummaryQuestion(s, q0.id, q0.correctId, T).correct, null);
});

test('a poor Fact Challenge pays less and leaves the star count alone', () => {
  let s = findAll(start(emptySave(T)));
  s = answerAll(s, (i) => i === 0);
  assert.equal(s.summary!.quiz!.correct, 1);
  assert.equal(s.summary!.stars, 2);
  assert.equal(s.stats.threeStars, 0);
  assert.equal(s.summary!.xpTotal, s.summary!.xp!.total + 10);
});

test('the summary can be dismissed, and a new game replaces a stale one', () => {
  let s = findAll(start(emptySave(T)));
  assert.ok(s.summary);
  assert.equal(dismissSummary(s, T).summary, null);
  s = start(s, 2);
  assert.equal(s.summary, null);
  assert.equal(s.game!.puzzle.level, 2);
  assert.equal(dismissSummary(emptySave(T), T).summary, null);
});

test('campaign levels advance one at a time and never go backwards', () => {
  let s = emptySave(T);
  for (let lvl = 1; lvl <= 3; lvl++) {
    s = findAll(start(s));
    s = dismissSummary(s, T);
    assert.equal(s.campaign.level, lvl + 1);
  }
  const replay = findAll(start(s, 1));
  assert.equal(replay.campaign.level, 4, 'replaying an old level cannot lower progress');
});

test('streaks build across days and are remembered after a gap', () => {
  let s = emptySave(at(2026, 10, 26));
  const days = [26, 27, 28];
  for (const d of days) {
    const now = at(2026, 10, d);
    s = dismissSummary(findAll(start(s, s.campaign.level, now), now), now);
  }
  assert.equal(s.stats.bestDailyStreak, 3);
  assert.ok(s.achievements['streak-3'], 'three in a row');
  assert.equal(s.stats.bestWeeklyStreak, 1, 'three active days in one week');
  assert.ok(!s.achievements['streak-7']);

  // a gap does not erase the best streak, and a new day starts again
  const later = at(2026, 11, 3);
  s = dismissSummary(findAll(start(s, s.campaign.level, later), later), later);
  assert.equal(s.stats.bestDailyStreak, 3);
  assert.equal(s.summary, null);
});

test('timed Expert Challenges can run out, and what was found still teaches', () => {
  let save = emptySave(T);
  save = { ...save, campaign: { ...save.campaign, level: 12 } };
  let s = beginGame(save, buildPuzzle(expertPlan(0, ctxOf(save))), T);
  assert.ok(s.game!.limitMs && s.game!.limitMs > 60_000);
  const p = targetsOf(s.game!.puzzle)[0];
  s = applySelection(s, cellsOf(p), T).save;
  for (let i = 0; i < 400 && s.game; i++) s = tickGame(s, MAX_TICK_MS, T);
  assert.equal(s.game, null, 'the challenge ended');
  const sum = s.summary!;
  assert.equal(sum.outcome, 'timeout');
  assert.equal(sum.quiz, null);
  assert.equal(sum.stars, 0);
  assert.equal(sum.words.length, 1);
  assert.equal(s.stats.xp, 3 + 4, 'consolation: 3 per word + 4 for discovering it');
  assert.equal(s.campaign.level, 12, 'no level progress');
  assert.equal(s.stats.expertDone, 0);
  assert.ok(s.words[p.entryId]);
});

test('untimed Expert Challenges never run out', () => {
  const save = updateSettings(emptySave(T), { expertTimed: false }, T);
  const s = beginGame(save, buildPuzzle(expertPlan(1, ctxOf(save))), T);
  assert.equal(s.game!.limitMs, null);
  let t = s;
  for (let i = 0; i < 400; i++) t = tickGame(t, MAX_TICK_MS, T);
  assert.ok(t.game);
  const done = findAll(t);
  assert.equal(done.summary!.outcome, 'complete');
  assert.equal(done.stats.expertDone, 1);
  assert.ok(done.achievements['expert-1']);
});

test('practice earns reduced XP and no campaign progress', () => {
  const save = emptySave(T);
  const plan = practicePlan({ categoryId: 'finance', level: 1, serial: 1 }, ctxOf(save));
  const practice = findAll(beginGame(save, buildPuzzle(plan), T));
  const campaign = findAll(start(emptySave(T)));
  assert.ok(practice.summary!.xpTotal < campaign.summary!.xpTotal);
  assert.equal(practice.campaign.level, 1);
});

test('the daily challenge: one result per date, questions identical for everyone', () => {
  const key = '2026-10-29';
  const player = (bonusFirst: boolean) => {
    let s = beginGame(emptySave(T), buildPuzzle(dailyPlan(key)), T);
    assert.equal(dailyKeyOf(s.game!.puzzle), key);
    if (bonusFirst) s = applySelection(s, cellsOf(bonusesOf(s.game!.puzzle)[0]), T).save;
    return findAll(s);
  };
  const a = player(false);
  const b = player(true);
  assert.deepEqual(a.summary!.quiz!.questions, b.summary!.quiz!.questions, 'same seed, same questions');
  assert.equal(a.summary!.quiz!.questions.length, 5);
  assert.ok(a.daily[key]);
  assert.equal(a.stats.dailyDone, 1);
  assert.equal(a.campaign.level, 1, 'daily play does not move the campaign');
  const before = a.daily[key].score;
  const done = answerAll(a, true);
  assert.ok(done.daily[key].score > before);
  assert.equal(done.daily[key].quizCorrect, 5);
  assert.equal(done.daily[key].quizTotal, 5);
  assert.equal(done.summary!.dailyScore, done.daily[key].score);
  assert.ok(done.achievements['daily-1']);
  assert.equal(dailyKeyOf(start(emptySave(T)).game!.puzzle), undefined);
});

test('journeys: steps unlock in order, stars are kept, and mastery needs a passing quiz', () => {
  const j = JOURNEYS[0];
  const cat = getCategory(j.categoryId)!;
  let s = emptySave(T);
  for (let step = 0; step < j.steps.length; step++) {
    s = beginGame(s, buildPuzzle(journeyPlan(j, step, ctxOf(s))), T);
    s = findAll(s);
    assert.equal(s.journeys[j.id].next, step + 1);
    assert.equal(s.summary!.journeyStep, step);
    assert.equal(s.summary!.journeyDone, step === j.steps.length - 1 ? true : undefined);
    if (step === 0) {
      s = answerAll(s, true);
      assert.equal(s.journeys[j.id].stars[0], 3, 'quiz stars are written back to the journey');
    }
    s = dismissSummary(s, T);
  }
  assert.ok(s.achievements['journey-1']);
  assert.equal(s.campaign.level, 1, 'journey play does not move the campaign');

  // mastery
  s = beginGame(s, buildPuzzle(journeyPlan(j, 'mastery', ctxOf(s))), T);
  s = findAll(s);
  assert.equal(s.summary!.mastery, true);
  assert.equal(s.journeys[j.id].mastery, false, 'not until the quiz is passed');
  assert.equal(s.summary!.quiz!.kind, 'mastery');
  assert.equal(s.summary!.quiz!.questions.length, MASTERY_QUESTIONS);
  assert.ok(s.summary!.quiz!.questions.every((q) => cat.entries.some((e) => e.id === q.entryId)));
  assert.equal(retryMastery(s, T), s, 'nothing to retry yet');

  s = answerAll(s, (i) => i < 3); // 3/8 = fail
  assert.equal(s.summary!.masteryResult, 'fail');
  assert.equal(s.journeys[j.id].mastery, false);
  assert.equal(s.journeys[j.id].masteryAttempts, 1);
  s = retryMastery(s, T);
  assert.equal(s.summary!.masteryResult, undefined);
  assert.equal(s.summary!.quiz!.attempt, 1);
  assert.deepEqual(s.summary!.quiz!.answers, {});
  const xpBefore = s.stats.xp;
  s = answerAll(s, true);
  assert.equal(s.summary!.masteryResult, 'pass');
  assert.equal(s.journeys[j.id].mastery, true);
  assert.equal(s.journeys[j.id].masteryAttempts, 2);
  assert.ok(s.stats.xp >= xpBefore + 100, 'passing pays a mastery bonus');
  assert.ok(s.achievements['mastery-1']);
});

test('Smart Review quizzes only the words that are due and rewards a finished session', () => {
  let s = emptySave(T);
  const ids = allEntries().slice(0, 12).map((e) => e.id);
  const today = dayNumber('2026-10-29');
  s = {
    ...s,
    words: Object.fromEntries(
      ids.map((id, i) => [id, { firstFound: 1, timesFound: 1, box: i % 3, due: i < 8 ? today - 1 : today + 5, right: 0, wrong: 0, favorite: false }]),
    ),
  };
  s = startReview(s, T);
  const rev = s.review!;
  assert.equal(rev.questions.length, 8);
  assert.ok(rev.questions.every((q) => ids.slice(0, 8).includes(q.entryId)));

  let right = 0;
  rev.questions.forEach((q, i) => {
    const good = i % 4 !== 0;
    if (good) right++;
    const opt = good ? q.correctId : q.options.find((o) => o.id !== q.correctId)!.id;
    const out = answerReviewQuestion(s, q.id, opt, T);
    assert.equal(out.finished, i === rev.questions.length - 1);
    s = out.save;
  });
  assert.ok(s.review!.done);
  assert.equal(s.review!.correct, right);
  assert.equal(s.stats.reviews, 1);
  assert.equal(s.stats.reviewCorrect, right);
  assert.equal(s.activity['2026-10-29'].reviews, 1);
  assert.ok(s.stats.xp >= right * 8);
  assert.ok(s.achievements['first-review']);
  rev.questions.forEach((q, i) => {
    const w = s.words[q.entryId];
    if (i % 4 === 0) assert.equal(w.box, 0, 'missed words drop back');
    else assert.ok(w.due > today, 'answered words are rescheduled');
  });
  assert.equal(answerReviewQuestion(s, rev.questions[0].id, 'a', T).correct, null, 'finished');
  assert.equal(closeReview(s, T).review, null);

  assert.equal(startReview(emptySave(T), T).review, null, 'nothing due, nothing started');
});

test('journal: favourites toggle only for words the player has met', () => {
  let s = emptySave(T);
  const id = allEntries()[3].id;
  assert.equal(toggleFavorite(s, id, T), s);
  s = meetWord(s, id, T);
  assert.ok(s.words[id]);
  assert.equal(meetWord(s, id, T), s, 'already met');
  assert.equal(meetWord(s, 'nope', T), s);
  s = toggleFavorite(s, id, T);
  assert.equal(s.words[id].favorite, true);
  s = toggleFavorite(s, id, T);
  assert.equal(s.words[id].favorite, false);
});

test('settings: values are validated and locked cosmetics cannot be selected', () => {
  let s = emptySave(T);
  s = updateSettings(s, { theme: 'dark', textSize: 'large', sound: false }, T);
  assert.equal(s.settings.theme, 'dark');
  assert.equal(s.settings.textSize, 'large');
  assert.equal(s.settings.sound, false);
  s = updateSettings(s, { gridTheme: 'ink', highlightStyle: 'glow' }, T);
  assert.equal(s.settings.gridTheme, 'ivory', 'ink needs a high rank');
  assert.equal(s.settings.highlightStyle, 'capsule');
  s = { ...s, stats: { ...s.stats, xp: 30_000 } };
  s = updateSettings(s, { gridTheme: 'ink', highlightStyle: 'glow' }, T);
  assert.equal(s.settings.gridTheme, 'ink');
  assert.equal(s.settings.highlightStyle, 'glow');
  s = updateSettings(s, { theme: 'neon' as never, sfxVolume: 9 }, T);
  assert.equal(s.settings.theme, 'system');
  assert.equal(s.settings.sfxVolume, 1);
});

test('onboarding and badge acknowledgement', () => {
  let s = emptySave(T);
  assert.equal(s.onboarded, false);
  s = completeOnboarding(s, T);
  assert.equal(s.onboarded, true);
  assert.equal(completeOnboarding(s, T), s);
  s = { ...s, unseenBadges: ['first-word'] };
  assert.deepEqual(ackBadges(s).unseenBadges, []);
  const same = ackBadges(emptySave(T));
  assert.deepEqual(same.unseenBadges, []);
});

test('content packs can be added and removed, and survive a round trip through the save', () => {
  clearPacks();
  const pack = {
    format: 'wordwise-pack',
    version: 1,
    category: {
      id: 'tiny',
      name: 'Tiny',
      shortName: 'Tiny',
      blurb: 'b',
      glyph: '+',
      references: [],
      topics: [{ id: 't', name: 'T', connection: 'c', rows: [['Quorum', 'KWOR-um', 3, 'The minimum number of members needed for a valid meeting.', 'The board lacked a quorum.', 'A fact.', 'A reason.']] }],
    },
  };
  let s = emptySave(T);
  const bad = addPack(s, '{ nope', T);
  assert.equal(bad.result.ok, false);
  assert.equal(bad.save, s);
  const good = addPack(s, JSON.stringify(pack), T);
  assert.ok(good.result.ok);
  s = good.save;
  assert.equal(s.packs.length, 1);
  assert.ok(getEntry('tiny-quorum'));
  s = addPack(s, pack, T).save;
  assert.equal(s.packs.length, 1, 'same id replaces rather than duplicates');
  s = updateSettings(s, { enabledCategories: ['tiny', 'science'] }, T);

  const reloaded = sanitizeSave(JSON.parse(JSON.stringify(s)), T);
  assert.equal(reloaded.packs.length, 1);

  s = removePack(s, 'tiny', T);
  assert.equal(s.packs.length, 0);
  assert.equal(getEntry('tiny-quorum'), undefined);
  assert.deepEqual(s.settings.enabledCategories, ['science']);
  assert.equal(listPacks().length, 0);
});

test('every state transition leaves a save that survives sanitising unchanged', () => {
  let s = start(emptySave(T));
  s = applySelection(s, cellsOf(targetsOf(s.game!.puzzle)[0]), T).save;
  s = pauseGame(s, T);
  const mid = sanitizeSave(JSON.parse(JSON.stringify(s)), T);
  assert.deepEqual(mid.game!.state, s.game!.state);
  assert.deepEqual(mid.words, s.words);
  s = findAll(resumeGame(s, T));
  const sum = sanitizeSave(JSON.parse(JSON.stringify(s)), T);
  assert.deepEqual(sum.summary, s.summary);
  assert.deepEqual(sum.stats, s.stats);
  assert.deepEqual(sum.achievements, s.achievements);
});

test('SRS: reviewing through the quiz does not let repeated runs farm progress', () => {
  const s0 = findAll(start(emptySave(T)));
  const q = s0.summary!.quiz!.questions[0];
  const rec = s0.words[q.entryId];
  const once = srsReview(rec, true, dayNumber('2026-10-29'));
  const twice = srsReview(once, true, dayNumber('2026-10-29'));
  assert.equal(once.box, 1);
  assert.equal(twice.box, 1);
});
