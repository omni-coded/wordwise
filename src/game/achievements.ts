/**
 * Achievement badges. Each badge is a numeric goal over the saved state, so progress bars come for free and
 * evaluation is a pure function: the same save always unlocks the same badges.
 * Speed never earns a badge.
 */
import { getBuiltinCategories, getCategories } from '../content';
import { JOURNEYS } from '../content/journeys';
import type { SaveData } from './state';
import { masteryOf, type Mastery } from './srs';

export type AchievementGroup = 'Beginnings' | 'Levels' | 'Vocabulary' | 'Subjects' | 'Consistency' | 'Challenges' | 'Craft';
export const ACHIEVEMENT_GROUPS: readonly AchievementGroup[] = [
  'Beginnings',
  'Levels',
  'Vocabulary',
  'Subjects',
  'Consistency',
  'Challenges',
  'Craft',
];

interface Ctx {
  save: SaveData;
  masteries: Mastery[];
  builtinMasteries: Mastery[];
  masteredWords: number;
  journeysDone: number;
  journeysMastered: number;
}

export interface Achievement {
  id: string;
  group: AchievementGroup;
  name: string;
  description: string;
  glyph: string;
  goal: number;
  value: (c: Ctx) => number;
}

function buildContext(save: SaveData): Ctx {
  const masteries = getCategories().map((c) =>
    masteryOf(
      c.entries.map((e) => e.id),
      save.words,
    ),
  );
  const builtinIds = new Set(getBuiltinCategories().map((c) => c.id));
  const builtinMasteries = getCategories()
    .map((c, i) => (builtinIds.has(c.id) ? masteries[i] : null))
    .filter((m): m is Mastery => m !== null);
  const journeys = JOURNEYS.map((j) => save.journeys[j.id]);
  return {
    save,
    masteries,
    builtinMasteries,
    masteredWords: Object.values(save.words).filter((w) => w.box >= 4).length,
    journeysDone: journeys.filter((p) => p && p.next >= 8).length,
    journeysMastered: journeys.filter((p) => p?.mastery).length,
  };
}

const a = (
  id: string,
  group: AchievementGroup,
  name: string,
  description: string,
  glyph: string,
  goal: number,
  value: (c: Ctx) => number,
): Achievement => ({ id, group, name, description, glyph, goal, value });

let cached: Achievement[] | null = null;

export function achievementList(): Achievement[] {
  if (cached) return cached;
  const list: Achievement[] = [
    a('first-word', 'Beginnings', 'First Find', 'Find your first word.', '◇', 1, (c) => c.save.stats.wordsFound),
    a('first-puzzle', 'Beginnings', 'Puzzle Solved', 'Complete your first puzzle.', '◆', 1, (c) => c.save.stats.puzzles),
    a('first-quiz', 'Beginnings', 'Putting It to the Test', 'Finish your first Fact Challenge.', '?', 1, (c) => c.save.stats.quizzes),
    a('first-review', 'Beginnings', 'Back to the Books', 'Finish your first Smart Review.', '↻', 1, (c) => c.save.stats.reviews),
  ];

  const milestones: Array<[number, string]> = [
    [10, 'Rising Reader'],
    [25, 'Dedicated Seeker'],
    [50, 'Half-Century'],
    [100, 'Centurion'],
    [250, 'Quarter Thousand'],
    [500, 'Five Hundred'],
    [1000, 'The Thousand'],
  ];
  for (const [n, name] of milestones) {
    list.push(a(`level-${n}`, 'Levels', name, `Complete level ${n}.`, String(n), n, (c) => c.save.campaign.level - 1));
  }

  list.push(
    a('words-50', 'Vocabulary', 'Word Collector', 'Discover 50 different words.', '❝', 50, (c) => Object.keys(c.save.words).length),
    a('words-150', 'Vocabulary', 'Lexicon Builder', 'Discover 150 different words.', '❞', 150, (c) => Object.keys(c.save.words).length),
    a('words-300', 'Vocabulary', 'Walking Dictionary', 'Discover 300 different words.', '☰', 300, (c) => Object.keys(c.save.words).length),
    a('finds-250', 'Vocabulary', 'Seasoned Searcher', 'Find 250 words in puzzles.', '⌕', 250, (c) => c.save.stats.wordsFound),
    a('finds-1000', 'Vocabulary', 'Master Searcher', 'Find 1,000 words in puzzles.', '⌖', 1000, (c) => c.save.stats.wordsFound),
    a('mastered-25', 'Vocabulary', 'Committed to Memory', 'Bring 25 words to mastery through Smart Review.', '✦', 25, (c) => c.masteredWords),
    a('mastered-100', 'Vocabulary', 'Deep Memory', 'Bring 100 words to mastery through Smart Review.', '✧', 100, (c) => c.masteredWords),
    a('favorites-10', 'Vocabulary', 'Curator', 'Mark 10 words as favorites in your journal.', '★', 10, (c) => Object.values(c.save.words).filter((w) => w.favorite).length),
  );

  for (const cat of getBuiltinCategories()) {
    list.push(
      a(`explorer-${cat.id}`, 'Subjects', `${cat.shortName} Explorer`, `Discover 20 words in ${cat.name}.`, cat.glyph, 20, (c) => {
        const i = getCategories().findIndex((x) => x.id === cat.id);
        return i >= 0 ? c.masteries[i].discovered : 0;
      }),
    );
  }
  const best = (c: Ctx) => Math.max(0, ...c.masteries.map((m) => m.percent));
  list.push(
    a('adept-any', 'Subjects', 'Adept', 'Reach 50% mastery in any subject.', '◐', 50, best),
    a('scholar-any', 'Subjects', 'Scholar', 'Reach 75% mastery in any subject.', '◕', 75, best),
    a('master-any', 'Subjects', 'Subject Master', 'Reach 90% mastery in any subject.', '●', 90, best),
    a('polymath', 'Subjects', 'Polymath', 'Reach 25% mastery in five different subjects.', '⬡', 5, (c) => c.builtinMasteries.filter((m) => m.percent >= 25).length),
    a('renaissance-reader', 'Subjects', 'Renaissance Reader', 'Reach 25% mastery in every subject.', '❂', getBuiltinCategories().length, (c) => c.builtinMasteries.filter((m) => m.percent >= 25).length),
  );

  for (const [n, name] of [[3, 'Three in a Row'], [7, 'A Full Week'], [30, 'Thirty Days Sharper'], [100, 'Hundred-Day Habit']] as Array<[number, string]>) {
    list.push(a(`streak-${n}`, 'Consistency', name, `Play on ${n} days in a row.`, '≋', n, (c) => c.save.stats.bestDailyStreak));
  }
  for (const [n, name] of [[4, 'Four Good Weeks'], [12, 'A Season of Learning'], [26, 'Half a Year Strong']] as Array<[number, string]>) {
    list.push(a(`weekly-${n}`, 'Consistency', name, `Play on at least 3 days a week for ${n} weeks running.`, '▤', n, (c) => c.save.stats.bestWeeklyStreak));
  }
  list.push(
    a('daily-1', 'Consistency', 'Daily Debut', 'Complete a Daily Brain Challenge.', '☼', 1, (c) => c.save.stats.dailyDone),
    a('daily-10', 'Consistency', 'Daily Regular', 'Complete 10 Daily Brain Challenges.', '☀', 10, (c) => c.save.stats.dailyDone),
    a('daily-50', 'Consistency', 'Daily Devotee', 'Complete 50 Daily Brain Challenges.', '✺', 50, (c) => c.save.stats.dailyDone),
  );

  list.push(
    a('expert-1', 'Challenges', 'Into the Deep End', 'Complete an Expert Challenge.', '▲', 1, (c) => c.save.stats.expertDone),
    a('expert-10', 'Challenges', 'Expert Veteran', 'Complete 10 Expert Challenges.', '△', 10, (c) => c.save.stats.expertDone),
    a('journey-1', 'Challenges', 'Journey Complete', 'Finish all eight steps of a Themed Journey.', '➤', 1, (c) => c.journeysDone),
    a('journey-all', 'Challenges', 'Grand Tour', 'Finish every Themed Journey.', '⚑', JOURNEYS.length, (c) => c.journeysDone),
    a('mastery-1', 'Challenges', 'Mastery Achieved', 'Pass a Journey mastery challenge.', '♛', 1, (c) => c.journeysMastered),
    a('mastery-all', 'Challenges', 'Renaissance Mind', 'Pass every Journey mastery challenge.', '♚', JOURNEYS.length, (c) => c.journeysMastered),
    a('focus-10', 'Challenges', 'Deep Focus', 'Complete 10 puzzles in Focus Mode.', '◉', 10, (c) => c.save.stats.focusDone),
  );

  list.push(
    a('clean-1', 'Craft', 'Clean Sweep', 'Complete a puzzle without a single wrong selection.', '✓', 1, (c) => c.save.stats.cleanSweeps),
    a('clean-10', 'Craft', 'Steady Hand', 'Complete 10 puzzles without a wrong selection.', '✔', 10, (c) => c.save.stats.cleanSweeps),
    a('unassisted-10', 'Craft', 'Self-Reliant', 'Complete 10 puzzles without using a hint.', '⚓', 10, (c) => c.save.stats.unassisted),
    a('stars-10', 'Craft', 'Star Student', 'Earn three stars on 10 puzzles.', '☆', 10, (c) => c.save.stats.threeStars),
    a('stars-50', 'Craft', 'Constellation', 'Earn three stars on 50 puzzles.', '✯', 50, (c) => c.save.stats.threeStars),
    a('bonus-10', 'Craft', 'Eagle Eye', 'Find 10 hidden bonus words.', '◎', 10, (c) => c.save.stats.bonusFound),
    a('bonus-50', 'Craft', 'Treasure Hunter', 'Find 50 hidden bonus words.', '◈', 50, (c) => c.save.stats.bonusFound),
    a('recall-perfect', 'Craft', 'Sharp Recall', 'Answer every question correctly in a Fact Challenge of three or more.', '✎', 1, (c) => c.save.stats.perfectQuizzes),
    a('answers-100', 'Craft', 'Knowledge Keeper', 'Give 100 correct answers in Fact Challenges and Smart Reviews.', '❖', 100, (c) => c.save.stats.quizCorrect + c.save.stats.reviewCorrect),
    a('reviews-10', 'Craft', 'Habit of Review', 'Finish 10 Smart Review sessions.', '⟳', 10, (c) => c.save.stats.reviews),
  );

  cached = list;
  return list;
}

export function getAchievement(id: string): Achievement | undefined {
  return achievementList().find((x) => x.id === id);
}

export interface AchievementStatus {
  achievement: Achievement;
  value: number;
  goal: number;
  unlockedAt?: number;
}

export function achievementStatuses(save: SaveData): AchievementStatus[] {
  const ctx = buildContext(save);
  return achievementList().map((ach) => ({
    achievement: ach,
    value: Math.min(ach.goal, ach.value(ctx)),
    goal: ach.goal,
    unlockedAt: save.achievements[ach.id],
  }));
}

/** Unlocks every badge whose goal has been met, recording it once. */
export function evaluateAchievements(save: SaveData, now: number): { save: SaveData; unlocked: string[] } {
  const ctx = buildContext(save);
  const unlocked: string[] = [];
  for (const ach of achievementList()) {
    if (save.achievements[ach.id] === undefined && ach.value(ctx) >= ach.goal) unlocked.push(ach.id);
  }
  if (unlocked.length === 0) return { save, unlocked };
  const achievements = { ...save.achievements };
  for (const id of unlocked) achievements[id] = now;
  return { save: { ...save, achievements, unseenBadges: [...save.unseenBadges, ...unlocked] }, unlocked };
}
