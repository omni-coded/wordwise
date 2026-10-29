import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allEntries, getCategories } from '../src/content';
import { JOURNEYS } from '../src/content/journeys';
import { achievementList, achievementStatuses, evaluateAchievements, ACHIEVEMENT_GROUPS } from '../src/game/achievements';
import { dayNumber } from '../src/game/dates';
import { activityStrip, allJourneyStatuses, categoryProgress, dailyHistory, journalItems, overview, statsView } from '../src/game/selectors';
import { emptySave, type SaveData } from '../src/game/state';
import { newRecord } from '../src/game/srs';

const T = new Date(2026, 9, 29, 12).getTime();
const TODAY = dayNumber('2026-10-29');

const withWords = (ids: string[], over: Partial<ReturnType<typeof newRecord>> = {}): SaveData => {
  const s = emptySave(T);
  s.words = Object.fromEntries(ids.map((id, i) => [id, { ...newRecord(TODAY - 3, T - i * 1000), ...over }]));
  return s;
};

test('overview summarises rank, streaks and what is due', () => {
  const s = emptySave(T);
  s.stats.xp = 700;
  s.stats.coins = 12;
  s.campaign.level = 5;
  s.activity = { '2026-10-28': { puzzles: 1, reviews: 0, xp: 10 }, '2026-10-29': { puzzles: 0, reviews: 1, xp: 5 } };
  s.words = { [allEntries()[0].id]: { ...newRecord(TODAY - 5, T), due: TODAY - 1 }, [allEntries()[1].id]: { ...newRecord(TODAY, T) } };
  const o = overview(s, T);
  assert.equal(o.rank.title, 'Word Seeker');
  assert.equal(o.dailyStreak, 2);
  assert.equal(o.streakStatus, 'active');
  assert.equal(o.due, 1);
  assert.equal(o.level, 5);
  assert.equal(o.discovered, 2);
  assert.equal(o.totalWords, allEntries().length);
  assert.equal(o.playedToday, true);
  assert.equal(overview(emptySave(T), T).playedToday, false);
});

test('category progress covers every category and topic', () => {
  const cat = getCategories()[0];
  const ids = cat.entries.slice(0, 6).map((e) => e.id);
  const prog = categoryProgress(withWords(ids));
  assert.equal(prog.length, getCategories().length);
  const first = prog[0];
  assert.equal(first.mastery.discovered, 6);
  assert.equal(first.topics.reduce((n, t) => n + t.discovered, 0), 6);
  assert.equal(first.topics.reduce((n, t) => n + t.total, 0), cat.entries.length);
  assert.equal(prog[1].mastery.discovered, 0);
});

test('journal search, filters and sorting', () => {
  const entries = allEntries().slice(0, 40);
  const s = withWords(entries.map((e) => e.id));
  s.words[entries[0].id] = { ...s.words[entries[0].id], favorite: true };
  s.words[entries[1].id] = { ...s.words[entries[1].id], box: 4, due: TODAY + 30 };
  assert.equal(journalItems(s, {}, T).length, 40);
  assert.equal(journalItems(s, { filter: 'favorites' }, T).length, 1);
  assert.equal(journalItems(s, { filter: 'mastered' }, T).length, 1);
  assert.equal(journalItems(s, { filter: 'due' }, T).length, 39, 'new words are due after 1 day');
  const byCat = journalItems(s, { categoryId: entries[0].category }, T);
  assert.ok(byCat.length > 0 && byCat.every((i) => i.entry.category === entries[0].category));

  const needle = entries[7].term.toLowerCase();
  const hits = journalItems(s, { text: needle }, T);
  assert.ok(hits.some((h) => h.entry.id === entries[7].id));
  assert.equal(journalItems(s, { text: 'zzzzqqq' }, T).length, 0);
  assert.ok(journalItems(s, { text: entries[7].definition.slice(5, 25) }, T).some((h) => h.entry.id === entries[7].id), 'searches definitions too');

  const alpha = journalItems(s, { sort: 'alphabetical' }, T).map((i) => i.entry.term);
  assert.deepEqual(alpha, alpha.slice().sort((a, b) => a.localeCompare(b)));
  const recent = journalItems(s, { sort: 'recent' }, T);
  assert.equal(recent[0].entry.id, entries[0].id, 'most recently found first');
  const hard = journalItems(s, { sort: 'difficulty' }, T);
  assert.ok(hard[0].entry.difficulty >= hard[hard.length - 1].entry.difficulty);
  const weak = journalItems(s, { sort: 'weakest' }, T);
  assert.ok(weak[0].box <= weak[weak.length - 1].box);

  s.words['gone-word'] = newRecord(TODAY, T);
  assert.equal(journalItems(s, {}, T).length, 40, 'records for removed words are ignored');
});

test('journey statuses track steps, stars and mastery', () => {
  const s = emptySave(T);
  s.journeys = { psychology: { next: 8, stars: [3, 2, 1, 3, 3, 2, 1, 3], mastery: false, masteryAttempts: 0 }, money: { next: 2, stars: [2, 3], mastery: false, masteryAttempts: 0 } };
  const all = allJourneyStatuses(s);
  assert.equal(all.length, JOURNEYS.length);
  const psych = all.find((j) => j.journey.id === 'psychology')!;
  assert.equal(psych.completedSteps, 8);
  assert.ok(psych.masteryUnlocked);
  assert.equal(psych.totalStars, 18);
  assert.equal(psych.maxStars, 24);
  const money = all.find((j) => j.journey.id === 'money')!;
  assert.equal(money.completedSteps, 2);
  assert.ok(!money.masteryUnlocked);
  const fresh = all.find((j) => j.journey.id === 'science')!;
  assert.equal(fresh.completedSteps, 0);
});

test('daily history is newest first and limited', () => {
  const s = emptySave(T);
  for (let d = 1; d <= 20; d++) {
    s.daily[`2026-10-${String(d).padStart(2, '0')}`] = { score: d, stars: 2, xp: 1, words: [], quizCorrect: 0, quizTotal: 0, completedAt: 0 };
  }
  const h = dailyHistory(s, 5);
  assert.deepEqual(h.map((x) => x.key), ['2026-10-20', '2026-10-19', '2026-10-18', '2026-10-17', '2026-10-16']);
});

test('stats view handles an empty save without dividing by zero', () => {
  const v = statsView(emptySave(T));
  assert.equal(v.accuracy, 1);
  assert.equal(v.quizAccuracy, null);
  assert.equal(v.avgMsPerPuzzle, null);
  const s = emptySave(T);
  s.stats = { ...s.stats, attempts: 100, misses: 20, quizAnswered: 8, quizCorrect: 6, reviewAnswered: 2, reviewCorrect: 2, puzzles: 4, playMs: 400_000 };
  const w = statsView(s);
  assert.equal(w.accuracy, 0.8);
  assert.equal(w.quizAccuracy, 0.8);
  assert.equal(w.avgMsPerPuzzle, 100_000);
});

test('activity strip spans the requested days, oldest first', () => {
  const s = emptySave(T);
  s.activity = { '2026-10-29': { puzzles: 2, reviews: 1, xp: 0 }, '2026-10-27': { puzzles: 1, reviews: 0, xp: 0 } };
  const strip = activityStrip(s, T, 7);
  assert.equal(strip.length, 7);
  assert.equal(strip[0].key, '2026-10-23');
  assert.equal(strip[6].key, '2026-10-29');
  assert.equal(strip[6].count, 3);
  assert.equal(strip[4].count, 1);
  assert.equal(strip[5].count, 0);
});

/* ──────────────────────────── achievements ──────────────────────────── */

test('achievements have unique ids, sensible goals and every group is used', () => {
  const list = achievementList();
  assert.ok(list.length >= 50);
  assert.equal(new Set(list.map((a) => a.id)).size, list.length);
  for (const a of list) {
    assert.ok(a.goal >= 1 && a.name && a.description && a.glyph, a.id);
    assert.ok(ACHIEVEMENT_GROUPS.includes(a.group), a.id);
  }
  for (const g of ACHIEVEMENT_GROUPS) assert.ok(list.some((a) => a.group === g), g);
  for (const n of [10, 25, 50, 100, 250, 500, 1000]) assert.ok(list.some((a) => a.id === `level-${n}`), `milestone ${n}`);
});

test('a fresh save unlocks nothing; progress unlocks exactly what it earns', () => {
  const fresh = emptySave(T);
  assert.deepEqual(evaluateAchievements(fresh, T).unlocked, []);
  assert.equal(evaluateAchievements(fresh, T).save, fresh);

  const s = emptySave(T);
  s.stats = { ...s.stats, wordsFound: 1, puzzles: 1 };
  s.campaign.level = 11;
  const r = evaluateAchievements(s, T);
  assert.deepEqual(r.unlocked.sort(), ['first-puzzle', 'first-word', 'level-10']);
  assert.deepEqual(r.save.unseenBadges.sort(), ['first-puzzle', 'first-word', 'level-10']);
  assert.equal(r.save.achievements['level-10'], T);

  // evaluating again never re-awards
  const again = evaluateAchievements(r.save, T + 1);
  assert.deepEqual(again.unlocked, []);
  assert.equal(again.save, r.save);
});

test('level milestones need the level to be completed, not just reached', () => {
  const s = emptySave(T);
  s.campaign.level = 10; // currently playing level 10, nine completed
  assert.ok(!evaluateAchievements(s, T).unlocked.includes('level-10'));
  s.campaign.level = 11;
  assert.ok(evaluateAchievements(s, T).unlocked.includes('level-10'));
});

test('subject badges follow category mastery and discovery', () => {
  const cat = getCategories().find((c) => c.id === 'life-skills')!;
  const s = emptySave(T);
  s.words = Object.fromEntries(cat.entries.slice(0, 20).map((e) => [e.id, { ...newRecord(TODAY, T), box: 0 }]));
  const u = evaluateAchievements(s, T).unlocked;
  assert.ok(u.includes('explorer-life-skills'));
  assert.ok(!u.includes('adept-any'));

  s.words = Object.fromEntries(cat.entries.map((e) => [e.id, { ...newRecord(TODAY, T), box: 5 }]));
  const u2 = evaluateAchievements(s, T).unlocked;
  assert.ok(u2.includes('master-any') && u2.includes('scholar-any') && u2.includes('adept-any'));
  assert.ok(u2.includes('mastered-25'));
  assert.ok(!u2.includes('polymath'));
});

test('statuses report capped progress for the UI', () => {
  const s = emptySave(T);
  s.stats.wordsFound = 400;
  s.stats.puzzles = 0;
  const st = achievementStatuses(s);
  const finds = st.find((x) => x.achievement.id === 'finds-250')!;
  assert.equal(finds.value, 250, 'capped at the goal');
  assert.equal(finds.goal, 250);
  const puzzle = st.find((x) => x.achievement.id === 'first-puzzle')!;
  assert.equal(puzzle.value, 0);
  assert.equal(puzzle.unlockedAt, undefined);
});

test('journey badges count completed journeys and mastery', () => {
  const s = emptySave(T);
  s.journeys = Object.fromEntries(JOURNEYS.map((j) => [j.id, { next: 8, stars: [], mastery: true, masteryAttempts: 1 }]));
  const u = evaluateAchievements(s, T).unlocked;
  for (const id of ['journey-1', 'journey-all', 'mastery-1', 'mastery-all']) assert.ok(u.includes(id), id);
});
