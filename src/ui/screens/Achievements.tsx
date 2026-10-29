import { useState } from 'react';
import { ACHIEVEMENT_GROUPS, achievementStatuses } from '../../game';
import { useApp } from '../state';
import { shortDate } from '../format';

export function Achievements() {
  const { save } = useApp();
  const [only, setOnly] = useState<'all' | 'earned' | 'locked'>('all');
  const all = achievementStatuses(save);
  const earned = all.filter((a) => a.unlockedAt !== undefined).length;
  const dateOf = (t: number) => {
    const d = new Date(t);
    return shortDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };
  return (
    <div className="stack-lg">
      <header className="page-head">
        <span className="eyebrow">Achievements</span>
        <h1>
          {earned} of {all.length} earned
        </h1>
        <p>Badges reward curiosity, consistency and accuracy. None of them depend on how fast you play.</p>
      </header>
      <div className="seg" role="group" aria-label="Show">
        {(['all', 'earned', 'locked'] as const).map((v) => (
          <button key={v} aria-pressed={only === v} onClick={() => setOnly(v)}>
            {v === 'all' ? 'All' : v === 'earned' ? 'Earned' : 'In progress'}
          </button>
        ))}
      </div>
      {ACHIEVEMENT_GROUPS.map((group) => {
        const items = all.filter((a) => a.achievement.group === group).filter((a) => (only === 'all' ? true : only === 'earned' ? a.unlockedAt !== undefined : a.unlockedAt === undefined));
        if (items.length === 0) return null;
        return (
          <section key={group} className="stack">
            <h2>{group}</h2>
            <ul className="badges">
              {items.map(({ achievement: a, value, goal, unlockedAt }) => (
                <li key={a.id} className={`badge ${unlockedAt !== undefined ? 'earned' : ''}`}>
                  <span className="badge-glyph" aria-hidden="true">{a.glyph}</span>
                  <span className="grow">
                    <b>{a.name}</b>
                    <span className="small muted">{a.description}</span>
                    {unlockedAt !== undefined ? (
                      <span className="tiny" style={{ color: 'var(--gold)' }}>Earned {dateOf(unlockedAt)}</span>
                    ) : (
                      <>
                        <span className="progress thin" aria-hidden="true"><span style={{ width: `${(value / goal) * 100}%` }} /></span>
                        <span className="tiny faint num">{Math.floor(value)} / {goal}</span>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
