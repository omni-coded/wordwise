import type { Entry } from '../../content/schema';
import { getCategory, getEntry, getTopic } from '../../content';
import { toggleFavorite, wordState } from '../../game';
import { useApp } from '../state';
import { Icon } from './Icon';
import { Modal } from './Modal';

const LEVELS = ['Familiar', 'Everyday', 'Intermediate', 'Advanced', 'Specialist'];

export function DifficultyDots({ value }: { value: number }) {
  return (
    <span className="dots" role="img" aria-label={`Difficulty ${value} of 5: ${LEVELS[value - 1] ?? ''}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= value ? 'on' : ''} />
      ))}
    </span>
  );
}

/** Highlights the term inside its example sentence. */
function Example({ text, term }: { text: string; term: string }) {
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + term.length)}</mark>
      {text.slice(i + term.length)}
    </>
  );
}

export function WordCard({ entry, full = true }: { entry: Entry; full?: boolean }) {
  const { save, update } = useApp();
  const rec = save.words[entry.id];
  const cat = getCategory(entry.category);
  const topic = getTopic(entry.category, entry.topic);
  const state = rec ? wordState(rec) : 'new';
  return (
    <article className="wcard">
      <header className="wcard-head">
        <div className="grow">
          <div className="row" style={{ gap: 8 }}>
            <span className="tag gold">{cat?.shortName ?? entry.category}</span>
            {topic && <span className="tag">{topic.name}</span>}
            {rec && <span className={`tag ${state === 'mastered' ? 'good' : ''}`}>{state}</span>}
          </div>
          <h3 className="wcard-term">{entry.term}</h3>
          <div className="row small muted" style={{ gap: 12 }}>
            <span className="pron">/{entry.pronunciation}/</span>
            <DifficultyDots value={entry.difficulty} />
          </div>
        </div>
        {rec && (
          <button
            className={`btn icon sm ${rec.favorite ? 'primary' : ''}`}
            aria-pressed={rec.favorite}
            aria-label={rec.favorite ? `Remove ${entry.term} from favorites` : `Add ${entry.term} to favorites`}
            onClick={() => update((s, now) => toggleFavorite(s, entry.id, now))}
          >
            <Icon name="heart" filled={rec.favorite} />
          </button>
        )}
      </header>
      <p className="wcard-def">{entry.definition}</p>
      <blockquote className="wcard-ex">
        <Example text={entry.example} term={entry.term} />
      </blockquote>
      {full && (
        <>
          <section className="wcard-sec">
            <h4>Did you know?</h4>
            <p>{entry.fact}</p>
          </section>
          <section className="wcard-sec">
            <h4>Why it matters</h4>
            <p>{entry.why}</p>
          </section>
          {topic && (
            <section className="wcard-sec">
              <h4>How it connects</h4>
              <p>{topic.connection}</p>
            </section>
          )}
          <footer className="wcard-foot tiny faint">
            {entry.status === 'verified'
              ? `Verified${entry.reviewedBy ? ` by ${entry.reviewedBy}` : ''}.`
              : 'Draft entry: written for clarity, not yet independently fact-checked. Verify before relying on it.'}
          </footer>
        </>
      )}
    </article>
  );
}

/** The full card in a dialog; opened from anywhere with `openEntry(id)`. */
export function EntryDialog() {
  const { openEntryId, openEntry } = useApp();
  if (!openEntryId) return null;
  return <EntryDialogInner id={openEntryId} onClose={() => openEntry(null)} />;
}


function EntryDialogInner({ id, onClose }: { id: string; onClose: () => void }) {
  const entry = getEntry(id);
  if (!entry) return null;
  return (
    <Modal title={<span className="sr-only">Word details</span>} onClose={onClose} label={`${entry.term}: word details`}>
      <WordCard entry={entry} />
    </Modal>
  );
}
