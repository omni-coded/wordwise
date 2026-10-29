import { difficultyLabel, estimateScore, measurePuzzle, paramsForLevel } from './difficulty';
import { generateWordSearch } from './generator';
import { Rng, hashString } from './rng';
import type { DifficultyParams, PoolEntry, Puzzle, PuzzleSpec, WordSpec } from './types';
import { pickClueIds, pickWords } from './wordPicker';
import { validatePuzzle } from './validator';

export interface PuzzleMeta {
  title: string;
  theme: string;
  topicId: string;
}

const toSpec = (e: PoolEntry, kind: WordSpec['kind']): WordSpec => ({
  entryId: e.id,
  display: e.term,
  word: e.word,
  kind,
  difficulty: e.difficulty,
  clue: e.clue,
});

export function paramsForSpec(spec: PuzzleSpec): DifficultyParams {
  return paramsForLevel(spec.level, {
    expert: spec.expert,
    mastery: spec.mastery,
    ignoreSpecials: spec.mode !== 'campaign',
  });
}

/**
 * Deterministic end-to-end puzzle generation from a spec and a vocabulary pool.
 * Picks words, builds the grid, then audits it with the independent solver
 * ({@link validatePuzzle}) before returning. If an attempt fails (crowded grid,
 * unavoidable duplicate) it retries with a slightly easier layout, so a valid
 * puzzle is always produced and no unsolvable grid ever escapes.
 */
export function generatePuzzle(spec: PuzzleSpec, pool: PoolEntry[], meta: PuzzleMeta): Puzzle {
  const base = paramsForSpec(spec);
  let size = base.gridSize;
  let wordCount = base.wordCount;
  const minTargets = Math.min(6, Math.max(1, pool.length - 2));
  const deprioritize = new Set(spec.deprioritize ?? []);

  for (let round = 0; round < 14; round++) {
    const params: DifficultyParams = { ...base, gridSize: size, wordCount, maxLen: Math.min(base.maxLen + (size - base.gridSize), size - 1) };
    const rng = new Rng(`${spec.seed}|pick|${round}`);
    const { targets, bonus } = pickWords({
      pool,
      params,
      rng,
      topicId: meta.topicId,
      topicBoost: spec.topicBoost,
      mustInclude: spec.mustInclude,
      deprioritize,
    });
    if (targets.length < minTargets) {
      size = Math.min(size + 1, 24);
      continue;
    }
    const clueIds = pickClueIds(targets, params.clueMode, rng.fork('clue'));
    const words = [...targets.map((t) => toSpec(t, 'target')), ...bonus.map((b) => toSpec(b, 'bonus'))];
    const gen = generateWordSearch(
      words,
      {
        size,
        diagProb: params.diagProb,
        backProb: params.backProb,
        overlapPref: params.overlapPref,
        decoyRate: params.decoyRate,
        decoyFragments: params.decoyFragments,
      },
      `${spec.seed}|grid|${round}`,
      30,
    );
    if (gen) {
      const placements = gen.placements
        .slice()
        .sort((a, b) => (a.kind === b.kind ? a.word.localeCompare(b.word) : a.kind === 'target' ? -1 : 1));
      const finalParams: DifficultyParams = { ...params, wordCount: targets.length, bonusCount: bonus.length };
      // The rating blends the level's intended difficulty with the layout that was actually built, so a level
      // keeps a consistent label whichever category it draws from.
      const score = Math.round((0.5 * estimateScore(finalParams) + 0.5 * measurePuzzle(placements, size, gen.decoys)) * 10) / 10;
      const puzzle: Puzzle = {
        v: 1,
        id: `${spec.mode}-${hashString(JSON.stringify(spec)).toString(36)}`,
        spec,
        title: meta.title,
        theme: meta.theme,
        categoryId: spec.categoryId,
        topicId: meta.topicId,
        level: spec.level,
        size,
        grid: gen.grid,
        placements,
        clueIds,
        decoys: gen.decoys,
        difficulty: { score, label: difficultyLabel(score) },
        params: finalParams,
        specials: params.specials,
      };
      if (validatePuzzle(puzzle).length === 0) return puzzle;
    }
    wordCount = Math.max(minTargets, wordCount - 1);
    if (round % 3 === 2) size = Math.min(size + 1, 24);
  }
  throw new Error(`generatePuzzle: could not build a valid puzzle for seed "${spec.seed}"`);
}
