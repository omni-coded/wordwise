import { useState } from 'react';
import { allJourneyStatuses, hasActiveGame } from '../../game';
import { getCategory } from '../../content';
import { MASTERY_PASS_RATIO, MASTERY_QUESTIONS } from '../../content/journeys';
import { useApp } from '../state';
import { Icon, Stars } from '../components/Icon';

export function Journeys() {
  const { save, startJourney, busy } = useApp();
  const statuses = allJourneyStatuses(save);
  const [open, setOpen] = useState<string>(() => statuses.find((s) => !s.mastered)?.journey.id ?? statuses[0].journey.id);
  const active = hasActiveGame(save);

  return (
    <div className="stack-lg">
      <header className="page-head">
        <span className="eyebrow">Themed Journeys</span>
        <h1>Go deep on one subject</h1>
        <p>
          Eight stepping-stone puzzles through a single field, each leaning on that field’s vocabulary, then a mastery challenge: a demanding grid plus {MASTERY_QUESTIONS} questions
          (pass with {Math.round(MASTERY_PASS_RATIO * 100)}%).
        </p>
      </header>
      {active && <div className="banner"><span>You have a puzzle in progress. Starting a journey step will replace it.</span></div>}

      <div className="stack">
        {statuses.map((j) => {
          const isOpen = open === j.journey.id;
          const cat = getCategory(j.journey.categoryId);
          return (
            <section key={j.journey.id} className={`card journey ${isOpen ? 'open' : ''}`}>
              <button className="journey-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? '' : j.journey.id)}>
                <span className="growth-glyph" aria-hidden="true">{cat?.glyph}</span>
                <span className="grow">
                  <span className="row" style={{ gap: 8 }}>
                    <h2>{j.journey.name}</h2>
                    {j.mastered && <span className="tag gold">Mastered</span>}
                  </span>
                  <span className="small muted">{j.journey.tagline}</span>
                  <span className="progress thin" aria-hidden="true">
                    <span style={{ width: `${((j.completedSteps + (j.mastered ? 1 : 0)) / (j.journey.steps.length + 1)) * 100}%` }} />
                  </span>
                </span>
                <span className="small muted num">{j.completedSteps}/{j.journey.steps.length}</span>
                <Icon name="chevron" />
              </button>
              {isOpen && (
                <ol className="steps">
                  {j.journey.steps.map((st, i) => {
                    const done = i < j.completedSteps;
                    const current = i === j.completedSteps;
                    const locked = i > j.completedSteps;
                    return (
                      <li key={st.title} className={`step ${done ? 'done' : ''} ${current ? 'current' : ''} ${locked ? 'locked' : ''}`}>
                        <span className="step-n" aria-hidden="true">{done ? <Icon name="check" size={16} /> : locked ? <Icon name="lock" size={14} /> : i + 1}</span>
                        <span className="grow">
                          <b>{st.title}</b>
                          <span className="small muted">{st.blurb}</span>
                        </span>
                        {done && <Stars value={j.progress.stars[i] ?? 1} />}
                        <button className={`btn sm ${current ? 'primary' : ''}`} disabled={locked || busy} onClick={() => startJourney(j.journey, i)}>
                          {done ? 'Replay' : current ? 'Start' : 'Locked'}
                        </button>
                      </li>
                    );
                  })}
                  <li className={`step mastery ${j.masteryUnlocked ? 'current' : 'locked'} ${j.mastered ? 'done' : ''}`}>
                    <span className="step-n" aria-hidden="true">{j.mastered ? <Icon name="check" size={16} /> : j.masteryUnlocked ? <Icon name="target" size={16} /> : <Icon name="lock" size={14} />}</span>
                    <span className="grow">
                      <b>{j.journey.mastery.title}</b>
                      <span className="small muted">{j.journey.mastery.blurb}</span>
                      {j.progress.masteryAttempts > 0 && !j.mastered && <span className="tiny faint">Attempts so far: {j.progress.masteryAttempts}</span>}
                    </span>
                    <button className={`btn sm ${j.masteryUnlocked && !j.mastered ? 'primary' : ''}`} disabled={!j.masteryUnlocked || busy} onClick={() => startJourney(j.journey, 'mastery')}>
                      {j.mastered ? 'Retake' : j.masteryUnlocked ? 'Begin' : 'Locked'}
                    </button>
                  </li>
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
