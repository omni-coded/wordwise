import {
  allJourneyStatuses,
  campaignPlan,
  dailyCategory,
  dateKey,
  dayNumber,
  dailyLevel,
  hasActiveGame,
  meetWord,
  overview,
  startReview,
  wordOfTheDay,
} from '../../game';
import { getCategory } from '../../content';
import { difficultyLabel, estimateScore, paramsForLevel } from '../../engine';
import { useApp } from '../state';
import { longDate, n, plural } from '../format';
import { Icon, Stars } from '../components/Icon';
import { DifficultyDots } from '../components/WordCard';

export function Home() {
  const app = useApp();
  const { save, go, update, startCampaign, startDaily, startExpert, openEntry, busy, persistent, saveFailed, loadStatus } = app;
  const now = Date.now();
  const key = dateKey(new Date(now));
  const ov = overview(save, now);
  const active = hasActiveGame(save) ? save.game : null;
  const plan = campaignPlan(save.campaign.level, { enabled: save.settings.enabledCategories, words: save.words, today: dayNumber(key), level: save.campaign.level });
  const planCat = getCategory(plan.spec.categoryId);
  const params = paramsForLevel(save.campaign.level);
  const label = difficultyLabel(estimateScore(params));
  const daily = save.daily[key];
  const dailyCat = getCategory(dailyCategory(key));
  const wotd = wordOfTheDay(key);
  const met = !!save.words[wotd.id];
  const journeys = allJourneyStatuses(save);
  const unfinished = save.summary;

  return (
    <div className="stack-lg">
      {loadStatus === 'restored-backup' && (
        <div className="banner"><Icon name="restart" /><span>Your latest save could not be read, so the most recent backup was restored.</span></div>
      )}
      {loadStatus === 'reset-corrupt' && (
        <div className="banner bad"><span>Your saved data could not be read and was set aside. A fresh journal was started; Settings can export the old data if it is recoverable.</span></div>
      )}
      {loadStatus === 'newer-version' && (
        <div className="banner bad"><span>This save was made by a newer version of WordWise. It has been kept untouched; you are playing a fresh journal for now.</span></div>
      )}
      {!persistent && (
        <div className="banner bad"><span>Browser storage is unavailable here (private mode or blocked), so progress will be lost when you close this tab. Export your data from Settings to keep it.</span></div>
      )}
      {saveFailed && persistent && (
        <div className="banner bad"><span>Your progress could not be saved: storage may be full. Export your data from Settings before closing.</span></div>
      )}

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">{ov.rank.title} · {n(ov.xp)} XP</span>
          <h1>Find words.<br /><em>Expand your world.</em></h1>
          <div className="rank-bar" aria-label={`${Math.round(ov.rank.progress * 100)}% of the way to the next rank`}>
            <div className="progress thin"><span style={{ width: `${Math.max(2, ov.rank.progress * 100)}%` }} /></div>
            <span className="tiny faint">{n(ov.rank.next - ov.xp)} XP to the next rank</span>
          </div>
        </div>
        <div className="hero-stats">
          <span className={`pill ${ov.streakStatus === 'at-risk' ? 'bad' : ov.dailyStreak > 0 ? 'gold' : ''}`}>
            <Icon name="flame" size={15} /> <b>{ov.dailyStreak}</b> day streak
          </span>
          <span className="pill">
            <Icon name="flag" size={15} /> <b>{ov.weeklyStreak}</b> week streak · {ov.weekDaysActive}/{ov.weekDaysNeeded} days
          </span>
          <span className="pill"><Icon name="book" size={15} /> <b>{ov.discovered}</b> of {ov.totalWords} words</span>
        </div>
      </section>

      {unfinished && (
        <button className="card accent click" onClick={() => go('summary')}>
          <div className="row between">
            <div>
              <span className="eyebrow">Unfinished</span>
              <h3>Your learning summary is waiting</h3>
              <p className="small muted">{unfinished.title}: review what you found and take the Fact Challenge.</p>
            </div>
            <Icon name="chevron" />
          </div>
        </button>
      )}

      <section className="grid-2">
        <div className="card accent play-card">
          {active ? (
            <>
              <span className="eyebrow">In progress</span>
              <h2>{active.puzzle.title}</h2>
              <p className="muted">
                {active.puzzle.theme} · {active.state.found.length} of {active.puzzle.placements.filter((p) => p.kind === 'target').length} words found
              </p>
              <div className="row">
                <button className="btn primary lg" onClick={() => { app.resume(); go('play'); }}>
                  <Icon name="play" /> Continue
                </button>
                <button className="btn" onClick={() => { app.quit(); }}>Abandon</button>
              </div>
            </>
          ) : (
            <>
              <span className="eyebrow">Level {save.campaign.level}</span>
              <h2>{plan.meta.title}</h2>
              <p className="muted">
                {planCat?.name} · {label} · {params.wordCount - params.bonusCount} words on a {params.gridSize}×{params.gridSize} grid
              </p>
              <div className="row">
                <button className="btn primary lg" onClick={startCampaign} disabled={busy}>
                  {busy ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <Icon name="play" />} Play level {save.campaign.level}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <span className="eyebrow">Daily Brain Challenge</span>
            <span className="tiny faint">{longDate(key)}</span>
          </div>
          <h3>{dailyCat?.name}</h3>
          <p className="small muted">Same puzzle for everyone today · difficulty level {dailyLevel(key)} · 5-question Fact Challenge</p>
          {daily ? (
            <div className="row between" style={{ marginTop: 12 }}>
              <div>
                <Stars value={daily.stars} />
                <div className="small muted">Score <b className="num">{daily.score}</b> · quiz {daily.quizCorrect}/{daily.quizTotal}</div>
              </div>
              <button className="btn sm" onClick={() => go('stats')}>History</button>
            </div>
          ) : (
            <div style={{ marginTop: 12 }}>
              <button className="btn primary" onClick={startDaily} disabled={busy}>Play today’s challenge</button>
            </div>
          )}
        </div>
      </section>

      <section className="grid-2">
        <div className="card">
          <div className="card-title">
            <span className="eyebrow">Word of the Day</span>
            <DifficultyDots value={wotd.difficulty} />
          </div>
          <button className="linklike" onClick={() => openEntry(wotd.id)} aria-label={`Open the card for ${wotd.term}`}>
            <h3 className="wotd-term">{wotd.term}</h3>
          </button>
          <p className="small muted pron">/{wotd.pronunciation}/</p>
          <p style={{ marginTop: 6 }}>{wotd.definition}</p>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn sm" onClick={() => openEntry(wotd.id)}>Read the full card</button>
            {met ? (
              <span className="tag good">In your journal</span>
            ) : (
              <button className="btn sm" onClick={() => update((s, t) => meetWord(s, wotd.id, t))}>
                <Icon name="plus" size={14} /> Add to journal
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <span className="eyebrow">Smart Review</span>
            <span className={`pill ${ov.due ? 'gold' : ''}`}>{ov.due ? `${plural(ov.due, 'word')} due` : 'All caught up'}</span>
          </div>
          <p className="muted">
            {ov.due
              ? 'Words you have met come back at growing intervals, so they move from “seen” to “known”.'
              : ov.discovered
                ? 'Nothing is due right now. Words return for review on a schedule that grows as you remember them.'
                : 'Find a few words first. Each one joins your review schedule automatically.'}
          </p>
          <div className="row" style={{ marginTop: 12 }}>
            <button
              className="btn primary"
              disabled={!ov.due}
              onClick={() => {
                update((s, t) => startReview(s, t));
                go('review');
              }}
            >
              <Icon name="repeat" /> Start review
            </button>
            <button className="btn" onClick={() => go('journal')}>Open journal</button>
          </div>
        </div>
      </section>

      <section className="stack">
        <div className="row between">
          <h2>Themed Journeys</h2>
          <button className="btn ghost sm" onClick={() => go('journeys')}>See all <Icon name="chevron" size={14} /></button>
        </div>
        <div className="grid-3">
          {journeys.map((j) => (
            <button key={j.journey.id} className="card click journey-mini" onClick={() => go('journeys')}>
              <div className="row between">
                <h3>{j.journey.name}</h3>
                {j.mastered && <span className="tag gold">Mastered</span>}
              </div>
              <p className="small muted">{j.journey.tagline}</p>
              <div className="progress thin"><span style={{ width: `${(j.completedSteps / j.journey.steps.length) * 100}%` }} /></div>
              <span className="tiny faint">
                {j.allStepsDone ? (j.mastered ? 'Mastery passed' : 'Mastery challenge ready') : `Step ${j.completedSteps + 1} of ${j.journey.steps.length}`}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid-3">
        <button className="card click" onClick={startExpert} disabled={busy}>
          <span className="eyebrow">Expert Challenge</span>
          <h3>A harder, larger grid</h3>
          <p className="small muted">{save.settings.expertTimed ? 'Against a generous clock.' : 'Untimed.'} Built from words you have not mastered.</p>
        </button>
        <button className="card click" onClick={() => go('practice')}>
          <span className="eyebrow">Free practice</span>
          <h3>Choose your subject</h3>
          <p className="small muted">Pick a category and topic. Practice earns reduced XP and never changes your level.</p>
        </button>
        <button className="card click" onClick={() => app.set({ focusMode: !save.settings.focusMode })} aria-pressed={save.settings.focusMode}>
          <span className="eyebrow">Focus Mode</span>
          <h3>{save.settings.focusMode ? 'On: distraction-free' : 'Off'}</h3>
          <p className="small muted">Hides the timer, pop-up cards and score chrome so only the grid and word list remain.</p>
        </button>
      </section>
    </div>
  );
}
