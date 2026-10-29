/**
 * Read-only views over the save, shaped for screens. Pure functions: no state, no side effects.
 */
import { getCategories, getCategory, getEntry } from '../content';
import type { Category, Entry } from '../content/schema';
import { JOURNEYS, type Journey } from '../content/journeys';
import { dueCount, masteryOf, wordState, type Mastery, type WordState } from './srs';
import { dateKey, dayNumber, type DateKey } from './dates';
import { rankFor, type Rank } from './progression';
import type { DailyResult, JourneyProgress, SaveData } from './state';
import { dailyStreak, weeklyStreak, WEEKLY_ACTIVE_DAYS } from './streaks';

export interface Overview {
  rank: Rank;
  xp: number;
  coins: number;
  stars: number;
  level: number;
  dailyStreak: number;
  streakStatus: 'active' | 'at-risk' | 'none';
  weeklyStreak: number;
  weekDaysActive: number;
  weekDaysNeeded: number;
  due: number;
  discovered: number;
  totalWords: number;
  playedToday: boolean;
}

export function overview(save: SaveData, now: number): Overview {
  const key = dateKey(new Date(now));
  const ds = dailyStreak(save.activity, key);
  const ws = weeklyStreak(save.activity, key);
  const act = save.activity[key];
  return {
    rank: rankFor(save.stats.xp),
    xp: save.stats.xp,
    coins: save.stats.coins,
    stars: save.stats.stars,
    level: save.campaign.level,
    dailyStreak: ds.current,
    streakStatus: ds.status,
    weeklyStreak: ws.current,
    weekDaysActive: ws.thisWeekDays,
    weekDaysNeeded: WEEKLY_ACTIVE_DAYS,
    due: dueCount(save.words, dayNumber(key)),
    discovered: Object.keys(save.words).filter((id) => getEntry(id)).length,
    totalWords: getCategories().reduce((n, c) => n + c.entries.length, 0),
    playedToday: !!act && act.puzzles + act.reviews > 0,
  };
}

export interface CategoryProgress {
  category: Category;
  mastery: Mastery;
  topics: Array<{ id: string; name: string; discovered: number; total: number }>;
}

export function categoryProgress(save: SaveData): CategoryProgress[] {
  return getCategories().map((category) => ({
    category,
    mastery: masteryOf(
      category.entries.map((e) => e.id),
      save.words,
    ),
    topics: category.topics.map((t) => {
      const ids = category.entries.filter((e) => e.topic === t.id).map((e) => e.id);
      return { id: t.id, name: t.name, discovered: ids.filter((id) => save.words[id]).length, total: ids.length };
    }),
  }));
}

/* ───────────────────────────── journal ───────────────────────────── */

export type JournalFilter = 'all' | 'favorites' | 'due' | WordState;
export type JournalSort = 'recent' | 'alphabetical' | 'difficulty' | 'weakest';

export interface JournalQuery {
  text?: string;
  categoryId?: string;
  filter?: JournalFilter;
  sort?: JournalSort;
}

export interface JournalItem {
  entry: Entry;
  state: WordState;
  favorite: boolean;
  due: boolean;
  box: number;
  firstFound: number;
}

export function journalItems(save: SaveData, q: JournalQuery, now: number): JournalItem[] {
  const text = (q.text ?? '').trim().toLowerCase();
  const today = dayNumber(dateKey(new Date(now)));
  const items: JournalItem[] = [];
  for (const [id, rec] of Object.entries(save.words)) {
    const entry = getEntry(id);
    if (!entry) continue;
    if (q.categoryId && entry.category !== q.categoryId) continue;
    const state = wordState(rec);
    const due = rec.due <= today;
    const filter = q.filter ?? 'all';
    if (filter === 'favorites' && !rec.favorite) continue;
    if (filter === 'due' && !due) continue;
    if (filter !== 'all' && filter !== 'favorites' && filter !== 'due' && state !== filter) continue;
    if (text) {
      const haystack = `${entry.term} ${entry.definition} ${entry.example} ${entry.fact} ${entry.why} ${getCategory(entry.category)?.name ?? ''}`.toLowerCase();
      if (!haystack.includes(text)) continue;
    }
    items.push({ entry, state, favorite: rec.favorite, due, box: rec.box, firstFound: rec.firstFound });
  }
  const sort = q.sort ?? 'recent';
  items.sort((a, b) => {
    switch (sort) {
      case 'alphabetical':
        return a.entry.term.localeCompare(b.entry.term);
      case 'difficulty':
        return b.entry.difficulty - a.entry.difficulty || a.entry.term.localeCompare(b.entry.term);
      case 'weakest':
        return a.box - b.box || a.entry.term.localeCompare(b.entry.term);
      default:
        return b.firstFound - a.firstFound || a.entry.term.localeCompare(b.entry.term);
    }
  });
  return items;
}

/* ───────────────────────────── journeys & daily ───────────────────────────── */

export interface JourneyStatus {
  journey: Journey;
  progress: JourneyProgress;
  completedSteps: number;
  allStepsDone: boolean;
  masteryUnlocked: boolean;
  mastered: boolean;
  totalStars: number;
  maxStars: number;
}

export function journeyStatus(save: SaveData, journey: Journey): JourneyStatus {
  const progress = save.journeys[journey.id] ?? { next: 0, stars: [], mastery: false, masteryAttempts: 0 };
  const allStepsDone = progress.next >= journey.steps.length;
  return {
    journey,
    progress,
    completedSteps: Math.min(progress.next, journey.steps.length),
    allStepsDone,
    masteryUnlocked: allStepsDone,
    mastered: progress.mastery,
    totalStars: progress.stars.reduce((a, b) => a + b, 0),
    maxStars: journey.steps.length * 3,
  };
}

export function allJourneyStatuses(save: SaveData): JourneyStatus[] {
  return JOURNEYS.map((j) => journeyStatus(save, j));
}

export function dailyResultFor(save: SaveData, key: DateKey): DailyResult | undefined {
  return save.daily[key];
}

/** Daily results from newest to oldest, for the history list. */
export function dailyHistory(save: SaveData, limit = 14): Array<{ key: DateKey; result: DailyResult }> {
  return Object.keys(save.daily)
    .sort()
    .reverse()
    .slice(0, limit)
    .map((key) => ({ key, result: save.daily[key] }));
}

/* ───────────────────────────── stats ───────────────────────────── */

export interface StatsView {
  puzzles: number;
  wordsFound: number;
  discovered: number;
  accuracy: number; // 0–1 across all selections
  quizAccuracy: number | null;
  playMs: number;
  avgMsPerPuzzle: number | null;
  bonusFound: number;
  hints: number;
  threeStars: number;
  bestStreak: number;
  bestWeekly: number;
  mastered: number;
  levelsCompleted: number;
}

export function statsView(save: SaveData): StatsView {
  const s = save.stats;
  const selections = s.attempts;
  const answered = s.quizAnswered + s.reviewAnswered;
  return {
    puzzles: s.puzzles,
    wordsFound: s.wordsFound,
    discovered: Object.keys(save.words).filter((id) => getEntry(id)).length,
    accuracy: selections ? Math.max(0, (selections - s.misses) / selections) : 1,
    quizAccuracy: answered ? (s.quizCorrect + s.reviewCorrect) / answered : null,
    playMs: s.playMs,
    avgMsPerPuzzle: s.puzzles ? Math.round(s.playMs / s.puzzles) : null,
    bonusFound: s.bonusFound,
    hints: s.hints,
    threeStars: s.threeStars,
    bestStreak: s.bestDailyStreak,
    bestWeekly: s.bestWeeklyStreak,
    mastered: Object.values(save.words).filter((w) => w.box >= 4).length,
    levelsCompleted: save.campaign.level - 1,
  };
}

/** Activity for a calendar heat-map: the last `days` days ending at `now`, oldest first. */
export function activityStrip(save: SaveData, now: number, days = 28): Array<{ key: DateKey; count: number }> {
  const end = dayNumber(dateKey(new Date(now)));
  const out: Array<{ key: DateKey; count: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date((end - i) * 86_400_000);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    const a = save.activity[key];
    out.push({ key, count: a ? a.puzzles + a.reviews : 0 });
  }
  return out;
}
