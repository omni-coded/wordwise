import { memo } from 'react';
import { bonusesOf, targetsOf } from '../../engine';
import type { Puzzle } from '../../engine/types';
import { Icon } from './Icon';

interface Props {
  puzzle: Puzzle;
  found: readonly string[];
  bonusFound: readonly string[];
  hinted: readonly string[];
  onOpen: (entryId: string) => void;
}

/** The words to find. Found words are crossed out (and stay tappable to reread); clue puzzles show definitions. */
function WordListImpl({ puzzle, found, bonusFound, hinted, onOpen }: Props) {
  const targets = targetsOf(puzzle)
    .slice()
    .sort((a, b) => a.display.localeCompare(b.display));
  const bonus = bonusesOf(puzzle);
  const clueSet = new Set(puzzle.clueIds);
  const left = targets.length - found.length;
  return (
    <section className="words" aria-label="Words to find">
      <div className="words-head">
        <h2 className="eyebrow">Find these</h2>
        <span className="small muted num" aria-live="polite">
          {found.length} / {targets.length}
          <span className="sr-only"> found, {left} left</span>
        </span>
      </div>
      <ul className="wlist">
        {targets.map((p) => {
          const isFound = found.includes(p.entryId);
          const isClue = clueSet.has(p.entryId) && !isFound;
          const hinted_ = hinted.includes(p.entryId) && !isFound;
          return (
            <li key={p.entryId} className={`witem${isFound ? ' found' : ''}${isClue ? ' clue' : ''}`}>
              {isFound ? (
                <button className="wbtn" onClick={() => onOpen(p.entryId)} aria-label={`${p.display}, found. Open its card`}>
                  <span className="wcheck"><Icon name="check" size={14} /></span>
                  <span className="wtext">{p.display}</span>
                </button>
              ) : isClue ? (
                <span className="wbtn static">
                  <span className="wtext">
                    <span className="clue-text">{p.clue}</span>
                    <span className="clue-meta tiny faint">
                      {p.word.length} letters{hinted_ ? `, starts with ${p.word[0]}` : ''}
                    </span>
                  </span>
                </span>
              ) : (
                <span className="wbtn static">
                  <span className="wtext">{p.display}</span>
                  {hinted_ && <span className="tiny faint">hinted</span>}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {bonus.length > 0 && (
        <div className="bonus-line small muted">
          <Icon name="sparkle" size={15} />
          <span>
            Hidden bonus {bonus.length === 1 ? 'word' : 'words'}: {bonusFound.length} of {bonus.length} found
          </span>
          {bonusFound.length > 0 && (
            <span className="bonus-found">
              {bonus
                .filter((p) => bonusFound.includes(p.entryId))
                .map((p) => (
                  <button key={p.entryId} className="chip on" onClick={() => onOpen(p.entryId)}>
                    {p.display}
                  </button>
                ))}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

export const WordList = memo(WordListImpl);
