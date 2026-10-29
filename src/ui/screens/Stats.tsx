import { activityStrip, categoryProgress, dailyHistory, overview, statsView } from '../../game';
import { useApp } from '../state';
import { duration, n, pct, shortDate } from '../format';
import { Stars } from '../components/Icon';

export function Stats() {
  const { save } = useApp();
  const now = Date.now();
  const s = statsView(save);
  const ov = overview(save, now);
  const strip = activityStrip(save, now, 28);
  const peak = Math.max(1, ...strip.map((d) => d.count));
  const cats = categoryProgress(save);
  const history = dailyHistory(save, 10);
  const byCat = save.stats.byCategory;

  const tiles: Array<[string, string, string?]> = [
    ['Levels completed', n(s.levelsCompleted)],
    ['Puzzles solved', n(s.puzzles)],
    ['Words found', n(s.wordsFound)],
    ['Words discovered', `${n(s.discovered)} / ${n(ov.totalWords)}`],
    ['Words mastered', n(s.mastered), 'Reached the top review box'],
    ['Search accuracy', pct(s.accuracy), 'Right selections out of all selections'],
    ['Quiz accuracy', s.quizAccuracy === null ? '–' : pct(s.quizAccuracy), 'Fact Challenges and Smart Review'],
    ['Time played', duration(s.playMs), s.avgMsPerPuzzle ? `${duration(s.avgMsPerPuzzle)} per puzzle` : undefined],
    ['Bonus words', n(s.bonusFound)],
    ['Hints used', n(s.hints)],
    ['Three-star puzzles', n(s.threeStars)],
    ['Best daily streak', `${n(s.bestStreak)} days`, `Current: ${ov.dailyStreak}`],
    ['Best weekly streak', `${n(s.bestWeekly)} weeks`, `Current: ${ov.weeklyStreak}`],
  ];

  return (
    <div className="stack-lg">
      <header className="page-head">
        <span className="eyebrow">Statistics</span>
        <h1>Your growth</h1>
        <p>Rank {ov.rank.title} · {n(ov.xp)} XP · {n(ov.coins)} coins · {n(ov.stars)} stars. Nothing here rewards speed.</p>
      </header>

      <section className="tiles">
        {tiles.map(([label, value, note]) => (
          <div key={label} className="tile">
            <span className="tile-l">{label}</span>
            <span className="tile-v num">{value}</span>
            {note && <span className="tiny faint">{note}</span>}
          </div>
        ))}
      </section>

      <section className="card">
        <div className="card-title">
          <h2>Last 4 weeks</h2>
          <span className="small muted">Puzzles and reviews per day</span>
        </div>
        <div className="bars" role="img" aria-label={`Activity over the last 28 days: ${strip.reduce((a, d) => a + d.count, 0)} sessions`}>
          {strip.map((d) => (
            <div key={d.key} className="bar-col" title={`${shortDate(d.key)}: ${d.count}`}>
              <span className="bar" style={{ height: `${d.count ? Math.max(8, (d.count / peak) * 100) : 3}%` }} data-on={d.count > 0 || undefined} />
            </div>
          ))}
        </div>
        <div className="row between tiny faint"><span>{shortDate(strip[0].key)}</span><span>Today</span></div>
      </section>

      <section className="card">
        <h2 style={{ marginBottom: 12 }}>Subject mastery</h2>
        <ul className="mastery-list">
          {cats.map((c) => {
            const st = byCat[c.category.id];
            return (
              <li key={c.category.id}>
                <div className="row between">
                  <span><b>{c.category.name}</b> <span className="tag gold">{c.mastery.title}</span></span>
                  <span className="small muted num">{c.mastery.percent}%</span>
                </div>
                <div className="progress"><span style={{ width: `${c.mastery.percent}%` }} /></div>
                <span className="tiny faint">
                  {c.mastery.discovered} of {c.mastery.total} discovered · {c.mastery.mastered} mastered
                  {st && st.quizTotal > 0 ? ` · quiz ${pct(st.quizCorrect / st.quizTotal)}` : ''}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card">
        <h2 style={{ marginBottom: 12 }}>Daily Brain Challenge history</h2>
        {history.length === 0 ? (
          <p className="muted">No daily challenges yet. Today’s is waiting on the home screen.</p>
        ) : (
          <ul className="hist">
            {history.map(({ key, result }) => (
              <li key={key} className="row between">
                <span>{shortDate(key)}</span>
                <Stars value={result.stars} />
                <span className="num">{result.score} pts</span>
                <span className="small muted">quiz {result.quizCorrect}/{result.quizTotal}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
