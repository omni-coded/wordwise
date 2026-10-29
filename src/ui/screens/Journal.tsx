import { useMemo, useState } from 'react';
import { allEntries, getCategories, getEntry } from '../../content';
import { buildQuiz, categoryProgress, journalItems, overview, startReview, toggleFavorite, type JournalFilter, type JournalSort } from '../../game';
import { useApp } from '../state';
import { Icon } from '../components/Icon';
import { DifficultyDots } from '../components/WordCard';
import { QuizView } from '../components/QuizView';

const FILTERS: Array<[JournalFilter, string]> = [
  ['all', 'All'],
  ['favorites', 'Favorites'],
  ['due', 'Due for review'],
  ['learning', 'Learning'],
  ['familiar', 'Familiar'],
  ['mastered', 'Mastered'],
];
const SORTS: Array<[JournalSort, string]> = [
  ['recent', 'Recently found'],
  ['alphabetical', 'A to Z'],
  ['difficulty', 'Hardest first'],
  ['weakest', 'Needs most practice'],
];

/** A short unscored practice quiz over a handful of journal words. Scored reviews live in Smart Review. */
function PracticeQuiz({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const questions = useMemo(
    () =>
      buildQuiz({
        entries: ids.map((id) => getEntry(id)!).filter(Boolean),
        count: Math.min(5, ids.length),
        seed: `wordwise|journal-quiz|${Date.now()}`,
        pool: allEntries(),
      }),
    [ids],
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  return (
    <section className="card accent stack">
      <div className="row between">
        <h3>Quick quiz</h3>
        <button className="btn ghost sm" onClick={onClose}>Close</button>
      </div>
      <p className="small muted">Practice only: answers here do not change your review schedule or XP.</p>
      <QuizView
        questions={questions}
        answers={answers}
        onAnswer={(q, o) => setAnswers((a) => ({ ...a, [q.id]: o }))}
        title="Journal quiz"
        results={
          <div className="stack">
            <p>
              You got <b>{questions.filter((q) => answers[q.id] === q.correctId).length}</b> of {questions.length}.
            </p>
            <button className="btn primary" onClick={onClose}>Done</button>
          </div>
        }
      />
    </section>
  );
}

export function Journal() {
  const { save, update, go, openEntry } = useApp();
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState<JournalFilter>('all');
  const [sort, setSort] = useState<JournalSort>('recent');
  const [quiz, setQuiz] = useState(false);
  const now = Date.now();
  const items = useMemo(() => journalItems(save, { text, categoryId: category || undefined, filter, sort }, now), [save.words, text, category, filter, sort]);
  const ov = overview(save, now);
  const progress = useMemo(() => categoryProgress(save), [save.words]);
  const catName = useMemo(() => new Map(getCategories().map((c) => [c.id, c.shortName])), []);
  const total = Object.keys(save.words).length;
  const quizIds = useMemo(() => items.slice(0, 12).map((i) => i.entry.id), [items]);

  return (
    <div className="stack-lg">
      <header className="page-head">
        <span className="eyebrow">Knowledge Journal</span>
        <h1>Everything you have found</h1>
        <p>
          {total === 0
            ? 'Words you find in puzzles are kept here with their meaning, an example, and why they matter.'
            : `${total} of ${ov.totalWords} words discovered. Search, filter, favorite, and test yourself.`}
        </p>
      </header>

      <section aria-label="Growth by subject" className="growth">
        {progress.map((p) => (
          <button
            key={p.category.id}
            className={`growth-item ${category === p.category.id ? 'on' : ''}`}
            onClick={() => setCategory(category === p.category.id ? '' : p.category.id)}
            aria-pressed={category === p.category.id}
          >
            <span className="growth-glyph" aria-hidden="true">{p.category.glyph}</span>
            <span className="grow">
              <span className="growth-name">{p.category.shortName}</span>
              <span className="progress thin"><span style={{ width: `${p.mastery.percent}%` }} /></span>
              <span className="tiny faint">{p.mastery.discovered}/{p.mastery.total} · {p.mastery.title}</span>
            </span>
          </button>
        ))}
      </section>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" size={18} />
          <input className="input" type="search" placeholder="Search words, meanings, subjects" value={text} onChange={(e) => setText(e.target.value)} aria-label="Search the journal" />
        </div>
        <label className="sr-only" htmlFor="j-sort">Sort</label>
        <select id="j-sort" className="input sort" value={sort} onChange={(e) => setSort(e.target.value as JournalSort)}>
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="chips" role="group" aria-label="Filter">
        {FILTERS.map(([v, l]) => (
          <button key={v} className="chip" aria-pressed={filter === v} onClick={() => setFilter(v)}>
            {l}
            {v === 'due' && ov.due > 0 ? ` (${ov.due})` : ''}
          </button>
        ))}
      </div>

      <div className="row">
        <button className="btn sm" disabled={quizIds.length < 2} onClick={() => setQuiz(true)}>
          <Icon name="target" /> Quiz me on these{quizIds.length ? ` (${Math.min(5, quizIds.length)})` : ''}
        </button>
        <button
          className="btn sm"
          disabled={ov.due === 0}
          onClick={() => {
            update((s, t) => startReview(s, t));
            go('review');
          }}
        >
          <Icon name="repeat" /> Smart Review{ov.due ? ` (${ov.due} due)` : ''}
        </button>
        <span className="small muted">{items.length} shown</span>
      </div>

      {quiz && <PracticeQuiz ids={quizIds} onClose={() => setQuiz(false)} />}

      {items.length === 0 ? (
        <div className="empty">
          <div className="big" aria-hidden="true">✦</div>
          <h3>{total === 0 ? 'Your journal is empty' : 'Nothing matches'}</h3>
          <p>{total === 0 ? 'Play a puzzle and every word you find lands here.' : 'Try a different search or filter.'}</p>
          {total === 0 && <button className="btn primary" onClick={() => go('home')}>Find your first words</button>}
        </div>
      ) : (
        <ul className="jlist">
          {items.slice(0, 200).map((it) => (
            <li key={it.entry.id}>
              <div className="jitem">
                <button className="jmain" onClick={() => openEntry(it.entry.id)} aria-label={`Open card for ${it.entry.term}`}>
                  <div className="row" style={{ gap: 8 }}>
                    <b className="jterm">{it.entry.term}</b>
                    <span className={`tag ${it.state === 'mastered' ? 'good' : it.state === 'new' || it.state === 'learning' ? '' : 'gold'}`}>{it.state}</span>
                    {it.due && <span className="tag bad-tag">due</span>}
                  </div>
                  <span className="small muted jdef">{it.entry.definition}</span>
                  <span className="row tiny faint" style={{ gap: 10 }}>
                    <span>{catName.get(it.entry.category)}</span>
                    <DifficultyDots value={it.entry.difficulty} />
                  </span>
                </button>
                <button
                  className={`btn icon sm ${it.favorite ? 'primary' : 'ghost'}`}
                  aria-pressed={it.favorite}
                  aria-label={it.favorite ? `Remove ${it.entry.term} from favorites` : `Add ${it.entry.term} to favorites`}
                  onClick={() => update((s, t) => toggleFavorite(s, it.entry.id, t))}
                >
                  <Icon name="heart" filled={it.favorite} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {items.length > 200 && <p className="small muted center">Showing the first 200. Narrow the search to see more.</p>}
    </div>
  );
}
