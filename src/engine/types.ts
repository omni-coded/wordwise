export interface Cell {
  r: number;
  c: number;
}

export type PuzzleMode = 'campaign' | 'daily' | 'journey' | 'expert' | 'practice';
export type SpecialKind = 'relaxing' | 'milestone' | 'gauntlet' | 'clue' | 'mastery';
export type ClueMode = 'none' | 'partial' | 'full';

/** The only thing the engine needs to know about a vocabulary entry. */
export interface PoolEntry {
  id: string;
  term: string; // display form, may contain spaces / hyphens
  word: string; // A–Z letters only, as hidden in the grid
  difficulty: number; // 1 (familiar) … 5 (specialist)
  topic: string;
  clue: string; // short definition used by clue-mode puzzles
}

export interface DifficultyParams {
  level: number;
  effectiveLevel: number;
  gridSize: number;
  wordCount: number;
  bonusCount: number;
  minLen: number;
  maxLen: number;
  targetLen: number;
  vocabTarget: number;
  backProb: number;
  diagProb: number;
  overlapPref: number;
  decoyRate: number;
  decoyFragments: number;
  maxDensity: number;
  specials: SpecialKind[];
  clueMode: ClueMode;
  xpMultiplier: number;
}

export interface WordSpec {
  entryId: string;
  display: string;
  word: string;
  kind: 'target' | 'bonus';
  difficulty: number;
  clue: string;
}

export interface Placement extends WordSpec {
  r: number; // start cell
  c: number;
  dr: number; // direction step
  dc: number;
}

export interface PuzzleSpec {
  seed: string;
  mode: PuzzleMode;
  level: number;
  categoryId: string;
  topicId?: string;
  /** How strongly to favour words from `topicId` (default 4; journeys use a much stronger pull). */
  topicBoost?: number;
  expert?: boolean;
  mastery?: boolean;
  deprioritize?: string[];
  mustInclude?: string[];
  journeyId?: string;
  journeyStep?: number;
}

export interface DifficultyInfo {
  score: number; // 0–100
  label: string;
}

export interface Puzzle {
  v: 1;
  id: string;
  spec: PuzzleSpec;
  title: string;
  theme: string;
  categoryId: string;
  topicId: string;
  level: number;
  size: number;
  grid: string[]; // rows of A–Z letters
  placements: Placement[];
  clueIds: string[];
  decoys: number;
  difficulty: DifficultyInfo;
  params: DifficultyParams;
  specials: SpecialKind[];
}
