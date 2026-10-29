import { useEffect } from 'react';
import { getEntry } from '../../content';
import { Icon } from './Icon';

export interface LearnItem {
  key: number;
  entryId: string;
  bonus: boolean;
}

/** "Learn after finding": a small card with the meaning of the word you just found. It never blocks the board. */
export function LearnCard({ item, onClose, onMore, ms = 7000 }: { item: LearnItem; onClose: () => void; onMore: (id: string) => void; ms?: number }) {
  const entry = getEntry(item.entryId);
  useEffect(() => {
    const t = window.setTimeout(onClose, ms);
    return () => window.clearTimeout(t);
  }, [item.key, ms, onClose]);
  if (!entry) return null;
  return (
    <aside className="learn" role="status" aria-live="polite" key={item.key}>
      <div className="learn-top">
        <div className="row" style={{ gap: 8 }}>
          <span className={`tag ${item.bonus ? 'good' : 'gold'}`}>{item.bonus ? 'Bonus word' : 'You found'}</span>
          <span className="small faint pron">/{entry.pronunciation}/</span>
        </div>
        <button className="btn ghost icon sm" onClick={onClose} aria-label="Dismiss">
          <Icon name="close" size={16} />
        </button>
      </div>
      <h3>{entry.term}</h3>
      <p>{entry.definition}</p>
      <div className="row more between">
        <button className="btn sm" onClick={() => onMore(entry.id)}>
          Learn more <Icon name="chevron" size={14} />
        </button>
      </div>
      <div className="learn-bar" aria-hidden="true">
        <span style={{ animationDuration: `${ms}ms` }} />
      </div>
    </aside>
  );
}
