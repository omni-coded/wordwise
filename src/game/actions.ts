/**
 * Game flow as pure state transitions: every function takes the current SaveData and returns the next one.
 * The UI holds the state and persists it; nothing in here touches the DOM, the clock (time is passed in) or
 * storage, which keeps the whole reward/progress system unit-testable.
 */
import { allEntries, getCategory, getEntry, parsePack, registerPack, unregisterPack, type PackResult } from '../content';
import type { Entry } from '../content/schema';
import { MASTERY_PASS_RATIO, MASTERY_QUESTIONS, getJourney } from '../content/journeys';
import { Rng } from '../engine/rng';
import {
  applyHint,
  newSession,
  pickHintTarget,
  submitSelection,
  accuracy,
  type SubmitResult,
} from '../engine/session';
import type { Cell, Placement, Puzzle } from '../engine/types';
import { evaluateAchievements } from './achievements';
import { DAILY_QUIZ_QUESTIONS, dailyQuizSeed, dailyScore } from './daily';
import { dateKey, dayNumber, isDateKey, type DateKey } from './dates';
import { timeLimitMs } from './factory';
import {
  GRID_THEMES,
  HIGHLIGHT_STYLES,
  coinsForCompletion,
  completionXp,
  consolationXp,
  hintCost,
  isUnlocked,
  newUnlocks,
  quizRewards,
  rankFor,
  reviewRewards,
  starsAfterQuiz,
  starsBeforeQuiz,
} from './progression';
import { buildQuiz, gradeQuiz, type Question } from './quiz';
import { dueList, newRecord, recordFind, review as srsReview, type WordRecord } from './srs';
import { addActivity, bestDailyStreak, dailyStreak, pruneActivity, weeklyStreak } from './streaks';
import type { ActiveGame, DailyResult, QuizState, ReviewSession, SaveData, Settings, Stats, Summary } from './state';
import { sanitizeSettings } from './storage';

export const REVIEW_SIZE = 10;
/** A single frame delay (a sleeping tab, a debugger pause) never adds more than this to the clock. */
export const MAX_TICK_MS = 5000;
export const MASTERY_PASS_XP = 100;
export const MASTERY_PASS_COINS = 20;

const dayOf = (now: number): number => dayNumber(dateKey(new Date(now)));
const keyOf = (now: number): DateKey => dateKey(new Date(now));

/** The date key embedded in a daily puzzle's seed. */
export function dailyKeyOf(puzzle: Puzzle): DateKey | undefined {
  if (puzzle.spec.mode !== 'daily') return undefined;
  const key = puzzle.spec.seed.split('|')[2];
  return isDateKey(key) ? key : undefined;
}

/* ───────────────────────────── helpers ───────────────────────────── */

function bumpCategory(stats: Stats, categoryId: string, delta: Partial<Stats['byCategory'][string]>): Stats {
  const cur = stats.byCategory[categoryId] ?? { puzzles: 0, found: 0, quizCorrect: 0, quizTotal: 0 };
  return {
    ...stats,
    byCategory: {
      ...stats.byCategory,
      [categoryId]: {
        puzzles: cur.puzzles + (delta.puzzles ?? 0),
        found: cur.found + (delta.found ?? 0),
        quizCorrect: cur.quizCorrect + (delta.quizCorrect ?? 0),
        quizTotal: cur.quizTotal + (delta.quizTotal ?? 0),
      },
    },
  };
}

/** Adds XP and coins to the player's totals and today's activity. */
function grant(save: SaveData, xp: number, coins: number, now: number): SaveData {
  if (xp === 0 && coins === 0) return save;
  return {
    ...save,
    stats: { ...save.stats, xp: save.stats.xp + xp, coins: save.stats.coins + coins },
    activity: xp ? addActivity(save.activity, keyOf(now), { xp }) : save.activity,
  };
}

function afterXp(save: SaveData, xpBefore: number): Pick<Summary, 'rankAfter'> & { unlocked: string[] } {
  return { rankAfter: rankFor(save.stats.xp).index, unlocked: newUnlocks(xpBefore, save.stats.xp).map((u) => u.id) };
}

function evaluate(save: SaveData, now: number): SaveData {
  return evaluateAchievements(save, now).save;
}

/* ───────────────────────────── starting & leaving ───────────────────────────── */

export function beginGame(save: SaveData, puzzle: Puzzle, now: number): SaveData {
  const timed = puzzle.spec.mode === 'expert' && save.settings.expertTimed;
  const game: ActiveGame = {
    puzzle,
    state: newSession(puzzle),
    startedAt: now,
    paused: false,
    fresh: [],
    limitMs: timed ? timeLimitMs(puzzle) : null,
  };
  return { ...save, game, summary: null, review: null, onboarded: true, updatedAt: now };
}

export function pauseGame(save: SaveData, now: number): SaveData {
  if (!save.game || save.game.paused) return save;
  return { ...save, game: { ...save.game, paused: true }, updatedAt: now };
}

export function resumeGame(save: SaveData, now: number): SaveData {
  if (!save.game || !save.game.paused) return save;
  return { ...save, game: { ...save.game, paused: false }, updatedAt: now };
}

/** Starts the same puzzle over (found words, hints and the clock reset). Coins already spent stay spent. */
export function restartGame(save: SaveData, now: number): SaveData {
  const g = save.game;
  if (!g) return save;
  return { ...save, game: { ...g, state: newSession(g.puzzle), startedAt: now, paused: false, fresh: [] }, updatedAt: now };
}

export function abandonGame(save: SaveData, now: number): SaveData {
  return save.game ? { ...save, game: null, updatedAt: now } : save;
}

/* ───────────────────────────── playing ───────────────────────────── */

/** Advances the clock. Returns the same object when nothing changed so callers can skip re-rendering. */
export function tickGame(save: SaveData, deltaMs: number, now: number): SaveData {
  const g = save.game;
  if (!g || g.paused || g.state.status !== 'playing' || !(deltaMs > 0)) return save;
  const elapsedMs = g.state.elapsedMs + Math.min(deltaMs, MAX_TICK_MS);
  const next: SaveData = { ...save, game: { ...g, state: { ...g.state, elapsedMs } } };
  if (g.limitMs !== null && elapsedMs >= g.limitMs) return timeoutGame(next, now);
  return next;
}

export interface SelectionOutcome {
  save: SaveData;
  result: SubmitResult;
  /** True when this selection finished the puzzle (the summary is ready). */
  completed: boolean;
}

export function applySelection(save: SaveData, cells: readonly Cell[], now: number): SelectionOutcome {
  const g = save.game;
  if (!g || g.paused || g.state.status !== 'playing') return { save, result: { kind: 'short' }, completed: false };
  const { state, result } = submitSelection(g.puzzle, g.state, cells);
  if (state === g.state) return { save, result, completed: false };

  let next: SaveData = { ...save, game: { ...g, state }, updatedAt: now };
  if ((result.kind === 'found' || result.kind === 'bonus') && result.placement) {
    const id = result.placement.entryId;
    const existed = !!next.words[id];
    const words = { ...next.words, [id]: recordFind(next.words[id], dayOf(now), now) };
    const category = getEntry(id)?.category ?? g.puzzle.categoryId;
    let stats: Stats = { ...next.stats, wordsFound: next.stats.wordsFound + 1, bonusFound: next.stats.bonusFound + (result.kind === 'bonus' ? 1 : 0) };
    stats = bumpCategory(stats, category, { found: 1 });
    next = { ...next, words, stats, game: { ...g, state, fresh: existed ? g.fresh : [...g.fresh, id] } };
  }
  if (state.status === 'complete') {
    return { save: completeGame(next, now), result, completed: true };
  }
  return { save: next, result, completed: false };
}

export type HintOutcome =
  | { ok: true; save: SaveData; placement: Placement; cost: number }
  | { ok: false; reason: 'no-game' | 'paused' | 'coins' | 'finished' };

/** Reveals the first letter of an unfound word. The first few hints are free; later ones cost coins. */
export function useHint(save: SaveData, now: number): HintOutcome {
  const g = save.game;
  if (!g) return { ok: false, reason: 'no-game' };
  if (g.paused || g.state.status !== 'playing') return { ok: false, reason: 'paused' };
  const cost = hintCost(g.state);
  if (cost > save.stats.coins) return { ok: false, reason: 'coins' };
  const target = pickHintTarget(g.puzzle, g.state, new Rng(`${g.puzzle.id}|hint|${g.state.hintsUsed}`));
  if (!target) return { ok: false, reason: 'finished' };
  const state = applyHint(g.state, target);
  const stats = { ...save.stats, coins: save.stats.coins - cost };
  return { ok: true, save: { ...save, stats, game: { ...g, state }, updatedAt: now }, placement: target, cost };
}

/* ───────────────────────────── finishing a puzzle ───────────────────────────── */

function buildFactQuiz(puzzle: Puzzle, foundTargets: Entry[], foundAll: Entry[], attempt: number, key: DateKey | undefined): QuizState | null {
  const isMastery = !!puzzle.spec.mastery;
  const category = getCategory(puzzle.categoryId);
  const pool = category?.entries ?? allEntries();
  let entries: Entry[];
  let count: number;
  let seed: string;
  if (isMastery) {
    entries = category?.entries ?? foundTargets;
    count = MASTERY_QUESTIONS;
    seed = `wordwise|mastery|${puzzle.spec.journeyId}|${attempt}`;
  } else if (key) {
    entries = foundTargets; // identical for every player: targets only, never personal bonus finds
    count = DAILY_QUIZ_QUESTIONS;
    seed = dailyQuizSeed(key);
  } else {
    entries = foundAll;
    count = Math.min(5, 3 + Math.floor(puzzle.level / 10));
    seed = `wordwise|quiz|${puzzle.id}|${attempt}`;
  }
  const questions = buildQuiz({ entries, count, seed, pool });
  if (questions.length < 2) return null;
  return { kind: isMastery ? 'mastery' : 'fact', questions, answers: {}, done: false, correct: 0, attempt };
}

/**
 * Called when the last target word is found. Grants XP and coins, advances the campaign / journey / daily
 * record, updates streaks and statistics, builds the Fact Challenge, and stores the Learning Summary.
 */
export function completeGame(save: SaveData, now: number): SaveData {
  const g = save.game;
  if (!g) return save;
  const { puzzle, state } = g;
  const key = keyOf(now);
  const dailyKey = dailyKeyOf(puzzle);
  const mode = puzzle.spec.mode;
  const xpBefore = save.stats.xp;

  const xp = completionXp({ puzzle, session: state, newWords: g.fresh.length });
  const starsPre = starsBeforeQuiz(state);
  const coins = coinsForCompletion(starsPre, state.bonusFound.length);
  const misses = Math.max(0, state.attempts - state.correct);

  // statistics
  let stats: Stats = {
    ...save.stats,
    puzzles: save.stats.puzzles + 1,
    attempts: save.stats.attempts + state.attempts,
    misses: save.stats.misses + misses,
    hints: save.stats.hints + state.hintsUsed,
    playMs: save.stats.playMs + state.elapsedMs,
    stars: save.stats.stars + starsPre,
    cleanSweeps: save.stats.cleanSweeps + (misses === 0 ? 1 : 0),
    unassisted: save.stats.unassisted + (state.hintsUsed === 0 ? 1 : 0),
    focusDone: save.stats.focusDone + (save.settings.focusMode ? 1 : 0),
    expertDone: save.stats.expertDone + (mode === 'expert' ? 1 : 0),
    dailyDone: save.stats.dailyDone + (mode === 'daily' ? 1 : 0),
    threeStars: save.stats.threeStars,
  };
  if (puzzle.categoryId !== 'all') stats = bumpCategory(stats, puzzle.categoryId, { puzzles: 1 });

  // campaign / journey progress
  let campaign = save.campaign;
  let journeys = save.journeys;
  let journeyDone = false;
  if (mode === 'campaign') {
    campaign = {
      level: Math.max(campaign.level, puzzle.level + 1),
      stars: { ...campaign.stars, [String(puzzle.level)]: Math.max(campaign.stars[String(puzzle.level)] ?? 0, starsPre) },
    };
  }
  if (mode === 'journey' && puzzle.spec.journeyId) {
    const j = getJourney(puzzle.spec.journeyId);
    const step = puzzle.spec.journeyStep ?? 0;
    if (j && step < j.steps.length) {
      const cur = journeys[j.id] ?? { next: 0, stars: [], mastery: false, masteryAttempts: 0 };
      const starsArr = cur.stars.slice();
      while (starsArr.length <= step) starsArr.push(0);
      starsArr[step] = Math.max(starsArr[step], starsPre);
      const next = Math.max(cur.next, step + 1);
      journeyDone = cur.next < j.steps.length && next >= j.steps.length;
      journeys = { ...journeys, [j.id]: { ...cur, next, stars: starsArr } };
    }
  }

  // activity & streaks
  let activity = addActivity(save.activity, key, { puzzles: 1, xp: xp.total });
  activity = pruneActivity(activity, key);
  const ds = dailyStreak(activity, key);
  const ws = weeklyStreak(activity, key);
  stats = {
    ...stats,
    xp: stats.xp + xp.total,
    coins: stats.coins + coins,
    bestDailyStreak: Math.max(stats.bestDailyStreak, ds.current, bestDailyStreak(activity)),
    bestWeeklyStreak: Math.max(stats.bestWeeklyStreak, ws.current),
  };

  // learning summary + fact challenge
  const foundTargets = state.found.map((id) => getEntry(id)).filter((e): e is Entry => !!e);
  const foundBonus = state.bonusFound.map((id) => getEntry(id)).filter((e): e is Entry => !!e);
  const quiz = buildFactQuiz(puzzle, foundTargets, [...foundTargets, ...foundBonus], 0, dailyKey);
  const words = [
    ...state.found.map((id) => ({ entryId: id, bonus: false, isNew: g.fresh.includes(id) })),
    ...state.bonusFound.map((id) => ({ entryId: id, bonus: true, isNew: g.fresh.includes(id) })),
  ].filter((w) => getEntry(w.entryId));

  const acc = accuracy(state);
  const summary: Summary = {
    id: `${puzzle.id}@${now}`,
    puzzleId: puzzle.id,
    mode,
    level: puzzle.level,
    title: puzzle.title,
    theme: puzzle.theme,
    categoryId: puzzle.categoryId,
    topicId: puzzle.topicId,
    outcome: 'complete',
    completedAt: now,
    elapsedMs: state.elapsedMs,
    accuracy: acc,
    hints: state.hintsUsed,
    misses,
    attempts: state.attempts,
    words,
    xp,
    xpTotal: xp.total,
    coins,
    starsPre,
    stars: starsPre,
    quiz,
    rankBefore: rankFor(xpBefore).index,
    rankAfter: rankFor(stats.xp).index,
    unlocked: newUnlocks(xpBefore, stats.xp).map((u) => u.id),
    streak: ds.current,
  };
  if (puzzle.spec.journeyId) summary.journeyId = puzzle.spec.journeyId;
  if (puzzle.spec.journeyStep !== undefined) summary.journeyStep = puzzle.spec.journeyStep;
  if (puzzle.spec.mastery) summary.mastery = true;
  if (journeyDone) summary.journeyDone = true;

  // daily result (provisional: the Fact Challenge adds to it)
  let daily = save.daily;
  if (dailyKey) {
    const score = dailyScore({ accuracy: acc, bonusFound: state.bonusFound.length, hints: state.hintsUsed, quizCorrect: 0 });
    summary.dailyKey = dailyKey;
    summary.dailyScore = score;
    const result: DailyResult = {
      score,
      stars: starsPre,
      xp: xp.total,
      words: state.found.slice(),
      quizCorrect: 0,
      quizTotal: quiz?.questions.length ?? 0,
      completedAt: now,
    };
    daily = { ...daily, [dailyKey]: result };
  }

  const next: SaveData = {
    ...save,
    stats,
    campaign,
    journeys,
    daily,
    activity,
    game: null,
    summary,
    updatedAt: now,
  };
  return evaluate(next, now);
}

/** A timed challenge ran out: what was found still counts as learned, but there are no stars and no progress. */
export function timeoutGame(save: SaveData, now: number): SaveData {
  const g = save.game;
  if (!g) return save;
  const { puzzle, state } = g;
  const key = keyOf(now);
  const xpBefore = save.stats.xp;
  const xp = consolationXp(state, g.fresh.length);
  const misses = Math.max(0, state.attempts - state.correct);
  let activity = addActivity(save.activity, key, { puzzles: 1, xp });
  activity = pruneActivity(activity, key);
  const ds = dailyStreak(activity, key);
  const ws = weeklyStreak(activity, key);
  const stats: Stats = {
    ...save.stats,
    attempts: save.stats.attempts + state.attempts,
    misses: save.stats.misses + misses,
    hints: save.stats.hints + state.hintsUsed,
    playMs: save.stats.playMs + state.elapsedMs,
    xp: save.stats.xp + xp,
    bestDailyStreak: Math.max(save.stats.bestDailyStreak, ds.current),
    bestWeeklyStreak: Math.max(save.stats.bestWeeklyStreak, ws.current),
  };
  const words = [
    ...state.found.map((id) => ({ entryId: id, bonus: false, isNew: g.fresh.includes(id) })),
    ...state.bonusFound.map((id) => ({ entryId: id, bonus: true, isNew: g.fresh.includes(id) })),
  ].filter((w) => getEntry(w.entryId));
  const summary: Summary = {
    id: `${puzzle.id}@${now}`,
    puzzleId: puzzle.id,
    mode: puzzle.spec.mode,
    level: puzzle.level,
    title: puzzle.title,
    theme: puzzle.theme,
    categoryId: puzzle.categoryId,
    topicId: puzzle.topicId,
    outcome: 'timeout',
    completedAt: now,
    elapsedMs: state.elapsedMs,
    accuracy: accuracy(state),
    hints: state.hintsUsed,
    misses,
    attempts: state.attempts,
    words,
    xp: null,
    xpTotal: xp,
    coins: 0,
    starsPre: 0,
    stars: 0,
    quiz: null,
    rankBefore: rankFor(xpBefore).index,
    rankAfter: rankFor(stats.xp).index,
    unlocked: newUnlocks(xpBefore, stats.xp).map((u) => u.id),
    streak: ds.current,
  };
  return evaluate({ ...save, stats, activity, game: null, summary, updatedAt: now }, now);
}

export function dismissSummary(save: SaveData, now: number): SaveData {
  return save.summary ? { ...save, summary: null, updatedAt: now } : save;
}

/* ───────────────────────────── Fact Challenge ───────────────────────────── */

/** Applies one answer to the SRS word record (only for words the player has met). */
function reviewWord(words: Record<string, WordRecord>, entryId: string, correct: boolean, today: number): Record<string, WordRecord> {
  const rec = words[entryId];
  return rec ? { ...words, [entryId]: srsReview(rec, correct, today) } : words;
}

export interface AnswerOutcome {
  save: SaveData;
  /** null when the answer was ignored (unknown question, already answered, …). */
  correct: boolean | null;
  /** True when this answer was the last one and the challenge has been scored. */
  finished: boolean;
}

export function answerSummaryQuestion(save: SaveData, questionId: string, optionId: string, now: number): AnswerOutcome {
  const sum = save.summary;
  const quiz = sum?.quiz;
  const ignored: AnswerOutcome = { save, correct: null, finished: false };
  if (!sum || !quiz || quiz.done) return ignored;
  const q = quiz.questions.find((x) => x.id === questionId);
  if (!q || quiz.answers[questionId] !== undefined || !q.options.some((o) => o.id === optionId)) return ignored;
  const correct = q.correctId === optionId;
  const category = getEntry(q.entryId)?.category ?? sum.categoryId;

  let next: SaveData = {
    ...save,
    words: reviewWord(save.words, q.entryId, correct, dayOf(now)),
    stats: bumpCategory(
      { ...save.stats, quizAnswered: save.stats.quizAnswered + 1, quizCorrect: save.stats.quizCorrect + (correct ? 1 : 0) },
      category,
      { quizTotal: 1, quizCorrect: correct ? 1 : 0 },
    ),
    summary: { ...sum, quiz: { ...quiz, answers: { ...quiz.answers, [questionId]: optionId } } },
    updatedAt: now,
  };
  if (Object.keys(next.summary!.quiz!.answers).length === quiz.questions.length) {
    next = finishSummaryQuiz(next, now);
    return { save: next, correct, finished: true };
  }
  return { save: next, correct, finished: false };
}

function finishSummaryQuiz(save: SaveData, now: number): SaveData {
  const sum = save.summary!;
  const quiz = sum.quiz!;
  const grade = gradeQuiz(quiz.questions, quiz.answers);
  const xpBefore = save.stats.xp;
  const rewards = quizRewards(grade.correct, grade.total);
  let stats: Stats = {
    ...save.stats,
    quizzes: save.stats.quizzes + 1,
    perfectQuizzes: save.stats.perfectQuizzes + (grade.total >= 3 && grade.correct === grade.total ? 1 : 0),
  };
  let xpGain = rewards.xp;
  let coinGain = rewards.coins;
  const patch: Partial<Summary> = {};
  let journeys = save.journeys;
  let campaign = save.campaign;
  let daily = save.daily;

  if (quiz.kind === 'mastery') {
    const pass = grade.ratio >= MASTERY_PASS_RATIO;
    patch.masteryResult = pass ? 'pass' : 'fail';
    const id = sum.journeyId;
    if (id) {
      const cur = journeys[id] ?? { next: 0, stars: [], mastery: false, masteryAttempts: 0 };
      journeys = { ...journeys, [id]: { ...cur, masteryAttempts: cur.masteryAttempts + 1, mastery: cur.mastery || pass } };
    }
    if (pass) {
      xpGain += MASTERY_PASS_XP;
      coinGain += MASTERY_PASS_COINS;
      patch.stars = 3;
      stats = { ...stats, stars: stats.stars + (3 - sum.stars), threeStars: stats.threeStars + (sum.stars < 3 ? 1 : 0) };
    }
  } else {
    const stars = starsAfterQuiz(sum.starsPre as 1 | 2 | 3, grade.ratio);
    if (stars > sum.stars) {
      patch.stars = stars;
      stats = { ...stats, stars: stats.stars + (stars - sum.stars), threeStars: stats.threeStars + (stars === 3 ? 1 : 0) };
      if (sum.mode === 'campaign') {
        campaign = { ...campaign, stars: { ...campaign.stars, [String(sum.level)]: Math.max(campaign.stars[String(sum.level)] ?? 0, stars) } };
      }
      if (sum.mode === 'journey' && sum.journeyId && sum.journeyStep !== undefined && journeys[sum.journeyId]) {
        const jp = journeys[sum.journeyId];
        const arr = jp.stars.slice();
        while (arr.length <= sum.journeyStep) arr.push(0);
        arr[sum.journeyStep] = Math.max(arr[sum.journeyStep], stars);
        journeys = { ...journeys, [sum.journeyId]: { ...jp, stars: arr } };
      }
    }
    if (sum.dailyKey && daily[sum.dailyKey]) {
      const score = dailyScore({ accuracy: sum.accuracy, bonusFound: sum.words.filter((w) => w.bonus).length, hints: sum.hints, quizCorrect: grade.correct });
      patch.dailyScore = score;
      daily = {
        ...daily,
        [sum.dailyKey]: { ...daily[sum.dailyKey], score, stars: patch.stars ?? sum.stars, quizCorrect: grade.correct, quizTotal: grade.total, xp: daily[sum.dailyKey].xp + xpGain },
      };
    }
  }

  let next: SaveData = { ...save, stats, journeys, campaign, daily };
  next = grant(next, xpGain, coinGain, now);
  next = {
    ...next,
    summary: {
      ...sum,
      ...patch,
      quiz: { ...quiz, done: true, correct: grade.correct },
      xpTotal: sum.xpTotal + xpGain,
      coins: sum.coins + coinGain,
      ...afterXp(next, xpBefore),
      unlocked: [...sum.unlocked, ...newUnlocks(xpBefore, next.stats.xp).map((u) => u.id)],
    },
    updatedAt: now,
  };
  return evaluate(next, now);
}

/** After a failed mastery challenge: a fresh set of questions (the puzzle does not need replaying). */
export function retryMastery(save: SaveData, now: number): SaveData {
  const sum = save.summary;
  const quiz = sum?.quiz;
  if (!sum || !quiz || quiz.kind !== 'mastery' || sum.masteryResult !== 'fail') return save;
  const puzzleCategory = getCategory(sum.categoryId);
  if (!puzzleCategory) return save;
  const attempt = quiz.attempt + 1;
  const questions = buildQuiz({
    entries: puzzleCategory.entries,
    count: MASTERY_QUESTIONS,
    seed: `wordwise|mastery|${sum.journeyId}|${attempt}`,
    pool: puzzleCategory.entries,
  });
  if (questions.length < 2) return save;
  const rest: Summary = { ...sum };
  delete rest.masteryResult;
  return { ...save, summary: { ...rest, quiz: { kind: 'mastery', questions, answers: {}, done: false, correct: 0, attempt } }, updatedAt: now };
}

/* ───────────────────────────── Smart Review ───────────────────────────── */

export function startReview(save: SaveData, now: number): SaveData {
  const today = dayOf(now);
  const entries = dueList(save.words, today, REVIEW_SIZE)
    .map((id) => getEntry(id))
    .filter((e): e is Entry => !!e);
  if (entries.length === 0) return save;
  const questions = buildQuiz({ entries, count: entries.length, seed: `wordwise|review|${today}|${save.serial}`, pool: allEntries() });
  if (questions.length === 0) return save;
  const session: ReviewSession = { startedAt: now, questions, answers: {}, done: false, correct: 0, xp: 0, coins: 0 };
  return { ...save, review: session, summary: null, serial: save.serial + 1, updatedAt: now };
}

export function answerReviewQuestion(save: SaveData, questionId: string, optionId: string, now: number): AnswerOutcome {
  const rev = save.review;
  const ignored: AnswerOutcome = { save, correct: null, finished: false };
  if (!rev || rev.done) return ignored;
  const q: Question | undefined = rev.questions.find((x) => x.id === questionId);
  if (!q || rev.answers[questionId] !== undefined || !q.options.some((o) => o.id === optionId)) return ignored;
  const correct = q.correctId === optionId;
  let next: SaveData = {
    ...save,
    words: reviewWord(save.words, q.entryId, correct, dayOf(now)),
    stats: {
      ...save.stats,
      reviewAnswered: save.stats.reviewAnswered + 1,
      reviewCorrect: save.stats.reviewCorrect + (correct ? 1 : 0),
    },
    review: { ...rev, answers: { ...rev.answers, [questionId]: optionId } },
    updatedAt: now,
  };
  if (Object.keys(next.review!.answers).length < rev.questions.length) return { save: next, correct, finished: false };

  const grade = gradeQuiz(rev.questions, next.review!.answers);
  const rewards = reviewRewards(grade.correct, grade.total);
  const key = keyOf(now);
  let activity = addActivity(next.activity, key, { reviews: 1 });
  activity = pruneActivity(activity, key);
  const ds = dailyStreak(activity, key);
  const ws = weeklyStreak(activity, key);
  next = {
    ...next,
    activity,
    stats: {
      ...next.stats,
      reviews: next.stats.reviews + 1,
      bestDailyStreak: Math.max(next.stats.bestDailyStreak, ds.current),
      bestWeeklyStreak: Math.max(next.stats.bestWeeklyStreak, ws.current),
    },
  };
  next = grant(next, rewards.xp, rewards.coins, now);
  next = { ...next, review: { ...next.review!, done: true, correct: grade.correct, xp: rewards.xp, coins: rewards.coins } };
  return { save: evaluate(next, now), correct, finished: true };
}

export function closeReview(save: SaveData, now: number): SaveData {
  return save.review ? { ...save, review: null, updatedAt: now } : save;
}

/* ───────────────────────────── journal, settings, packs ───────────────────────────── */

export function toggleFavorite(save: SaveData, entryId: string, now: number): SaveData {
  const rec = save.words[entryId];
  if (!rec) return save;
  return { ...save, words: { ...save.words, [entryId]: { ...rec, favorite: !rec.favorite } }, updatedAt: now };
}

/** Marks a word the player studied outside a puzzle (e.g. from the Word of the Day) as met, due tomorrow. */
export function meetWord(save: SaveData, entryId: string, now: number): SaveData {
  if (save.words[entryId] || !getEntry(entryId)) return save;
  return { ...save, words: { ...save.words, [entryId]: newRecord(dayOf(now), now) }, updatedAt: now };
}

export function updateSettings(save: SaveData, patch: Partial<Settings>, now: number): SaveData {
  const merged = sanitizeSettings({ ...save.settings, ...patch });
  const theme = GRID_THEMES.find((t) => t.id === merged.gridTheme);
  if (theme && !isUnlocked(theme, save.stats.xp)) merged.gridTheme = save.settings.gridTheme;
  const style = HIGHLIGHT_STYLES.find((t) => t.id === merged.highlightStyle);
  if (style && !isUnlocked(style, save.stats.xp)) merged.highlightStyle = save.settings.highlightStyle;
  return { ...save, settings: merged, updatedAt: now };
}

export function completeOnboarding(save: SaveData, now: number): SaveData {
  return save.onboarded ? save : { ...save, onboarded: true, updatedAt: now };
}

export function ackBadges(save: SaveData): SaveData {
  return save.unseenBadges.length ? { ...save, unseenBadges: [] } : save;
}

export interface AddPackOutcome {
  save: SaveData;
  result: PackResult;
}

/** Validates and installs a content pack (JSON text or object). Registers it for this session as a side effect. */
export function addPack(save: SaveData, input: unknown, now: number): AddPackOutcome {
  const result = parsePack(input);
  if (!result.ok || !result.category) return { save, result };
  const raw: unknown = typeof input === 'string' ? JSON.parse(input) : input;
  registerPack(result.category);
  const id = result.category.id;
  const packs = [
    ...save.packs.filter((p) => (p as { category?: { id?: string } })?.category?.id !== id),
    raw,
  ];
  return { save: { ...save, packs, updatedAt: now }, result };
}

export function removePack(save: SaveData, categoryId: string, now: number): SaveData {
  unregisterPack(categoryId);
  const packs = save.packs.filter((p) => (p as { category?: { id?: string } })?.category?.id !== categoryId);
  const enabled = save.settings.enabledCategories?.filter((id) => id !== categoryId) ?? null;
  return { ...save, packs, settings: { ...save.settings, enabledCategories: enabled && enabled.length ? enabled : null }, updatedAt: now };
}

/** Everything a quick "continue" button needs. */
export function hasActiveGame(save: SaveData): boolean {
  return !!save.game && save.game.state.status === 'playing';
}
