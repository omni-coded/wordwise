import { useState } from 'react';
import { getCategories, getCategory } from '../../content';
import { categoryProgress, hasActiveGame } from '../../game';
import { useApp } from '../state';
import { Icon } from '../components/Icon';

const LEVELS: Array<[string, number | 'mine', string]> = [
  ['Gentle', 3, 'Small grid, familiar words, mostly forward'],
  ['Medium', 8, 'The standard starting experience'],
  ['Hard', 24, 'Bigger grid, longer words, more backward and diagonal'],
  ['Expert', 55, 'Dense, tricky, specialist vocabulary'],
  ['My level', 'mine', 'Matches your current campaign level'],
];

export function Practice() {
  const { save, startPractice, busy } = useApp();
  const [cat, setCat] = useState(getCategories()[0].id);
  const [topic, setTopic] = useState('');
  const [lvl, setLvl] = useState(1);
  const progress = categoryProgress(save);
  const chosen = getCategory(cat);
  const [name, value, blurb] = LEVELS[lvl];
  const level = value === 'mine' ? save.campaign.level : value;

  return (
    <div className="stack-lg">
      <header className="page-head">
        <span className="eyebrow">Free practice</span>
        <h1>Choose your subject</h1>
        <p>Practice never changes your campaign level and earns 60% XP, but every word you find still joins your journal and review schedule.</p>
      </header>
      {hasActiveGame(save) && <div className="banner"><span>You have a puzzle in progress. Starting practice will replace it.</span></div>}

      <section className="stack" aria-label="Subject">
        <h2>Subject</h2>
        <div className="grid-3">
          {progress.map((p) => (
            <button
              key={p.category.id}
              className={`card click pick ${cat === p.category.id ? 'on' : ''}`}
              aria-pressed={cat === p.category.id}
              onClick={() => {
                setCat(p.category.id);
                setTopic('');
              }}
            >
              <div className="row" style={{ gap: 10 }}>
                <span className="growth-glyph" aria-hidden="true">{p.category.glyph}</span>
                <div className="grow">
                  <b>{p.category.name}</b>
                  <div className="tiny faint">{p.mastery.discovered}/{p.mastery.total} discovered</div>
                </div>
              </div>
              <p className="small muted">{p.category.blurb}</p>
            </button>
          ))}
        </div>
      </section>

      {chosen && (
        <section className="stack" aria-label="Topic">
          <h2>Topic</h2>
          <div className="chips">
            <button className="chip" aria-pressed={topic === ''} onClick={() => setTopic('')}>Whole subject</button>
            {chosen.topics.map((t) => (
              <button key={t.id} className="chip" aria-pressed={topic === t.id} onClick={() => setTopic(t.id)}>{t.name}</button>
            ))}
          </div>
          {topic && <p className="small muted">{chosen.topics.find((t) => t.id === topic)?.connection}</p>}
        </section>
      )}

      <section className="stack" aria-label="Difficulty">
        <h2>Difficulty</h2>
        <div className="seg" role="group" aria-label="Difficulty">
          {LEVELS.map(([label], i) => (
            <button key={label} aria-pressed={lvl === i} onClick={() => setLvl(i)}>{label}</button>
          ))}
        </div>
        <p className="small muted">{name}: {blurb}.</p>
      </section>

      <div>
        <button className="btn primary lg" disabled={busy} onClick={() => startPractice({ categoryId: cat, topicId: topic || undefined, level })}>
          <Icon name="play" /> Start practice
        </button>
      </div>
    </div>
  );
}
