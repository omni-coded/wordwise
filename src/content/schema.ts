/**
 * Content schema. Every vocabulary entry is plain data, so new verified word
 * collections can be added without touching game code (see README → "Adding content").
 */

export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** 'draft' = written, awaiting editorial review. 'verified' = a named reviewer checked it against sources. */
export type ReviewStatus = 'draft' | 'verified';

export interface Entry {
  id: string;
  term: string; // display form (may contain a space or hyphen)
  word: string; // A–Z only; what is hidden in the grid
  category: string;
  topic: string;
  difficulty: Difficulty; // 1 familiar … 5 specialist
  pronunciation: string;
  definition: string;
  example: string; // must contain the term (used for fill-in-the-blank quiz questions)
  fact: string;
  why: string;
  status: ReviewStatus;
  sources?: string[];
  reviewedBy?: string;
}

export interface Topic {
  id: string;
  name: string;
  /** How the terms in this topic connect to each other ("Learn More"). */
  connection: string;
}

export interface Category {
  id: string;
  name: string;
  shortName: string;
  blurb: string;
  glyph: string; // single symbol used in the UI badge
  topics: Topic[];
  entries: Entry[];
  /** Public reference works recommended for verifying this category's entries. */
  references: string[];
}

/** Compact authoring row: term, pronunciation, difficulty, definition, example, fact, why it matters. */
export type Row = [
  term: string,
  pronunciation: string,
  difficulty: number,
  definition: string,
  example: string,
  fact: string,
  why: string,
];

export interface CategoryDef {
  id: string;
  name: string;
  shortName: string;
  blurb: string;
  glyph: string;
  references: string[];
  topics: Array<{ id: string; name: string; connection: string; rows: Row[] }>;
}
