/**
 * Content registry: built-in categories plus optional player-imported packs.
 * Everything downstream (puzzle factory, journal, quizzes) goes through this module,
 * so adding a new verified collection never touches game code.
 */
import type { PoolEntry } from '../engine/types';
import type { Category, Entry, Topic } from './schema';
import { buildCategory, checkDefShape, type ReviewInfo } from './author';

import science from './categories/science';
import psychology from './categories/psychology';
import finance from './categories/finance';
import history from './categories/history';
import geography from './categories/geography';
import health from './categories/health';
import business from './categories/business';
import language from './categories/language';
import philosophy from './categories/philosophy';
import environment from './categories/environment';
import computing from './categories/computing';
import lifeSkills from './categories/life-skills';

export * from './schema';
export { validateCategory, validateEntry, lettersOf, slugify } from './validate';
export { buildCategory, defineCategory } from './author';

/** Bump when built-in content changes in a way that could invalidate saved progress. */
export const CONTENT_VERSION = 1;
export const PACK_FORMAT = 'wordwise-pack';

const BUILTIN: Category[] = [
  science,
  psychology,
  finance,
  history,
  geography,
  health,
  business,
  language,
  philosophy,
  environment,
  computing,
  lifeSkills,
];
const BUILTIN_IDS: ReadonlySet<string> = new Set(BUILTIN.map((c) => c.id));

let packs: Category[] = [];
let entryIndex: Map<string, Entry> | null = null;
const poolCache = new Map<string, PoolEntry[]>();

function invalidate(): void {
  entryIndex = null;
  poolCache.clear();
}

export function getCategories(): Category[] {
  return packs.length ? [...BUILTIN, ...packs] : BUILTIN.slice();
}

export function getCategory(id: string): Category | undefined {
  return getCategories().find((c) => c.id === id);
}

/** The shipped categories only; imported packs are excluded so shared challenges (daily, badges) stay identical for everyone. */
export function getBuiltinCategories(): Category[] {
  return BUILTIN.slice();
}

export function isBuiltinCategory(id: string): boolean {
  return BUILTIN_IDS.has(id);
}

export function getTopic(categoryId: string, topicId: string): Topic | undefined {
  return getCategory(categoryId)?.topics.find((t) => t.id === topicId);
}

export function allEntries(): Entry[] {
  return getCategories().flatMap((c) => c.entries);
}

export function getEntry(id: string): Entry | undefined {
  if (!entryIndex) entryIndex = new Map(allEntries().map((e) => [e.id, e]));
  return entryIndex.get(id);
}

export function entriesOf(categoryId: string, topicId?: string): Entry[] {
  const c = getCategory(categoryId);
  if (!c) return [];
  return topicId ? c.entries.filter((e) => e.topic === topicId) : c.entries;
}

export function toPoolEntry(e: Entry): PoolEntry {
  return { id: e.id, term: e.term, word: e.word, difficulty: e.difficulty, topic: e.topic, clue: e.definition };
}

export function toPoolEntries(entries: Entry[]): PoolEntry[] {
  return entries.map(toPoolEntry);
}

/** The engine-facing word pool for one category (cached until packs change). */
export function poolFor(categoryId: string): PoolEntry[] {
  let pool = poolCache.get(categoryId);
  if (!pool) {
    pool = toPoolEntries(entriesOf(categoryId));
    poolCache.set(categoryId, pool);
  }
  return pool;
}

/** A pool spanning every category, used by mixed puzzles. */
export function poolForAll(): PoolEntry[] {
  let pool = poolCache.get('*');
  if (!pool) {
    pool = toPoolEntries(allEntries());
    poolCache.set('*', pool);
  }
  return pool;
}

/* ────────────────────────────── content packs ────────────────────────────── */

export interface PackResult {
  ok: boolean;
  category?: Category;
  problems: string[];
  warnings: string[];
}

/**
 * Validates a content pack. Accepts a JSON string or an already-parsed object:
 *   { "format": "wordwise-pack", "version": 1,
 *     "category": { id, name, shortName, blurb, glyph, references, topics: [{ id, name, connection, rows: [[…7 fields…]] }] },
 *     "review": { "status": "verified", "reviewedBy": "Name", "sources": ["…"] } }   // review is optional
 * Never throws; every problem is returned as text.
 */
export function parsePack(input: unknown): PackResult {
  const fail = (...problems: string[]): PackResult => ({ ok: false, problems, warnings: [] });
  let raw = input;
  if (typeof input === 'string') {
    try {
      raw = JSON.parse(input);
    } catch (err) {
      return fail(`not valid JSON (${err instanceof Error ? err.message : 'parse error'})`);
    }
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return fail('a pack must be a JSON object');
  const pack = raw as Record<string, unknown>;
  if (pack.format !== PACK_FORMAT) return fail(`"format" must be "${PACK_FORMAT}"`);
  if (pack.version !== 1) return fail('unsupported pack "version" (expected 1)');

  const shape = checkDefShape(pack.category);
  if (shape.length) return fail(...shape);
  const def = pack.category as Parameters<typeof buildCategory>[0];

  let review: ReviewInfo | undefined;
  if (pack.review !== undefined) {
    const r = pack.review as Record<string, unknown> | null;
    if (typeof r !== 'object' || r === null) return fail('"review" must be an object');
    if (r.status !== 'draft' && r.status !== 'verified') return fail('review.status must be "draft" or "verified"');
    const sources = Array.isArray(r.sources) ? r.sources.filter((s): s is string => typeof s === 'string' && !!s.trim()) : [];
    const reviewedBy = typeof r.reviewedBy === 'string' ? r.reviewedBy.trim() : '';
    if (r.status === 'verified') {
      if (!reviewedBy) return fail('a verified pack must name its reviewer (review.reviewedBy)');
      if (sources.length === 0) return fail('a verified pack must list the sources it was checked against (review.sources)');
    }
    review = { status: r.status, reviewedBy: reviewedBy || undefined, sources };
  }

  if (BUILTIN_IDS.has(def.id)) return fail(`category id "${def.id}" is reserved by a built-in category`);

  const { category, problems } = buildCategory(def, review);
  if (problems.length) return fail(...problems);

  const warnings: string[] = [];
  const existing = new Map<string, string>();
  for (const c of getCategories()) {
    if (c.id === category.id) continue;
    for (const e of c.entries) existing.set(e.word, `${c.shortName}: ${e.term}`);
  }
  for (const e of category.entries) {
    const clash = existing.get(e.word);
    if (clash) warnings.push(`"${e.term}" duplicates an existing word (${clash}); only one of them will appear per puzzle`);
  }
  return { ok: true, category, problems: [], warnings };
}

/** Adds or replaces an imported pack. Built-in categories can never be replaced. */
export function registerPack(category: Category): boolean {
  if (BUILTIN_IDS.has(category.id)) return false;
  packs = [...packs.filter((c) => c.id !== category.id), category];
  invalidate();
  return true;
}

export function unregisterPack(id: string): boolean {
  const before = packs.length;
  packs = packs.filter((c) => c.id !== id);
  if (packs.length === before) return false;
  invalidate();
  return true;
}

export function listPacks(): Category[] {
  return packs.slice();
}

export function clearPacks(): void {
  packs = [];
  invalidate();
}

/** Parses and registers many packs (e.g. when restoring from storage). Failures are skipped and reported. */
export function loadPacks(rawPacks: unknown[]): PackResult[] {
  return rawPacks.map((raw) => {
    const res = parsePack(raw);
    if (res.ok && res.category) registerPack(res.category);
    return res;
  });
}
