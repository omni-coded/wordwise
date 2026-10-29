/**
 * Persistence. Saves live in localStorage when it is available and fall back to memory when it is not
 * (private windows, blocked storage). Everything read back is treated as untrusted: it is parsed defensively,
 * migrated, and sanitised field by field, so a corrupt or hand-edited save can never crash the app.
 */
import { clearPacks, getEntry, loadPacks } from '../content';
import { JOURNEYS } from '../content/journeys';
import { validatePuzzle } from '../engine/validator';
import type { Puzzle, PuzzleMode } from '../engine/types';
import { getAchievement } from './achievements';
import { isDateKey } from './dates';
import { GRID_THEMES, HIGHLIGHT_STYLES, isUnlocked } from './progression';
import { QUESTION_KINDS, type Question, type QuestionKind } from './quiz';
import { MAX_BOX, type WordRecord } from './srs';
import {
  APP_ID,
  MOTION_PREFS,
  SAVE_VERSION,
  TEXT_SIZES,
  THEME_MODES,
  defaultSettings,
  emptySave,
  emptyStats,
  type ActiveGame,
  type DailyResult,
  type JourneyProgress,
  type QuizState,
  type ReviewSession,
  type SaveData,
  type Settings,
  type Stats,
  type Summary,
} from './state';
import type { ActivityMap } from './streaks';

/* ─────────────────────────────── key-value store ─────────────────────────────── */

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const SAVE_KEY = 'wordwise.save.v1';
export const BACKUP_KEY = 'wordwise.save.v1.bak';
export const CORRUPT_KEY = 'wordwise.save.v1.corrupt';
export const FUTURE_KEY = 'wordwise.save.future';

export function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
  };
}

/** localStorage if it works, otherwise an in-memory store (progress then lasts only for this visit). */
export function detectStore(): { store: KeyValueStore; persistent: boolean } {
  try {
    const ls = (globalThis as { localStorage?: KeyValueStore }).localStorage;
    if (!ls) throw new Error('no localStorage');
    const probe = '__wordwise_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return { store: ls, persistent: true };
  } catch {
    return { store: memoryStore(), persistent: false };
  }
}

/* ─────────────────────────────── sanitising helpers ─────────────────────────────── */

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, def: number, min = -Infinity, max = Infinity): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : def;
const int = (v: unknown, def: number, min = -Infinity, max = Infinity): number => Math.round(num(v, def, min, max));
const bool = (v: unknown, def: boolean): boolean => (typeof v === 'boolean' ? v : def);
const str = (v: unknown, def = ''): string => (typeof v === 'string' ? v : def);
const oneOf = <T extends string>(v: unknown, opts: readonly T[], def: T): T => (opts.includes(v as T) ? (v as T) : def);
const strArray = (v: unknown, max = 5000): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, max) : []);

const MODES: readonly PuzzleMode[] = ['campaign', 'daily', 'journey', 'expert', 'practice'];

export function sanitizeSettings(raw: unknown): Settings {
  const d = defaultSettings();
  if (!isRec(raw)) return d;
  return {
    theme: oneOf(raw.theme, THEME_MODES, d.theme),
    textSize: oneOf(raw.textSize, TEXT_SIZES, d.textSize),
    motion: oneOf(raw.motion, MOTION_PREFS, d.motion),
    highContrast: bool(raw.highContrast, d.highContrast),
    plainFont: bool(raw.plainFont, d.plainFont),
    sound: bool(raw.sound, d.sound),
    sfxVolume: num(raw.sfxVolume, d.sfxVolume, 0, 1),
    music: bool(raw.music, d.music),
    musicVolume: num(raw.musicVolume, d.musicVolume, 0, 1),
    haptics: bool(raw.haptics, d.haptics),
    showTimer: bool(raw.showTimer, d.showTimer),
    focusMode: bool(raw.focusMode, d.focusMode),
    learnToasts: bool(raw.learnToasts, d.learnToasts),
    expertTimed: bool(raw.expertTimed, d.expertTimed),
    gridTheme: GRID_THEMES.some((t) => t.id === raw.gridTheme) ? (raw.gridTheme as string) : d.gridTheme,
    highlightStyle: HIGHLIGHT_STYLES.some((t) => t.id === raw.highlightStyle) ? (raw.highlightStyle as string) : d.highlightStyle,
    enabledCategories: Array.isArray(raw.enabledCategories) ? strArray(raw.enabledCategories, 200) : null,
  };
}

export function sanitizeStats(raw: unknown): Stats {
  const d = emptyStats();
  if (!isRec(raw)) return d;
  const out: Stats = { ...d };
  for (const k of Object.keys(d) as Array<keyof Stats>) {
    if (k === 'byCategory') continue;
    (out as unknown as Rec)[k] = int(raw[k], 0, 0, 1e12);
  }
  if (isRec(raw.byCategory)) {
    for (const [id, v] of Object.entries(raw.byCategory).slice(0, 500)) {
      if (!isRec(v)) continue;
      out.byCategory[id] = {
        puzzles: int(v.puzzles, 0, 0, 1e9),
        found: int(v.found, 0, 0, 1e9),
        quizCorrect: int(v.quizCorrect, 0, 0, 1e9),
        quizTotal: int(v.quizTotal, 0, 0, 1e9),
      };
    }
  }
  return out;
}

function sanitizeWords(raw: unknown): Record<string, WordRecord> {
  const out: Record<string, WordRecord> = {};
  if (!isRec(raw)) return out;
  for (const [id, v] of Object.entries(raw).slice(0, 20_000)) {
    if (!isRec(v)) continue;
    const rec: WordRecord = {
      firstFound: int(v.firstFound, 0, 0),
      timesFound: int(v.timesFound, 1, 1, 1e9),
      box: int(v.box, 0, 0, MAX_BOX),
      due: int(v.due, 0, 0, 1e7),
      right: int(v.right, 0, 0, 1e9),
      wrong: int(v.wrong, 0, 0, 1e9),
      favorite: bool(v.favorite, false),
    };
    if (typeof v.last === 'number' && Number.isFinite(v.last)) rec.last = int(v.last, 0, 0, 1e7);
    out[id] = rec;
  }
  return out;
}

function sanitizeCampaign(raw: unknown): SaveData['campaign'] {
  const out = { level: 1, stars: {} as Record<string, number> };
  if (!isRec(raw)) return out;
  out.level = int(raw.level, 1, 1, 1_000_000);
  if (isRec(raw.stars)) {
    for (const [k, v] of Object.entries(raw.stars).slice(0, 20_000)) {
      const lvl = Number(k);
      if (Number.isInteger(lvl) && lvl >= 1) out.stars[String(lvl)] = int(v, 1, 1, 3);
    }
  }
  return out;
}

function sanitizeJourneys(raw: unknown): Record<string, JourneyProgress> {
  const out: Record<string, JourneyProgress> = {};
  if (!isRec(raw)) return out;
  for (const j of JOURNEYS) {
    const v = raw[j.id];
    if (!isRec(v)) continue;
    const steps = j.steps.length;
    out[j.id] = {
      next: int(v.next, 0, 0, steps),
      stars: (Array.isArray(v.stars) ? v.stars : []).slice(0, steps).map((s) => int(s, 0, 0, 3)),
      mastery: bool(v.mastery, false),
      masteryAttempts: int(v.masteryAttempts, 0, 0, 1e6),
    };
  }
  return out;
}

function sanitizeDaily(raw: unknown): Record<string, DailyResult> {
  const out: Record<string, DailyResult> = {};
  if (!isRec(raw)) return out;
  const keys = Object.keys(raw).filter(isDateKey).sort().slice(-400);
  for (const k of keys) {
    const v = raw[k];
    if (!isRec(v)) continue;
    out[k] = {
      score: int(v.score, 0, 0, 1e6),
      stars: int(v.stars, 1, 0, 3),
      xp: int(v.xp, 0, 0, 1e6),
      words: strArray(v.words, 100),
      quizCorrect: int(v.quizCorrect, 0, 0, 100),
      quizTotal: int(v.quizTotal, 0, 0, 100),
      completedAt: int(v.completedAt, 0, 0),
    };
  }
  return out;
}

function sanitizeActivity(raw: unknown): ActivityMap {
  const out: ActivityMap = {};
  if (!isRec(raw)) return out;
  const keys = Object.keys(raw).filter(isDateKey).sort().slice(-1000);
  for (const k of keys) {
    const v = raw[k];
    if (!isRec(v)) continue;
    out[k] = { puzzles: int(v.puzzles, 0, 0, 1e6), reviews: int(v.reviews, 0, 0, 1e6), xp: int(v.xp, 0, 0, 1e9) };
  }
  return out;
}

function sanitizeAchievements(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isRec(raw)) return out;
  for (const [id, t] of Object.entries(raw)) if (getAchievement(id) && typeof t === 'number' && Number.isFinite(t)) out[id] = t;
  return out;
}

function sanitizeQuestion(raw: unknown): Question | null {
  if (!isRec(raw)) return null;
  const kind = oneOf<QuestionKind>(raw.kind, QUESTION_KINDS, 'term');
  if (!QUESTION_KINDS.includes(raw.kind as QuestionKind)) return null;
  const options = (Array.isArray(raw.options) ? raw.options : [])
    .filter(isRec)
    .map((o) => ({ id: str(o.id), text: str(o.text) }))
    .filter((o) => o.id && o.text)
    .slice(0, 6);
  const correctId = str(raw.correctId);
  const id = str(raw.id);
  const entryId = str(raw.entryId);
  if (!id || !entryId || options.length < 2 || !options.some((o) => o.id === correctId)) return null;
  return { id, entryId, kind, prompt: str(raw.prompt), stem: str(raw.stem), options, correctId, explanation: str(raw.explanation) };
}

function sanitizeAnswers(raw: unknown, questions: Question[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isRec(raw)) return out;
  for (const q of questions) {
    const a = raw[q.id];
    if (typeof a === 'string' && q.options.some((o) => o.id === a)) out[q.id] = a;
  }
  return out;
}

function sanitizeQuiz(raw: unknown): QuizState | null {
  if (!isRec(raw)) return null;
  const questions = (Array.isArray(raw.questions) ? raw.questions : []).map(sanitizeQuestion).filter((q): q is Question => q !== null).slice(0, 30);
  if (questions.length === 0) return null;
  const answers = sanitizeAnswers(raw.answers, questions);
  return {
    kind: raw.kind === 'mastery' ? 'mastery' : 'fact',
    questions,
    answers,
    done: bool(raw.done, false) && Object.keys(answers).length === questions.length,
    correct: int(raw.correct, 0, 0, questions.length),
    attempt: int(raw.attempt, 0, 0, 1e6),
  };
}

function sanitizeReview(raw: unknown): ReviewSession | null {
  if (!isRec(raw)) return null;
  const questions = (Array.isArray(raw.questions) ? raw.questions : []).map(sanitizeQuestion).filter((q): q is Question => q !== null).slice(0, 30);
  if (questions.length === 0) return null;
  const answers = sanitizeAnswers(raw.answers, questions);
  return {
    startedAt: int(raw.startedAt, 0, 0),
    questions,
    answers,
    done: bool(raw.done, false) && Object.keys(answers).length === questions.length,
    correct: int(raw.correct, 0, 0, questions.length),
    xp: int(raw.xp, 0, 0, 1e6),
    coins: int(raw.coins, 0, 0, 1e6),
  };
}

function sanitizeSummary(raw: unknown): Summary | null {
  if (!isRec(raw)) return null;
  const mode = oneOf<PuzzleMode>(raw.mode, MODES, 'campaign');
  if (!MODES.includes(raw.mode as PuzzleMode) || !str(raw.id) || !str(raw.puzzleId)) return null;
  const words = (Array.isArray(raw.words) ? raw.words : [])
    .filter(isRec)
    .map((w) => ({ entryId: str(w.entryId), bonus: bool(w.bonus, false), isNew: bool(w.isNew, false) }))
    .filter((w) => w.entryId && getEntry(w.entryId))
    .slice(0, 100);
  const xp = isRec(raw.xp)
    ? {
        base: int(raw.xp.base, 0, 0, 1e6),
        bonusWords: int(raw.xp.bonusWords, 0, 0, 1e6),
        precision: int(raw.xp.precision, 0, 0, 1e6),
        unassisted: int(raw.xp.unassisted, 0, 0, 1e6),
        discovery: int(raw.xp.discovery, 0, 0, 1e6),
        total: int(raw.xp.total, 0, 0, 1e6),
      }
    : null;
  const s: Summary = {
    id: str(raw.id),
    puzzleId: str(raw.puzzleId),
    mode,
    level: int(raw.level, 1, 1, 1e6),
    title: str(raw.title),
    theme: str(raw.theme),
    categoryId: str(raw.categoryId),
    topicId: str(raw.topicId),
    outcome: raw.outcome === 'timeout' ? 'timeout' : 'complete',
    completedAt: int(raw.completedAt, 0, 0),
    elapsedMs: int(raw.elapsedMs, 0, 0, 1e10),
    accuracy: num(raw.accuracy, 1, 0, 1),
    hints: int(raw.hints, 0, 0, 1e6),
    misses: int(raw.misses, 0, 0, 1e6),
    attempts: int(raw.attempts, 0, 0, 1e6),
    words,
    xp,
    xpTotal: int(raw.xpTotal, 0, 0, 1e6),
    coins: int(raw.coins, 0, 0, 1e6),
    starsPre: int(raw.starsPre, 1, 0, 3),
    stars: int(raw.stars, 1, 0, 3),
    quiz: sanitizeQuiz(raw.quiz),
    rankBefore: int(raw.rankBefore, 0, 0, 1e6),
    rankAfter: int(raw.rankAfter, 0, 0, 1e6),
    unlocked: strArray(raw.unlocked, 50),
    streak: int(raw.streak, 0, 0, 1e6),
  };
  if (typeof raw.journeyId === 'string') s.journeyId = raw.journeyId;
  if (typeof raw.journeyStep === 'number') s.journeyStep = int(raw.journeyStep, 0, 0, 100);
  if (raw.mastery === true) s.mastery = true;
  if (typeof raw.dailyKey === 'string' && isDateKey(raw.dailyKey)) s.dailyKey = raw.dailyKey;
  if (typeof raw.dailyScore === 'number') s.dailyScore = int(raw.dailyScore, 0, 0, 1e6);
  if (raw.masteryResult === 'pass' || raw.masteryResult === 'fail') s.masteryResult = raw.masteryResult;
  if (raw.journeyDone === true) s.journeyDone = true;
  return s;
}

function looksLikePuzzle(p: unknown): p is Puzzle {
  if (!isRec(p) || p.v !== 1) return false;
  if (!Array.isArray(p.grid) || !p.grid.every((r) => typeof r === 'string')) return false;
  if (!Array.isArray(p.placements)) return false;
  const okPlacement = (x: unknown) =>
    isRec(x) && typeof x.entryId === 'string' && typeof x.word === 'string' && typeof x.display === 'string' && (x.kind === 'target' || x.kind === 'bonus') &&
    ['r', 'c', 'dr', 'dc'].every((k) => Number.isInteger(x[k]));
  if (!p.placements.every(okPlacement)) return false;
  return typeof p.id === 'string' && typeof p.size === 'number' && isRec(p.spec) && isRec(p.params) && Array.isArray(p.clueIds);
}

function sanitizeGame(raw: unknown): ActiveGame | null {
  if (!isRec(raw) || !looksLikePuzzle(raw.puzzle) || !isRec(raw.state)) return null;
  const puzzle = raw.puzzle;
  try {
    if (validatePuzzle(puzzle).length > 0) return null;
  } catch {
    return null;
  }
  if (!puzzle.placements.every((p) => getEntry(p.entryId))) return null; // content changed underneath the save
  const st = raw.state;
  if (st.puzzleId !== puzzle.id) return null;
  const targetIds = new Set(puzzle.placements.filter((p) => p.kind === 'target').map((p) => p.entryId));
  const bonusIds = new Set(puzzle.placements.filter((p) => p.kind === 'bonus').map((p) => p.entryId));
  const found = strArray(st.found).filter((id, i, a) => targetIds.has(id) && a.indexOf(id) === i);
  const bonusFound = strArray(st.bonusFound).filter((id, i, a) => bonusIds.has(id) && a.indexOf(id) === i);
  const complete = found.length === targetIds.size;
  const attempts = int(st.attempts, 0, 0, 1e6);
  return {
    puzzle,
    state: {
      puzzleId: puzzle.id,
      found,
      bonusFound,
      attempts: Math.max(attempts, found.length + bonusFound.length),
      correct: Math.min(int(st.correct, 0, 0, 1e6), Math.max(attempts, found.length + bonusFound.length)),
      hintsUsed: int(st.hintsUsed, 0, 0, 1e6),
      hinted: strArray(st.hinted).filter((id) => targetIds.has(id)),
      elapsedMs: int(st.elapsedMs, 0, 0, 1e10),
      status: complete ? 'complete' : 'playing',
    },
    startedAt: int(raw.startedAt, 0, 0),
    paused: bool(raw.paused, true), // always resume paused after a reload
    fresh: strArray(raw.fresh).filter((id) => found.includes(id) || bonusFound.includes(id)),
    limitMs: typeof raw.limitMs === 'number' && Number.isFinite(raw.limitMs) && raw.limitMs > 0 ? Math.round(raw.limitMs) : null,
  };
}

/* ─────────────────────────────── whole-save sanitising ─────────────────────────────── */

/** Builds a trustworthy SaveData from anything. Unknown or invalid fields fall back to defaults. */
export function sanitizeSave(raw: unknown, now: number = Date.now()): SaveData {
  const base = emptySave(now);
  if (!isRec(raw)) return base;
  const stats = sanitizeStats(raw.stats);
  const settings = sanitizeSettings(raw.settings);
  // Cosmetics that the player has not yet unlocked fall back to defaults (guards against edited saves).
  const theme = GRID_THEMES.find((t) => t.id === settings.gridTheme);
  if (theme && !isUnlocked(theme, stats.xp)) settings.gridTheme = base.settings.gridTheme;
  const style = HIGHLIGHT_STYLES.find((t) => t.id === settings.highlightStyle);
  if (style && !isUnlocked(style, stats.xp)) settings.highlightStyle = base.settings.highlightStyle;

  const packs = Array.isArray(raw.packs) ? raw.packs.filter(isRec).slice(0, 50) : [];
  return {
    ...base,
    createdAt: int(raw.createdAt, now, 0),
    updatedAt: int(raw.updatedAt, now, 0),
    onboarded: bool(raw.onboarded, false),
    settings,
    stats,
    words: sanitizeWords(raw.words),
    campaign: sanitizeCampaign(raw.campaign),
    journeys: sanitizeJourneys(raw.journeys),
    daily: sanitizeDaily(raw.daily),
    activity: sanitizeActivity(raw.activity),
    achievements: sanitizeAchievements(raw.achievements),
    unseenBadges: strArray(raw.unseenBadges, 100).filter((id) => !!getAchievement(id)),
    game: sanitizeGame(raw.game),
    summary: sanitizeSummary(raw.summary),
    review: sanitizeReview(raw.review),
    packs,
    serial: int(raw.serial, 0, 0, 1e9),
  };
}

/** Upgrades older save formats step by step. (There is only version 1 so far; this is the extension point.) */
const MIGRATIONS: Array<(raw: Rec) => Rec> = [];

export function migrate(raw: Rec): { raw: Rec; newer: boolean } {
  let v = typeof raw.v === 'number' && Number.isFinite(raw.v) ? Math.floor(raw.v) : 1;
  if (v > SAVE_VERSION) return { raw, newer: true };
  let cur = raw;
  while (v < SAVE_VERSION) {
    const step = MIGRATIONS[v - 1];
    if (step) cur = step(cur);
    v++;
  }
  return { raw: { ...cur, v: SAVE_VERSION }, newer: false };
}

/** Registers the save's content packs (dropping any that no longer validate) and returns the survivors' raw JSON. */
function restorePacks(raw: Rec): unknown[] {
  clearPacks();
  const list = Array.isArray(raw.packs) ? raw.packs : [];
  const results = loadPacks(list);
  return list.filter((_, i) => results[i].ok);
}

function parseSave(text: string | null): { ok: true; raw: Rec } | { ok: false } {
  if (text === null) return { ok: false };
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRec(parsed) || parsed.app !== APP_ID) return { ok: false };
    return { ok: true, raw: parsed };
  } catch {
    return { ok: false };
  }
}

export type LoadStatus = 'fresh' | 'ok' | 'restored-backup' | 'reset-corrupt' | 'newer-version';

export interface LoadResult {
  save: SaveData;
  status: LoadStatus;
}

function build(raw: Rec, now: number): SaveData {
  const packs = restorePacks(raw);
  const save = sanitizeSave({ ...raw, packs }, now);
  save.packs = packs.filter(isRec);
  return save;
}

export function loadSave(store: KeyValueStore, now: number = Date.now()): LoadResult {
  let text: string | null = null;
  try {
    text = store.getItem(SAVE_KEY);
  } catch {
    text = null;
  }
  if (text === null) {
    let backup: string | null = null;
    try {
      backup = store.getItem(BACKUP_KEY);
    } catch {
      backup = null;
    }
    const b = parseSave(backup);
    if (b.ok) return { save: build(migrate(b.raw).raw, now), status: 'restored-backup' };
    clearPacks();
    return { save: emptySave(now), status: 'fresh' };
  }

  const main = parseSave(text);
  if (main.ok) {
    const m = migrate(main.raw);
    if (m.newer) {
      try {
        store.setItem(FUTURE_KEY, text);
      } catch {
        /* keep going: the player can still play a fresh save */
      }
      clearPacks();
      return { save: emptySave(now), status: 'newer-version' };
    }
    return { save: build(m.raw, now), status: 'ok' };
  }

  // The main save is unreadable: keep it for inspection, then try the backup.
  try {
    store.setItem(CORRUPT_KEY, text);
  } catch {
    /* ignore */
  }
  let backup: string | null = null;
  try {
    backup = store.getItem(BACKUP_KEY);
  } catch {
    backup = null;
  }
  const b = parseSave(backup);
  if (b.ok) return { save: build(migrate(b.raw).raw, now), status: 'restored-backup' };
  clearPacks();
  return { save: emptySave(now), status: 'reset-corrupt' };
}

/** Writes the save. Returns false (never throws) if storage is full or unavailable. */
export function writeSave(store: KeyValueStore, save: SaveData, opts: { backup?: boolean } = {}): boolean {
  try {
    const text = JSON.stringify(save);
    if (opts.backup) {
      const prev = store.getItem(SAVE_KEY);
      if (prev !== null && parseSave(prev).ok) store.setItem(BACKUP_KEY, prev);
    }
    store.setItem(SAVE_KEY, text);
    return true;
  } catch {
    return false;
  }
}

/* ─────────────────────────────── export / import / reset ─────────────────────────────── */

export function exportSave(save: SaveData, now: number = Date.now()): string {
  return JSON.stringify({ ...save, exportedAt: now }, null, 2);
}

export type ImportResult = { ok: true; save: SaveData } | { ok: false; error: string };

export function importSave(text: string, now: number = Date.now()): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' };
  }
  if (!isRec(parsed) || parsed.app !== APP_ID) return { ok: false, error: 'That does not look like a WordWise save file.' };
  const m = migrate(parsed);
  if (m.newer) return { ok: false, error: 'That save was made by a newer version of WordWise. Please update the app first.' };
  const save = build(m.raw, now);
  // An imported save never resumes a half-finished puzzle from another device mid-flight.
  return { ok: true, save: { ...save, updatedAt: now } };
}

/** Clears stored progress. Settings can optionally be kept. */
export function resetSave(store: KeyValueStore, keepSettings: Settings | null, now: number = Date.now()): SaveData {
  for (const k of [SAVE_KEY, BACKUP_KEY, CORRUPT_KEY, FUTURE_KEY]) {
    try {
      store.removeItem(k);
    } catch {
      /* ignore */
    }
  }
  clearPacks();
  const fresh = emptySave(now);
  if (keepSettings) fresh.settings = { ...keepSettings };
  return fresh;
}
