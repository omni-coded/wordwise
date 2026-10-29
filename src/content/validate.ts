import type { Category, Entry } from './schema';

const LIMITS = { definition: 230, example: 230, fact: 320, why: 230 };

export function lettersOf(term: string): string {
  return term.replace(/[^A-Za-z]/g, '').toUpperCase();
}

export function slugify(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Returns human-readable problems; an empty array means the entry is well-formed. */
export function validateEntry(e: Entry, topicIds: ReadonlySet<string>): string[] {
  const p: string[] = [];
  const tag = e.id || e.term || '(unnamed)';
  if (!e.term?.trim()) p.push(`${tag}: missing term`);
  if (!/^[A-Z]{4,15}$/.test(e.word)) p.push(`${tag}: hidden word "${e.word}" must be 4–15 letters A–Z`);
  if (lettersOf(e.term ?? '') !== e.word) p.push(`${tag}: word does not match term`);
  if (![1, 2, 3, 4, 5].includes(e.difficulty)) p.push(`${tag}: difficulty must be 1–5`);
  if (!topicIds.has(e.topic)) p.push(`${tag}: unknown topic "${e.topic}"`);
  for (const key of ['pronunciation', 'definition', 'example', 'fact', 'why'] as const) {
    if (!e[key] || !e[key].trim()) p.push(`${tag}: empty ${key}`);
  }
  for (const key of ['definition', 'example', 'fact', 'why'] as const) {
    if (e[key] && e[key].length > LIMITS[key]) p.push(`${tag}: ${key} is ${e[key].length} chars (max ${LIMITS[key]})`);
  }
  if (e.example && e.term && !e.example.toLowerCase().includes(e.term.toLowerCase())) {
    p.push(`${tag}: example must contain the term (needed for fill-in-the-blank questions)`);
  }
  if (e.fact && e.definition && e.fact.trim() === e.definition.trim()) p.push(`${tag}: fact repeats the definition`);
  if (e.definition && e.word && new RegExp(`\\b${e.term.replace(/[^A-Za-z ]/g, '')}\\b`, 'i').test(e.definition)) {
    p.push(`${tag}: definition uses the term itself (clue puzzles would give the answer away)`);
  }
  return p;
}

export function validateCategory(c: Category): string[] {
  const p: string[] = [];
  if (!/^[a-z][a-z0-9-]*$/.test(c.id)) p.push(`category id "${c.id}" must be lowercase-kebab`);
  if (!c.name || !c.shortName || !c.blurb) p.push(`${c.id}: name/shortName/blurb required`);
  if (c.topics.length === 0) p.push(`${c.id}: needs at least one topic`);
  const topicIds = new Set(c.topics.map((t) => t.id));
  if (topicIds.size !== c.topics.length) p.push(`${c.id}: duplicate topic ids`);
  for (const t of c.topics) if (!t.connection?.trim()) p.push(`${c.id}/${t.id}: missing connection text`);
  const ids = new Set<string>();
  const words = new Set<string>();
  for (const e of c.entries) {
    if (ids.has(e.id)) p.push(`${e.id}: duplicate id`);
    ids.add(e.id);
    if (words.has(e.word)) p.push(`${e.id}: duplicate hidden word ${e.word}`);
    words.add(e.word);
    p.push(...validateEntry(e, topicIds));
  }
  return p;
}
