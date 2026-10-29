import type { Category, CategoryDef, Difficulty, Entry, ReviewStatus } from './schema';
import { lettersOf, slugify, validateCategory } from './validate';

/** Editorial state applied to every entry of a category (built-in content is always 'draft'). */
export interface ReviewInfo {
  status: ReviewStatus;
  reviewedBy?: string;
  sources?: string[];
}

export interface BuildResult {
  category: Category;
  problems: string[];
}

/** Turns the compact authoring format into a fully-typed Category and reports every problem found. */
export function buildCategory(def: CategoryDef, review?: ReviewInfo): BuildResult {
  const entries: Entry[] = [];
  for (const topic of def.topics) {
    for (const [term, pronunciation, difficulty, definition, example, fact, why] of topic.rows) {
      const entry: Entry = {
        id: `${def.id}-${slugify(term)}`,
        term,
        word: lettersOf(term),
        category: def.id,
        topic: topic.id,
        difficulty: difficulty as Difficulty,
        pronunciation,
        definition,
        example,
        fact,
        why,
        status: review?.status ?? 'draft',
      };
      if (review?.reviewedBy) entry.reviewedBy = review.reviewedBy;
      if (review?.sources?.length) entry.sources = review.sources;
      entries.push(entry);
    }
  }
  const category: Category = {
    id: def.id,
    name: def.name,
    shortName: def.shortName,
    blurb: def.blurb,
    glyph: def.glyph,
    topics: def.topics.map((t) => ({ id: t.id, name: t.name, connection: t.connection })),
    entries,
    references: def.references,
  };
  return { category, problems: validateCategory(category) };
}

/** Authoring helper for built-in files: throws on malformed content so mistakes surface at import time. */
export function defineCategory(def: CategoryDef): Category {
  const { category, problems } = buildCategory(def);
  if (problems.length) throw new Error(`Invalid content in "${def.id}":\n - ${problems.join('\n - ')}`);
  return category;
}

const MAX_ENTRIES_PER_PACK = 1000;
const MAX_TEXT = 2000;

/**
 * Structural check for untrusted JSON (imported content packs). An empty result means the value
 * has the shape of a CategoryDef and can safely be handed to buildCategory.
 */
export function checkDefShape(def: unknown): string[] {
  const p: string[] = [];
  const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
  const str = (v: unknown): v is string => typeof v === 'string' && v.length <= MAX_TEXT;
  if (!isObj(def)) return ['category must be an object'];
  for (const k of ['id', 'name', 'shortName', 'blurb', 'glyph'] as const) {
    if (!str(def[k]) || !(def[k] as string).trim()) p.push(`category.${k} must be a non-empty string`);
  }
  if (!Array.isArray(def.references) || !def.references.every(str)) p.push('category.references must be an array of strings');
  if (!Array.isArray(def.topics) || def.topics.length === 0) {
    p.push('category.topics must be a non-empty array');
    return p;
  }
  let total = 0;
  def.topics.forEach((t: unknown, ti: number) => {
    if (!isObj(t)) {
      p.push(`topics[${ti}] must be an object`);
      return;
    }
    for (const k of ['id', 'name', 'connection'] as const) {
      if (!str(t[k]) || !(t[k] as string).trim()) p.push(`topics[${ti}].${k} must be a non-empty string`);
    }
    if (!Array.isArray(t.rows)) {
      p.push(`topics[${ti}].rows must be an array`);
      return;
    }
    t.rows.forEach((row: unknown, ri: number) => {
      total++;
      const at = `topics[${ti}].rows[${ri}]`;
      if (!Array.isArray(row) || row.length !== 7) {
        p.push(`${at} must be [term, pronunciation, difficulty, definition, example, fact, why]`);
        return;
      }
      const [term, pron, diff, d, ex, fact, why] = row as unknown[];
      if (![term, pron, d, ex, fact, why].every(str)) p.push(`${at}: all text fields must be strings (max ${MAX_TEXT} chars)`);
      if (typeof diff !== 'number') p.push(`${at}: difficulty must be a number 1–5`);
    });
  });
  if (total > MAX_ENTRIES_PER_PACK) p.push(`a pack may hold at most ${MAX_ENTRIES_PER_PACK} entries (found ${total})`);
  return p;
}
