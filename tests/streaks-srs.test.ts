import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, dateKey, dayNumber, daysBetween, fromDayNumber, isDateKey, weekStart, weekday } from '../src/game/dates';
import {
  addActivity,
  bestDailyStreak,
  bestWeeklyStreak,
  dailyStreak,
  pruneActivity,
  weeklyStreak,
  type ActivityMap,
} from '../src/game/streaks';
import {
  BOX_INTERVALS_DAYS,
  MAX_BOX,
  dueCount,
  dueList,
  isDue,
  masteryOf,
  masteryTitle,
  newRecord,
  recordFind,
  review,
  wordState,
  type WordRecord,
} from '../src/game/srs';

const act = (...days: string[]): ActivityMap => Object.fromEntries(days.map((d) => [d, { puzzles: 1, reviews: 0, xp: 10 }]));

test('date keys round-trip and validate', () => {
  assert.equal(dateKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.ok(isDateKey('2024-02-29'));
  assert.ok(!isDateKey('2025-02-29'));
  assert.ok(!isDateKey('2025-13-01'));
  assert.ok(!isDateKey('nope'));
  assert.ok(!isDateKey(20250101));
  assert.throws(() => dayNumber('2025-02-30'));
  assert.equal(fromDayNumber(dayNumber('2026-10-29')), '2026-10-29');
});

test('date arithmetic crosses month, year and leap boundaries', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2025-02-28', 1), '2025-03-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(daysBetween('2026-03-08', '2026-03-09'), 1, 'DST transition is still one day');
  assert.equal(daysBetween('2026-10-31', '2026-11-02'), 2);
});

test('weekdays and week starts follow ISO Monday–Sunday', () => {
  assert.equal(weekday('2026-10-26'), 0); // Monday
  assert.equal(weekday('2026-10-29'), 3); // Thursday
  assert.equal(weekday('2026-11-01'), 6); // Sunday
  assert.equal(weekStart('2026-10-29'), '2026-10-26');
  assert.equal(weekStart('2026-10-26'), '2026-10-26');
  assert.equal(weekStart('2026-11-01'), '2026-10-26');
  assert.equal(weekday('1970-01-01'), 3);
});

test('daily streak counts consecutive days and survives a not-yet-played today', () => {
  const today = '2026-10-29';
  assert.deepEqual(dailyStreak({}, today), { current: 0, status: 'none' });
  assert.deepEqual(dailyStreak(act('2026-10-29'), today), { current: 1, status: 'active' });
  assert.deepEqual(dailyStreak(act('2026-10-27', '2026-10-28', '2026-10-29'), today), { current: 3, status: 'active' });
  assert.deepEqual(dailyStreak(act('2026-10-27', '2026-10-28'), today), { current: 2, status: 'at-risk' });
  assert.deepEqual(dailyStreak(act('2026-10-26', '2026-10-27'), today), { current: 0, status: 'none' });
  assert.equal(dailyStreak(act('2026-10-25', '2026-10-27', '2026-10-28', '2026-10-29'), today).current, 3, 'a gap ends the run');
  assert.equal(dailyStreak({ '2026-10-29': { puzzles: 0, reviews: 0, xp: 0 } }, today).current, 0, 'zero activity is not a play day');
});

test('best streaks are found anywhere in history', () => {
  const a = act('2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-02-01', '2026-02-02');
  assert.equal(bestDailyStreak(a), 4);
  assert.equal(bestDailyStreak({}), 0);
  assert.equal(bestDailyStreak(act('2026-05-05')), 1);
});

test('weekly streak needs three active days per week', () => {
  const today = '2026-10-29'; // Thursday of the week starting 2026-10-26
  // Three previous weeks with 3 days each
  const prev = act('2026-10-05', '2026-10-06', '2026-10-07', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-19', '2026-10-20', '2026-10-21');
  assert.deepEqual(weeklyStreak(prev, today), { current: 3, thisWeekDays: 0 });
  const withNow = { ...prev, ...act('2026-10-26', '2026-10-27', '2026-10-28') };
  assert.deepEqual(weeklyStreak(withNow, today), { current: 4, thisWeekDays: 3 });
  const twoOnly = { ...prev, ...act('2026-10-26', '2026-10-27') };
  assert.deepEqual(weeklyStreak(twoOnly, today), { current: 3, thisWeekDays: 2 });
  const broken = act('2026-10-05', '2026-10-06', '2026-10-07', '2026-10-19', '2026-10-20', '2026-10-21');
  assert.equal(weeklyStreak(broken, today).current, 1, 'skipped week breaks the run');
  assert.equal(bestWeeklyStreak(broken), 1);
  assert.equal(bestWeeklyStreak(withNow), 4);
  assert.equal(bestWeeklyStreak({}), 0);
});

test('activity accumulates and old history is pruned', () => {
  let a: ActivityMap = {};
  a = addActivity(a, '2026-10-29', { puzzles: 1, xp: 50 });
  a = addActivity(a, '2026-10-29', { reviews: 1, xp: 20 });
  assert.deepEqual(a['2026-10-29'], { puzzles: 1, reviews: 1, xp: 70 });
  a = addActivity(a, '2020-01-01', { puzzles: 1 });
  const pruned = pruneActivity(a, '2026-10-29', 800);
  assert.ok(pruned['2026-10-29']);
  assert.equal(pruned['2020-01-01'], undefined);
});

/* ───────────────────────────────── SRS ───────────────────────────────── */

const T0 = 20_000; // an arbitrary day number

test('new words are scheduled for tomorrow', () => {
  const r = newRecord(T0, 1);
  assert.equal(r.box, 0);
  assert.equal(r.due, T0 + 1);
  assert.equal(r.timesFound, 1);
  assert.ok(!isDue(r, T0));
  assert.ok(isDue(r, T0 + 1));
  assert.equal(recordFind(r, T0, 2).timesFound, 2);
  assert.equal(recordFind(undefined, T0, 5).firstFound, 5);
});

test('the first quiz advances a word; correct answers climb the intervals', () => {
  let r = newRecord(T0, 1);
  r = review(r, true, T0); // first ever test counts although not yet due
  assert.equal(r.box, 1);
  assert.equal(r.due, T0 + BOX_INTERVALS_DAYS[1]);
  let day = r.due;
  for (let box = 2; box <= MAX_BOX; box++) {
    r = review(r, true, day);
    assert.equal(r.box, box);
    assert.equal(r.due, day + BOX_INTERVALS_DAYS[box]);
    day = r.due;
  }
  r = review(r, true, day);
  assert.equal(r.box, MAX_BOX, 'box is capped');
});

test('a wrong answer resets to box 0, due immediately', () => {
  let r = newRecord(T0, 1);
  r = review(r, true, T0);
  r = review(r, true, r.due);
  assert.equal(r.box, 2);
  r = review(r, false, r.due);
  assert.equal(r.box, 0);
  assert.ok(isDue(r, r.last!), 'due the same day');
  assert.equal(r.wrong, 1);
});

test('re-quizzing a word that is not due cannot farm progress', () => {
  let r = newRecord(T0, 1);
  r = review(r, true, T0);
  const box = r.box;
  for (let i = 0; i < 10; i++) r = review(r, true, T0);
  assert.equal(r.box, box);
  assert.equal(r.right, 11);
});

test('due list is ordered by overdue-ness then weakness, and limited', () => {
  const mk = (box: number, due: number): WordRecord => ({ ...newRecord(T0, 1), box, due });
  const words = { a: mk(2, T0), b: mk(0, T0 - 3), c: mk(1, T0 - 3), d: mk(0, T0 + 5) };
  assert.deepEqual(dueList(words, T0), ['b', 'c', 'a']);
  assert.deepEqual(dueList(words, T0, 2), ['b', 'c']);
  assert.equal(dueCount(words, T0), 3);
  assert.deepEqual(dueList({}, T0), []);
});

test('word states and category mastery', () => {
  const mk = (box: number): WordRecord => ({ ...newRecord(T0, 1), box });
  assert.equal(wordState(undefined), 'new');
  assert.equal(wordState(mk(0)), 'learning');
  assert.equal(wordState(mk(1)), 'learning');
  assert.equal(wordState(mk(2)), 'familiar');
  assert.equal(wordState(mk(3)), 'familiar');
  assert.equal(wordState(mk(4)), 'mastered');
  assert.equal(wordState(mk(5)), 'mastered');

  const ids = ['a', 'b', 'c', 'd'];
  assert.deepEqual(masteryOf(ids, {}), { percent: 0, discovered: 0, mastered: 0, total: 4, title: 'Novice' });
  const m = masteryOf(ids, { a: mk(5), b: mk(5), c: mk(4), d: mk(4) });
  assert.equal(m.percent, 100);
  assert.equal(m.title, 'Master');
  assert.equal(m.mastered, 4);
  assert.equal(masteryOf([], {}).percent, 0);
  assert.equal(masteryTitle(24), 'Novice');
  assert.equal(masteryTitle(25), 'Apprentice');
  assert.equal(masteryTitle(50), 'Adept');
  assert.equal(masteryTitle(75), 'Scholar');
  assert.equal(masteryTitle(90), 'Master');
});
