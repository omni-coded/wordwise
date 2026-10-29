/**
 * Puzzle planning. Turns "what the player wants to play" (a campaign level, today's daily, a journey step…)
 * into a PuzzleSpec plus display metadata, then builds the validated puzzle. Planning is deterministic: the same
 * inputs always produce the same puzzle.
 */
import { getBuiltinCategories, getCategories, getCategory, poolFor, poolForAll } from '../content';
import { MASTERY_LEVEL, journeyStepLevel, type Journey } from '../content/journeys';
import { generatePuzzle, type PuzzleMeta } from '../engine/puzzle';
import { Rng } from '../engine/rng';
import { targetsOf } from '../engine/session';
import type { Puzzle, PuzzleSpec } from '../engine/types';
import { dailySpec } from './daily';
import type { DateKey } from './dates';
import { dueList, type WordRecord } from './srs';

export interface PlannedPuzzle {
  spec: PuzzleSpec;
  meta: PuzzleMeta;
}

export interface PlanContext {
  /** Category ids the player has enabled; null = all. */
  enabled: string[] | null;
  words: Record<string, WordRecord>;
  /** Day number of today (for spotting due review words). */
  today: number;
  /** The player's current campaign level. */
  level: number;
}

/** Campaign rotation: a fixed shuffle of the enabled categories, so neighbouring levels vary but are reproducible. */
export function rotationOrder(enabled: string[] | null): string[] {
  const all = getCategories().map((c) => c.id);
  let ids = enabled ? all.filter((id) => enabled.includes(id)) : all;
  if (ids.length === 0) ids = all;
  return new Rng('wordwise|rotation').shuffle(ids.slice().sort());
}

function learnedIn(categoryId: string, words: Record<string, WordRecord>): string[] {
  const cat = getCategory(categoryId);
  return cat ? cat.entries.filter((e) => words[e.id]).map((e) => e.id) : [];
}

function dueIn(categoryId: string, ctx: PlanContext, limit: number): string[] {
  const inCat = new Set(getCategory(categoryId)?.entries.map((e) => e.id));
  return dueList(ctx.words, ctx.today, 200).filter((id) => inCat.has(id)).slice(0, limit);
}

/**
 * Campaign levels come in pairs per category, visiting a different topic each time around.
 * Words the player has not met yet are favoured, and up to two due review words are woven in.
 */
export function campaignPlan(level: number, ctx: PlanContext): PlannedPuzzle {
  const L = Math.max(1, Math.floor(level));
  const order = rotationOrder(ctx.enabled);
  const block = Math.floor((L - 1) / 2);
  const categoryId = order[block % order.length];
  const cat = getCategory(categoryId)!;
  const visit = Math.floor(block / order.length);
  const topic = cat.topics[(visit * 2 + ((L - 1) % 2)) % cat.topics.length];
  const spec: PuzzleSpec = {
    seed: `wordwise|campaign|${L}`,
    mode: 'campaign',
    level: L,
    categoryId,
    topicId: topic.id,
    deprioritize: learnedIn(categoryId, ctx.words),
    mustInclude: dueIn(categoryId, ctx, 2),
  };
  return { spec, meta: { title: topic.name, theme: cat.shortName, topicId: topic.id } };
}

export function dailyPlan(key: DateKey): PlannedPuzzle {
  const spec = dailySpec(key);
  const cat = getBuiltinCategories().find((c) => c.id === spec.categoryId)!;
  return { spec, meta: { title: 'Daily Brain Challenge', theme: cat.shortName, topicId: '' } };
}

export function journeyPlan(journey: Journey, step: number | 'mastery', ctx: PlanContext): PlannedPuzzle {
  const cat = getCategory(journey.categoryId)!;
  const isMastery = step === 'mastery';
  const index = isMastery ? journey.steps.length : step;
  const s = isMastery ? null : journey.steps[step];
  const topicId = s?.topicId ?? '';
  const spec: PuzzleSpec = {
    seed: `wordwise|journey|${journey.id}|${index}`,
    mode: 'journey',
    level: isMastery ? MASTERY_LEVEL : journeyStepLevel(step),
    categoryId: journey.categoryId,
    ...(topicId ? { topicId, topicBoost: 14 } : {}),
    ...(isMastery ? { mastery: true } : {}),
    journeyId: journey.id,
    journeyStep: index,
    deprioritize: learnedIn(journey.categoryId, ctx.words),
  };
  return {
    spec,
    meta: { title: isMastery ? journey.mastery.title : s!.title, theme: `${journey.name} · ${cat.shortName}`, topicId },
  };
}

/** Expert Challenge: a larger, harder grid; `serial` keeps each one fresh. */
export function expertPlan(serial: number, ctx: PlanContext): PlannedPuzzle {
  const order = rotationOrder(ctx.enabled);
  const categoryId = order[serial % order.length];
  const cat = getCategory(categoryId)!;
  const spec: PuzzleSpec = {
    seed: `wordwise|expert|${serial}`,
    mode: 'expert',
    level: Math.max(10, ctx.level) + 4,
    categoryId,
    expert: true,
    deprioritize: learnedIn(categoryId, ctx.words),
  };
  return { spec, meta: { title: 'Expert Challenge', theme: cat.shortName, topicId: '' } };
}

export interface PracticeOptions {
  categoryId: string;
  topicId?: string;
  level: number;
  serial: number;
}

/** Free practice in a chosen category or topic: no campaign progress, reduced XP. */
export function practicePlan(opts: PracticeOptions, ctx: PlanContext): PlannedPuzzle {
  const cat = getCategory(opts.categoryId);
  if (!cat) throw new Error(`unknown category "${opts.categoryId}"`);
  const topic = opts.topicId ? cat.topics.find((t) => t.id === opts.topicId) : undefined;
  const spec: PuzzleSpec = {
    seed: `wordwise|practice|${opts.categoryId}|${opts.topicId ?? '-'}|${opts.serial}`,
    mode: 'practice',
    level: Math.max(1, Math.floor(opts.level)),
    categoryId: opts.categoryId,
    ...(topic ? { topicId: topic.id } : {}),
    deprioritize: learnedIn(opts.categoryId, ctx.words),
    mustInclude: dueIn(opts.categoryId, ctx, 2),
  };
  return { spec, meta: { title: topic?.name ?? cat.name, theme: cat.shortName, topicId: topic?.id ?? '' } };
}

/** A puzzle built around the words that are due for review across every category; null if nothing is due. */
export function reviewPlan(serial: number, ctx: PlanContext): PlannedPuzzle | null {
  const due = dueList(ctx.words, ctx.today, 8);
  if (due.length < 4) return null;
  const spec: PuzzleSpec = {
    seed: `wordwise|review|${serial}`,
    mode: 'practice',
    level: Math.max(3, Math.min(ctx.level, 40)),
    categoryId: 'all',
    mustInclude: due,
  };
  return { spec, meta: { title: 'Review Puzzle', theme: 'Smart Review', topicId: '' } };
}

export function buildPuzzle(plan: PlannedPuzzle): Puzzle {
  const pool = plan.spec.categoryId === 'all' ? poolForAll() : poolFor(plan.spec.categoryId);
  return generatePuzzle(plan.spec, pool, plan.meta);
}

/** Time allowed for a timed challenge: generous (about 26 s per word), since speed is not the point. */
export function timeLimitMs(puzzle: Puzzle): number {
  return Math.round((targetsOf(puzzle).length * 26 + puzzle.size * 1.5) * 1000);
}
