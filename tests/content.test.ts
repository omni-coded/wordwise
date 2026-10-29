import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTENT_VERSION,
  PACK_FORMAT,
  allEntries,
  clearPacks,
  getCategories,
  getCategory,
  getEntry,
  getTopic,
  isBuiltinCategory,
  listPacks,
  loadPacks,
  parsePack,
  poolFor,
  poolForAll,
  registerPack,
  unregisterPack,
  validateCategory,
} from '../src/content';
import { JOURNEYS, MASTERY_LEVEL, getJourney, journeyStepLevel } from '../src/content/journeys';

const validPack = () => ({
  format: PACK_FORMAT,
  version: 1,
  category: {
    id: 'test-pack',
    name: 'Test Pack',
    shortName: 'Test',
    blurb: 'A small pack used by the tests.',
    glyph: '✦',
    references: ['Example reference'],
    topics: [
      {
        id: 'one',
        name: 'Topic One',
        connection: 'These words are used to test importing.',
        rows: [
          ['Sandbox', 'SAND-boks', 2, 'An isolated area where code can run safely.', 'The app runs inside a sandbox so a bug cannot touch your files.', 'The idea is borrowed from the children’s play area.', 'Isolation limits the damage from mistakes.'],
          ['Quorum', 'KWOR-um', 3, 'The minimum number of members who must be present to make a meeting valid.', 'Without a quorum the board could not vote.', 'The word is Latin for “of whom.”', 'It stops a small group from deciding for everyone.'],
        ],
      },
    ],
  },
});

test('built-in categories are well-formed and large enough', () => {
  const cats = getCategories();
  assert.ok(cats.length >= 12, `expected ≥12 categories, got ${cats.length}`);
  for (const c of cats) {
    assert.deepEqual(validateCategory(c), [], `category ${c.id}`);
    assert.ok(c.entries.length >= 28, `${c.id} has only ${c.entries.length} entries`);
    assert.ok(c.topics.length >= 3, `${c.id} needs ≥3 topics`);
    assert.ok(c.references.length >= 2, `${c.id} should recommend references for editorial review`);
    for (const t of c.topics) {
      const n = c.entries.filter((e) => e.topic === t.id).length;
      assert.ok(n >= 8, `${c.id}/${t.id} has only ${n} entries`);
    }
  }
});

test('ids and hidden words are unique across all categories', () => {
  const ids = new Set<string>();
  const words = new Set<string>();
  for (const e of allEntries()) {
    assert.ok(!ids.has(e.id), `duplicate id ${e.id}`);
    assert.ok(!words.has(e.word), `duplicate word ${e.word} (${e.id})`);
    ids.add(e.id);
    words.add(e.word);
  }
  assert.ok(ids.size >= 360);
});

test('every built-in entry is honestly labelled as an unreviewed draft', () => {
  for (const e of allEntries()) {
    assert.equal(e.status, 'draft', e.id);
    assert.equal(e.reviewedBy, undefined, e.id);
  }
});

test('word lengths leave room for every grid size', () => {
  for (const e of allEntries()) assert.ok(e.word.length >= 4 && e.word.length <= 15, e.id);
  const long = allEntries().filter((e) => e.word.length >= 11).length;
  assert.ok(long >= 20, 'need some long words for hard levels');
  const short = allEntries().filter((e) => e.word.length <= 7).length;
  assert.ok(short >= 60, 'need plenty of short words for easy levels');
});

test('difficulty ratings span the scale', () => {
  const counts = [0, 0, 0, 0, 0, 0];
  for (const e of allEntries()) counts[e.difficulty]++;
  assert.ok(counts[1] >= 10 && counts[2] >= 40 && counts[3] >= 80 && counts[4] >= 40, JSON.stringify(counts));
});

test('lookups', () => {
  assert.equal(getCategory('finance')?.id, 'finance');
  assert.equal(getCategory('nope'), undefined);
  assert.ok(getTopic('finance', 'economy'));
  assert.equal(getTopic('finance', 'nope'), undefined);
  assert.ok(isBuiltinCategory('science'));
  assert.ok(!isBuiltinCategory('test-pack'));
  const e = allEntries()[5];
  assert.equal(getEntry(e.id), e);
  assert.equal(typeof CONTENT_VERSION, 'number');
});

test('pool entries use the definition as the clue and never leak the answer', () => {
  const pool = poolForAll();
  assert.equal(pool.length, allEntries().length);
  for (const p of pool) {
    const e = getEntry(p.id)!;
    assert.equal(p.clue, e.definition);
    assert.ok(!p.clue.toUpperCase().replace(/[^A-Z]/g, ' ').split(' ').includes(p.word), `${p.id} clue contains its answer`);
  }
  assert.equal(poolFor('science'), poolFor('science'), 'pool is cached');
  assert.equal(poolFor('science').length, getCategory('science')!.entries.length);
});

test('journeys reference real categories and topics, and ramp up', () => {
  assert.ok(JOURNEYS.length >= 6);
  const ids = new Set<string>();
  for (const j of JOURNEYS) {
    assert.ok(!ids.has(j.id), `duplicate journey ${j.id}`);
    ids.add(j.id);
    const cat = getCategory(j.categoryId);
    assert.ok(cat, `${j.id}: unknown category ${j.categoryId}`);
    assert.equal(j.steps.length, 8, `${j.id} should have 8 steps`);
    for (const s of j.steps) {
      assert.ok(s.title && s.blurb);
      if (s.topicId) assert.ok(cat!.topics.some((t) => t.id === s.topicId), `${j.id}: unknown topic ${s.topicId}`);
    }
    assert.ok(j.steps.some((s) => !s.topicId), `${j.id} needs mixed steps`);
    assert.equal(getJourney(j.id), j);
  }
  for (let i = 1; i < 8; i++) assert.ok(journeyStepLevel(i) > journeyStepLevel(i - 1));
  assert.ok(MASTERY_LEVEL > journeyStepLevel(7));
});

/* ───────────────────────────────── packs ───────────────────────────────── */

test('a valid pack imports, registers, and feeds the pool', () => {
  clearPacks();
  const res = parsePack(validPack());
  assert.equal(res.ok, true, res.problems.join('; '));
  assert.equal(res.category!.entries.length, 2);
  assert.equal(res.category!.entries[0].status, 'draft');
  assert.ok(registerPack(res.category!));
  assert.equal(listPacks().length, 1);
  assert.ok(getCategory('test-pack'));
  assert.ok(getEntry('test-pack-sandbox'));
  assert.equal(poolFor('test-pack').length, 2);
  assert.equal(poolForAll().length, allEntries().length);
  assert.ok(poolForAll().some((p) => p.id === 'test-pack-quorum'), 'caches refreshed after registering');
  assert.ok(unregisterPack('test-pack'));
  assert.equal(unregisterPack('test-pack'), false);
  assert.equal(getCategory('test-pack'), undefined);
  assert.ok(!poolForAll().some((p) => p.id === 'test-pack-quorum'), 'caches refreshed after removal');
});

test('JSON text is accepted and bad JSON is reported, not thrown', () => {
  assert.equal(parsePack(JSON.stringify(validPack())).ok, true);
  const bad = parsePack('{ nope');
  assert.equal(bad.ok, false);
  assert.match(bad.problems[0], /not valid JSON/);
  assert.equal(parsePack(null).ok, false);
  assert.equal(parsePack([]).ok, false);
  assert.equal(parsePack(42).ok, false);
});

test('malformed packs are rejected with readable problems', () => {
  const wrongFormat = { ...validPack(), format: 'other' };
  assert.equal(parsePack(wrongFormat).ok, false);
  assert.equal(parsePack({ ...validPack(), version: 2 }).ok, false);

  const noExample = validPack();
  (noExample.category.topics[0].rows[0] as unknown[])[4] = 'This sentence never uses the word.';
  const r1 = parsePack(noExample);
  assert.equal(r1.ok, false);
  assert.ok(r1.problems.some((p) => /example must contain the term/.test(p)), r1.problems.join('; '));

  const leaky = validPack();
  (leaky.category.topics[0].rows[1] as unknown[])[3] = 'A quorum is the minimum number needed.';
  assert.equal(parsePack(leaky).ok, false);

  const shortWord = validPack();
  (shortWord.category.topics[0].rows[0] as unknown[])[0] = 'Box';
  assert.equal(parsePack(shortWord).ok, false);

  const badRow = validPack();
  (badRow.category.topics[0].rows as unknown[]).push(['only', 'three', 'fields']);
  const r2 = parsePack(badRow);
  assert.equal(r2.ok, false);
  assert.ok(r2.problems.some((p) => /rows\[2\]/.test(p)));

  const noTopics = validPack();
  (noTopics.category as { topics: unknown[] }).topics = [];
  assert.equal(parsePack(noTopics).ok, false);

  const badDifficulty = validPack();
  (badDifficulty.category.topics[0].rows[0] as unknown[])[2] = 9;
  assert.equal(parsePack(badDifficulty).ok, false);

  const typeJunk = validPack();
  (typeJunk.category.topics[0].rows[0] as unknown[])[3] = 123;
  assert.equal(parsePack(typeJunk).ok, false);
});

test('packs cannot take over a built-in category id', () => {
  const p = validPack();
  p.category.id = 'science';
  const res = parsePack(p);
  assert.equal(res.ok, false);
  assert.match(res.problems.join(' '), /reserved/);
  assert.equal(registerPack({ ...getCategory('science')! }), false);
});

test('verified packs must name a reviewer and sources', () => {
  const p = { ...validPack(), review: { status: 'verified' as const } };
  assert.equal(parsePack(p).ok, false);
  const noSources = { ...validPack(), review: { status: 'verified' as const, reviewedBy: 'A. Editor' } };
  assert.equal(parsePack(noSources).ok, false);
  const good = { ...validPack(), review: { status: 'verified' as const, reviewedBy: 'A. Editor', sources: ['Oxford English Dictionary'] } };
  const res = parsePack(good);
  assert.equal(res.ok, true, res.problems.join('; '));
  for (const e of res.category!.entries) {
    assert.equal(e.status, 'verified');
    assert.equal(e.reviewedBy, 'A. Editor');
    assert.deepEqual(e.sources, ['Oxford English Dictionary']);
  }
  assert.equal(parsePack({ ...validPack(), review: { status: 'bogus' } }).ok, false);
});

test('duplicate words are flagged as warnings and loadPacks skips bad packs', () => {
  clearPacks();
  const dup = validPack();
  (dup.category.topics[0].rows[0] as unknown[])[0] = 'Inflation';
  (dup.category.topics[0].rows[0] as unknown[])[4] = 'Inflation erodes what a coin can buy.';
  (dup.category.topics[0].rows[0] as unknown[])[3] = 'A general rise in prices over time.';
  const res = parsePack(dup);
  assert.equal(res.ok, true, res.problems.join('; '));
  assert.ok(res.warnings.length >= 1);

  const results = loadPacks([validPack(), { format: 'x' }, 'garbage']);
  assert.deepEqual(results.map((r) => r.ok), [true, false, false]);
  assert.equal(listPacks().length, 1);
  clearPacks();
  assert.equal(listPacks().length, 0);
});

test('the example content pack in examples/ is valid and playable', async () => {
  const { readFileSync } = await import('node:fs');
  const { buildPuzzle, practicePlan } = await import('../src/game/factory');
  const { isPuzzleValid } = await import('../src/engine');
  const { clearPacks, registerPack, parsePack } = await import('../src/content');
  clearPacks();
  const res = parsePack(readFileSync(new URL('../examples/sample-pack.json', import.meta.url), 'utf8'));
  assert.ok(res.ok, res.problems.join('; '));
  registerPack(res.category!);
  const p = buildPuzzle(practicePlan({ categoryId: 'kitchen-craft', level: 3, serial: 1 }, { enabled: null, words: {}, today: 1, level: 1 }));
  assert.ok(isPuzzleValid(p));
  clearPacks();
});
