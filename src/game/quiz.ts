/**
 * Fact Challenge and Smart Review questions.
 * Three multiple-choice formats are generated from the curated entries, all seeded so a daily challenge asks
 * everyone the same questions:
 *   term       – a definition is shown; choose the term it defines
 *   definition – a term is shown; choose its definition
 *   cloze      – the example sentence is shown with the term blanked out; choose the term
 */
import type { Entry } from '../content/schema';
import { Rng } from '../engine/rng';
import { wordsConflict } from '../engine/validator';

export type QuestionKind = 'term' | 'definition' | 'cloze';
export const QUESTION_KINDS: readonly QuestionKind[] = ['term', 'definition', 'cloze'];
export const BLANK = '_____';

export interface QuizOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  entryId: string;
  kind: QuestionKind;
  prompt: string;
  /** The definition, term or blanked sentence the prompt refers to. */
  stem: string;
  options: QuizOption[];
  correctId: string;
  /** Shown after answering. */
  explanation: string;
}

const OPTION_IDS = ['a', 'b', 'c', 'd', 'e'];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Replaces the term in a sentence with a blank, preferring whole-word matches. */
export function blankOut(sentence: string, term: string): string {
  const esc = escapeRe(term);
  const whole = new RegExp(`\\b${esc}\\b`, 'gi');
  if (new RegExp(`\\b${esc}\\b`, 'i').test(sentence)) return sentence.replace(whole, BLANK);
  return sentence.replace(new RegExp(esc, 'gi'), BLANK);
}

const mentions = (text: string, term: string) => new RegExp(`\\b${escapeRe(term)}`, 'i').test(text);

/**
 * Picks plausible but wrong options: same topic first, then same category, with similar difficulty.
 * Never picks a word that could be confused with the answer or that appears in the question text itself.
 */
export function pickDistractors(entry: Entry, pool: readonly Entry[], count: number, rng: Rng, avoidText: string): Entry[] {
  const ok = (c: Entry) =>
    c.id !== entry.id &&
    c.word !== entry.word &&
    !wordsConflict(c.word, entry.word) &&
    !mentions(avoidText, c.term) &&
    !mentions(c.definition, entry.term) &&
    c.definition !== entry.definition;
  let candidates = pool.filter(ok);
  const out: Entry[] = [];
  const weight = (c: Entry): number => {
    const dd = c.difficulty - entry.difficulty;
    let w = c.topic === entry.topic && c.category === entry.category ? 10 : c.category === entry.category ? 4 : 0.2;
    w *= Math.exp(-(dd * dd) / (2 * 1.2 * 1.2)) + 0.1;
    if (Math.abs(c.word.length - entry.word.length) <= 3) w *= 1.4;
    return w;
  };
  while (out.length < count && candidates.length > 0) {
    const i = rng.weightedIndex(candidates.map(weight));
    const [pick] = candidates.splice(i, 1);
    out.push(pick);
    candidates = candidates.filter((c) => !wordsConflict(c.word, pick.word));
  }
  return out;
}

export function buildQuestion(entry: Entry, kind: QuestionKind, pool: readonly Entry[], rng: Rng, optionCount = 4): Question | null {
  let prompt: string;
  let stem: string;
  let avoid: string;
  let text: (e: Entry) => string;
  switch (kind) {
    case 'term':
      prompt = 'Which term matches this definition?';
      stem = entry.definition;
      avoid = entry.definition;
      text = (e) => e.term;
      break;
    case 'definition':
      prompt = 'What does this term mean?';
      stem = entry.term;
      avoid = '';
      text = (e) => e.definition;
      break;
    case 'cloze':
      prompt = 'Which word completes the sentence?';
      stem = blankOut(entry.example, entry.term);
      avoid = stem;
      text = (e) => e.term;
      break;
  }
  const distractors = pickDistractors(entry, pool, optionCount - 1, rng, avoid);
  if (distractors.length < 1) return null;
  const shuffled = rng.shuffle([entry, ...distractors]);
  const options = shuffled.map((e, i) => ({ id: OPTION_IDS[i], text: text(e) }));
  const correctId = options[shuffled.indexOf(entry)].id;
  return {
    id: `${kind}:${entry.id}`,
    entryId: entry.id,
    kind,
    prompt,
    stem,
    options,
    correctId,
    explanation: `${entry.term}: ${entry.definition}`,
  };
}

export interface QuizSpec {
  /** Entries to ask about (e.g. the words just found). */
  entries: readonly Entry[];
  count: number;
  seed: string;
  /** Where distractors come from; defaults to `entries`. */
  pool?: readonly Entry[];
  kinds?: readonly QuestionKind[];
}

export function buildQuiz(spec: QuizSpec): Question[] {
  const rng = new Rng(spec.seed);
  const pool = spec.pool ?? spec.entries;
  const kinds = spec.kinds?.length ? spec.kinds : QUESTION_KINDS;
  const chosen = rng.shuffle(spec.entries).slice(0, Math.max(0, spec.count));
  const offset = rng.int(0, kinds.length - 1);
  const out: Question[] = [];
  chosen.forEach((entry, i) => {
    const preferred = kinds[(i + offset) % kinds.length];
    // If a format cannot be built (e.g. too few distractors), fall back to the others.
    const order = [preferred, ...kinds.filter((k) => k !== preferred)];
    for (const kind of order) {
      const q = buildQuestion(entry, kind, pool, rng.fork(`q${i}:${kind}`));
      if (q) {
        out.push(q);
        break;
      }
    }
  });
  return out;
}

export function isCorrect(q: Question, optionId: string): boolean {
  return q.correctId === optionId;
}

export interface QuizResult {
  correct: number;
  total: number;
  ratio: number;
  perEntry: Array<{ entryId: string; correct: boolean }>;
}

/** Grades a set of answers (question id → chosen option id). Unanswered questions count as wrong. */
export function gradeQuiz(questions: readonly Question[], answers: Readonly<Record<string, string>>): QuizResult {
  const perEntry = questions.map((q) => ({ entryId: q.entryId, correct: answers[q.id] === q.correctId }));
  const correct = perEntry.filter((p) => p.correct).length;
  return { correct, total: questions.length, ratio: questions.length ? correct / questions.length : 0, perEntry };
}
