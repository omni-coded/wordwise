import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clearPacks, getCategory, listPacks } from '../src/content';
import { newSession, targetsOf } from '../src/engine';
import { buildPuzzle, campaignPlan } from '../src/game/factory';
import { buildQuiz } from '../src/game/quiz';
import { newRecord } from '../src/game/srs';
import { emptySave, SAVE_VERSION, type ActiveGame, type SaveData } from '../src/game/state';
import {
  BACKUP_KEY,
  CORRUPT_KEY,
  FUTURE_KEY,
  SAVE_KEY,
  detectStore,
  exportSave,
  importSave,
  loadSave,
  memoryStore,
  migrate,
  resetSave,
  sanitizeSave,
  writeSave,
  type KeyValueStore,
} from '../src/game/storage';
import { allEntries } from '../src/content';

const NOW = 1_800_000_000_000;
const ctx = { enabled: null, words: {}, today: 20_000, level: 1 };

function activeGame(): ActiveGame {
  const puzzle = buildPuzzle(campaignPlan(3, ctx));
  const first = targetsOf(puzzle)[0];
  return {
    puzzle,
    state: { ...newSession(puzzle), found: [first.entryId], attempts: 2, correct: 1, elapsedMs: 42_000 },
    startedAt: NOW,
    paused: false,
    fresh: [first.entryId],
    limitMs: null,
  };
}

function richSave(): SaveData {
  const s = emptySave(NOW);
  s.onboarded = true;
  s.stats.xp = 1500;
  s.stats.puzzles = 4;
  s.stats.byCategory.finance = { puzzles: 2, found: 20, quizCorrect: 5, quizTotal: 8 };
  s.settings.theme = 'dark';
  s.settings.gridTheme = 'midnight';
  s.words = { [allEntries()[0].id]: { ...newRecord(20_000, NOW), favorite: true, box: 2 } };
  s.campaign = { level: 4, stars: { '1': 3, '2': 2, '3': 2 } };
  s.journeys = { psychology: { next: 3, stars: [3, 2, 2], mastery: false, masteryAttempts: 0 } };
  s.daily = { '2026-10-29': { score: 800, stars: 3, xp: 200, words: ['a'], quizCorrect: 4, quizTotal: 5, completedAt: NOW } };
  s.activity = { '2026-10-29': { puzzles: 1, reviews: 0, xp: 100 } };
  s.achievements = { 'first-word': NOW };
  s.game = activeGame();
  return s;
}

const store = (): KeyValueStore & { dump(): Record<string, string> } => {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    dump: () => Object.fromEntries(m),
  };
};

test('a first visit starts fresh', () => {
  clearPacks();
  const r = loadSave(store(), NOW);
  assert.equal(r.status, 'fresh');
  assert.deepEqual(r.save, emptySave(NOW));
});

test('save → load round-trips everything, including a game in progress', () => {
  const st = store();
  const s = richSave();
  assert.ok(writeSave(st, s));
  const r = loadSave(st, NOW + 1);
  assert.equal(r.status, 'ok');
  assert.deepEqual(r.save.stats, s.stats);
  assert.deepEqual(r.save.words, s.words);
  assert.deepEqual(r.save.campaign, s.campaign);
  assert.deepEqual(r.save.journeys, s.journeys);
  assert.deepEqual(r.save.daily, s.daily);
  assert.deepEqual(r.save.activity, s.activity);
  assert.deepEqual(r.save.achievements, s.achievements);
  assert.equal(r.save.settings.gridTheme, 'midnight');
  assert.ok(r.save.game);
  assert.deepEqual(r.save.game!.puzzle, s.game!.puzzle);
  assert.deepEqual(r.save.game!.state.found, s.game!.state.found);
  assert.equal(r.save.game!.paused, false);
  assert.equal(r.save.game!.state.elapsedMs, 42_000);
});

test('corrupt storage is kept aside and the player gets a clean save', () => {
  const st = store();
  st.setItem(SAVE_KEY, '{"app":"wordwise","stats":');
  const r = loadSave(st, NOW);
  assert.equal(r.status, 'reset-corrupt');
  assert.deepEqual(r.save, emptySave(NOW));
  assert.equal(st.getItem(CORRUPT_KEY), '{"app":"wordwise","stats":');

  const other = store();
  other.setItem(SAVE_KEY, JSON.stringify({ app: 'something-else', v: 1 }));
  assert.equal(loadSave(other, NOW).status, 'reset-corrupt');
  const arr = store();
  arr.setItem(SAVE_KEY, '[1,2,3]');
  assert.equal(loadSave(arr, NOW).status, 'reset-corrupt');
});

test('a good backup rescues a corrupt main save', () => {
  const st = store();
  const s = richSave();
  assert.ok(writeSave(st, s));
  assert.ok(writeSave(st, { ...s, stats: { ...s.stats, xp: 2000 } }, { backup: true }));
  assert.ok(st.getItem(BACKUP_KEY));
  st.setItem(SAVE_KEY, 'garbage');
  const r = loadSave(st, NOW);
  assert.equal(r.status, 'restored-backup');
  assert.equal(r.save.stats.xp, 1500, 'the backup holds the previous good save');

  const missing = store();
  assert.ok(writeSave(missing, s));
  assert.ok(writeSave(missing, s, { backup: true }));
  missing.removeItem(SAVE_KEY);
  assert.equal(loadSave(missing, NOW).status, 'restored-backup', 'also when the main key vanished');
});

test('backups never overwrite a good copy with a bad one', () => {
  const st = store();
  assert.ok(writeSave(st, richSave()));
  st.setItem(SAVE_KEY, 'garbage');
  assert.ok(writeSave(st, richSave(), { backup: true }));
  assert.equal(st.getItem(BACKUP_KEY), null, 'garbage was not copied into the backup');
});

test('tampered or damaged fields fall back to safe defaults', () => {
  const dirty = {
    app: 'wordwise',
    v: 1,
    settings: { theme: 'neon', textSize: 99, sfxVolume: 7, music: 'yes', gridTheme: 'nope', highlightStyle: 'marker', enabledCategories: 'all' },
    stats: { xp: -50, coins: 'many', puzzles: 3.7, byCategory: { finance: { puzzles: 'x', found: -3 }, bad: 5 } },
    words: { a: { box: 99, due: 'tomorrow', right: -1 }, b: 5, c: null },
    campaign: { level: -4, stars: { '3': 9, x: 2, '-1': 1 } },
    journeys: { psychology: { next: 99, stars: [9, -1, 'a'], mastery: 'maybe' }, bogus: { next: 1 } },
    daily: { '2026-02-30': { score: 5 }, '2026-10-29': { score: 'x', stars: 99 } },
    activity: { nope: { puzzles: 1 }, '2026-10-29': { puzzles: -2, reviews: 'z' } },
    achievements: { 'first-word': 5, 'made-up': 6, 'level-10': 'x' },
    unseenBadges: ['first-word', 'made-up', 3],
    game: { puzzle: { v: 1, grid: 'nope' }, state: {} },
    summary: { id: 'x', mode: 'weird' },
    review: { questions: 'no' },
  };
  const s = sanitizeSave(dirty, NOW);
  assert.equal(s.settings.theme, 'system');
  assert.equal(s.settings.textSize, 'medium');
  assert.equal(s.settings.sfxVolume, 1);
  assert.equal(s.settings.music, false);
  assert.equal(s.settings.gridTheme, 'ivory');
  assert.equal(s.settings.highlightStyle, 'capsule', 'locked cosmetic reverts');
  assert.equal(s.settings.enabledCategories, null);
  assert.equal(s.stats.xp, 0);
  assert.equal(s.stats.coins, 0);
  assert.equal(s.stats.puzzles, 4);
  assert.deepEqual(s.stats.byCategory, { finance: { puzzles: 0, found: 0, quizCorrect: 0, quizTotal: 0 } });
  assert.deepEqual(Object.keys(s.words), ['a']);
  assert.equal(s.words.a.box, 5);
  assert.equal(s.words.a.right, 0);
  assert.equal(s.campaign.level, 1);
  assert.deepEqual(s.campaign.stars, { '3': 3 });
  assert.deepEqual(Object.keys(s.journeys), ['psychology']);
  assert.equal(s.journeys.psychology.next, 8);
  assert.deepEqual(s.journeys.psychology.stars, [3, 0, 0]);
  assert.equal(s.journeys.psychology.mastery, false);
  assert.deepEqual(Object.keys(s.daily), ['2026-10-29']);
  assert.equal(s.daily['2026-10-29'].stars, 3);
  assert.deepEqual(Object.keys(s.activity), ['2026-10-29']);
  assert.deepEqual(s.activity['2026-10-29'], { puzzles: 0, reviews: 0, xp: 0 });
  assert.deepEqual(Object.keys(s.achievements), ['first-word']);
  assert.deepEqual(s.unseenBadges, ['first-word']);
  assert.equal(s.game, null);
  assert.equal(s.summary, null);
  assert.equal(s.review, null);
});

test('sanitising never throws on hostile input', () => {
  for (const junk of [null, undefined, 5, 'str', [], [1, 2], {}, { stats: null, words: [], game: 5 }, { game: { puzzle: null, state: null } }]) {
    const s = sanitizeSave(junk, NOW);
    assert.equal(s.app, 'wordwise');
    assert.equal(s.v, SAVE_VERSION);
  }
});

test('a saved game that no longer validates is discarded rather than trusted', () => {
  const s = richSave();
  const broken = JSON.parse(JSON.stringify(s));
  broken.game.puzzle.grid[0] = 'ZZZZZZZZZZZZ'.slice(0, broken.game.puzzle.size); // grid no longer spells the words
  assert.equal(sanitizeSave(broken, NOW).game, null);

  const mismatched = JSON.parse(JSON.stringify(s));
  mismatched.game.state.puzzleId = 'other';
  assert.equal(sanitizeSave(mismatched, NOW).game, null);

  const unknownEntry = JSON.parse(JSON.stringify(s));
  unknownEntry.game.puzzle.placements[0].entryId = 'removed-word';
  assert.equal(sanitizeSave(unknownEntry, NOW).game, null);
});

test('a game in progress is repaired, not rejected, when only its progress is odd', () => {
  const s = richSave();
  const odd = JSON.parse(JSON.stringify(s));
  odd.game.state.found = [...odd.game.state.found, 'not-a-word', odd.game.state.found[0]];
  odd.game.state.elapsedMs = -5;
  odd.game.state.status = 'failed';
  const g = sanitizeSave(odd, NOW).game!;
  assert.ok(g);
  assert.deepEqual(g.state.found, s.game!.state.found);
  assert.equal(g.state.elapsedMs, 0);
  assert.equal(g.state.status, 'playing');
  const done = JSON.parse(JSON.stringify(s));
  done.game.state.found = targetsOf(s.game!.puzzle).map((t) => t.entryId);
  assert.equal(sanitizeSave(done, NOW).game!.state.status, 'complete');
});

test('a reload always resumes paused', () => {
  const s = richSave();
  const odd = JSON.parse(JSON.stringify(s));
  delete odd.game.paused;
  assert.equal(sanitizeSave(odd, NOW).game!.paused, true);
});

test('summaries and quizzes survive a reload', () => {
  const s = richSave();
  const entries = allEntries().slice(0, 12);
  const questions = buildQuiz({ entries, count: 3, seed: 'q', pool: allEntries() });
  s.summary = {
    id: 'sum1',
    puzzleId: 'p1',
    mode: 'campaign',
    level: 3,
    title: 'T',
    theme: 'Th',
    categoryId: 'finance',
    topicId: 'economy',
    outcome: 'complete',
    completedAt: NOW,
    elapsedMs: 90_000,
    accuracy: 0.9,
    hints: 1,
    misses: 1,
    attempts: 12,
    words: entries.slice(0, 3).map((e, i) => ({ entryId: e.id, bonus: i === 2, isNew: i !== 1 })),
    xp: { base: 100, bonusWords: 15, precision: 20, unassisted: 0, discovery: 8, total: 143 },
    xpTotal: 143,
    coins: 9,
    starsPre: 2,
    stars: 2,
    quiz: { kind: 'fact', questions, answers: { [questions[0].id]: questions[0].correctId }, done: false, correct: 1, attempt: 0 },
    rankBefore: 1,
    rankAfter: 2,
    unlocked: ['parchment'],
    streak: 3,
  };
  s.review = { startedAt: NOW, questions, answers: {}, done: false, correct: 0, xp: 0, coins: 0 };
  const st = store();
  assert.ok(writeSave(st, s));
  const r = loadSave(st, NOW).save;
  assert.deepEqual(r.summary, s.summary);
  assert.deepEqual(r.review, s.review);
});

test('quiz answers that are not valid options are dropped', () => {
  const s = richSave();
  const questions = buildQuiz({ entries: allEntries().slice(0, 6), count: 3, seed: 'q2', pool: allEntries() });
  const raw = JSON.parse(JSON.stringify({ ...s, review: { startedAt: 1, questions, answers: { [questions[0].id]: 'zzz', [questions[1].id]: questions[1].correctId }, done: true, correct: 3, xp: 1, coins: 1 } }));
  const r = sanitizeSave(raw, NOW).review!;
  assert.deepEqual(Object.keys(r.answers), [questions[1].id]);
  assert.equal(r.done, false, 'cannot be done with unanswered questions');
  assert.ok(r.correct <= r.questions.length);
});

test('saves from a newer version are preserved, not overwritten', () => {
  const st = store();
  const future = JSON.stringify({ app: 'wordwise', v: SAVE_VERSION + 1, stats: { xp: 9999 } });
  st.setItem(SAVE_KEY, future);
  const r = loadSave(st, NOW);
  assert.equal(r.status, 'newer-version');
  assert.equal(r.save.stats.xp, 0);
  assert.equal(st.getItem(FUTURE_KEY), future);
  assert.equal(migrate({ v: SAVE_VERSION + 3 }).newer, true);
  assert.equal(migrate({}).raw.v, SAVE_VERSION, 'a missing version is treated as the first');
});

test('storage failures never throw', () => {
  const full: KeyValueStore = {
    getItem: () => null,
    setItem: () => {
      throw new DOMException('quota', 'QuotaExceededError');
    },
    removeItem: () => {},
  };
  assert.equal(writeSave(full, emptySave(NOW)), false);
  const broken: KeyValueStore = {
    getItem: () => {
      throw new Error('denied');
    },
    setItem: () => {
      throw new Error('denied');
    },
    removeItem: () => {
      throw new Error('denied');
    },
  };
  assert.equal(loadSave(broken, NOW).status, 'fresh');
  assert.doesNotThrow(() => resetSave(broken, null, NOW));
});

test('without localStorage the app falls back to memory', () => {
  const { store: s, persistent } = detectStore();
  assert.equal(persistent, false, 'node has no localStorage');
  s.setItem('k', 'v');
  assert.equal(s.getItem('k'), 'v');
  s.removeItem('k');
  assert.equal(s.getItem('k'), null);
  assert.equal(memoryStore().getItem('missing'), null);
});

test('export → import round-trips and rejects foreign files', () => {
  const s = richSave();
  const text = exportSave(s, NOW);
  const r = importSave(text, NOW + 5);
  assert.ok(r.ok);
  if (r.ok) {
    assert.deepEqual(r.save.stats, s.stats);
    assert.deepEqual(r.save.words, s.words);
    assert.equal(r.save.updatedAt, NOW + 5);
  }
  assert.equal(importSave('not json', NOW).ok, false);
  assert.equal(importSave('{"app":"other"}', NOW).ok, false);
  assert.equal(importSave('[]', NOW).ok, false);
  const future = importSave(JSON.stringify({ app: 'wordwise', v: SAVE_VERSION + 1 }), NOW);
  assert.equal(future.ok, false);
});

test('content packs persist with the save and are re-validated on load', () => {
  clearPacks();
  const pack = {
    format: 'wordwise-pack',
    version: 1,
    category: {
      id: 'mine',
      name: 'Mine',
      shortName: 'Mine',
      blurb: 'b',
      glyph: '+',
      references: [],
      topics: [{ id: 't', name: 'T', connection: 'c', rows: [['Sandbox', 'SAND-boks', 2, 'An isolated area for running code.', 'Run it in a sandbox.', 'A fact.', 'A reason.']] }],
    },
  };
  const s = richSave();
  s.packs = [pack, { format: 'wordwise-pack', version: 1, category: { id: 'broken' } }];
  const st = store();
  assert.ok(writeSave(st, s));
  const r = loadSave(st, NOW);
  assert.equal(r.save.packs.length, 1, 'the invalid pack is dropped');
  assert.deepEqual(listPacks().map((c) => c.id), ['mine']);
  assert.ok(getCategory('mine'));
  clearPacks();
});

test('reset removes everything, optionally keeping settings', () => {
  const st = store();
  const s = richSave();
  assert.ok(writeSave(st, s, { backup: true }));
  assert.ok(writeSave(st, s, { backup: true }));
  const fresh = resetSave(st, s.settings, NOW);
  assert.deepEqual(st.dump(), {});
  assert.equal(fresh.settings.theme, 'dark');
  assert.equal(fresh.stats.xp, 0);
  assert.equal(resetSave(st, null, NOW).settings.theme, 'system');
});
