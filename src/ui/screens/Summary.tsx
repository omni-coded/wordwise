import { useCallback, useState } from 'react';
import { getCategory, getEntry } from '../../content';
import { getJourney } from '../../content/journeys';
import {
  GRID_THEMES,
  HIGHLIGHT_STYLES,
  MASTERY_PASS_COINS,
  MASTERY_PASS_XP,
  answerSummaryQuestion,
  dismissSummary,
  journeyStatus,
  knowledgePoints,
  quizRewards,
  rankTitle,
  retryMastery,
  type Question,
  type Summary as SummaryData,
} from '../../game';
import { useApp } from '../state';
import { duration, modeLabel, n, pct } from '../format';
import { Icon, Stars } from '../components/Icon';
import { Modal } from '../components/Modal';
import { QuizView } from '../components/QuizView';
import { WordCard } from '../components/WordCard';

function QuizResults({ sum }: { sum: SummaryData }) {
  const quiz = sum.quiz!;
  const total = quiz.questions.length;
  const r = quizRewards(quiz.correct, total);
  const mastery = quiz.kind === 'mastery';
  return (
    <section className="card accent quiz-results" aria-label="Fact Challenge results">
      <span className="eyebrow">{mastery ? 'Mastery challenge' : 'Fact Challenge'} · results</span>
      <h2>
        {quiz.correct} of {total} correct
      </h2>
      {mastery ? (
        sum.masteryResult === 'pass' ? (
          <p className="muted">
            Mastery achieved. <b>+{MASTERY_PASS_XP} XP</b>, <b>+{MASTERY_PASS_COINS} coins</b> and three stars for the journey.
          </p>
        ) : (
          <p className="muted">You need at least 70% to pass. The questions are drawn from the whole subject, so reviewing your journal first will help.</p>
        )
      ) : (
        <p className="muted">
          <b>{knowledgePoints(quiz.correct)}</b> knowledge points · <b>+{r.xp} XP</b> · <b>+{r.coins}</b> {r.coins === 1 ? 'coin' : 'coins'}
          {quiz.correct === total && total >= 3 ? ' · perfect round bonus included' : ''}
        </p>
      )}
    </section>
  );
}

export function Summary() {
  const app = useApp();
  const { save, update, go, sound, buzz, set, openEntry } = app;
  const sum = save.summary;
  const [skip, setSkip] = useState<null | (() => void)>(null);

  const answer = useCallback(
    (q: Question, optionId: string) => {
      const res: { finished: boolean; correct: boolean | null } = { finished: false, correct: null };
      update((s, now) => {
        const out = answerSummaryQuestion(s, q.id, optionId, now);
        res.finished = out.finished;
        res.correct = out.correct;
        return out.save;
      });
      if (res.correct === null) return;
      sound(res.correct ? 'correct' : 'wrong');
      buzz(res.correct ? 12 : 30);
      if (res.finished) window.setTimeout(() => sound('star'), 350);
    },
    [update, sound, buzz],
  );

  if (!sum) return null;
  const quiz = sum.quiz;
  const quizOpen = !!quiz && !quiz.done;
  const category = getCategory(sum.categoryId);
  const timeout = sum.outcome === 'timeout';
  const journey = sum.journeyId ? getJourney(sum.journeyId) : undefined;
  const jStatus = journey ? journeyStatus(save, journey) : null;
  const rankUp = sum.rankAfter > sum.rankBefore;
  const unlocked = sum.unlocked
    .map((id) => {
      const grid = GRID_THEMES.find((u) => u.id === id);
      if (grid) return { kind: 'grid' as const, ...grid };
      const hl = HIGHLIGHT_STYLES.find((u) => u.id === id);
      return hl ? { kind: 'highlight' as const, ...hl } : null;
    })
    .filter((u): u is NonNullable<typeof u> => u !== null);

  const leave = (then: () => void) => {
    const run = () => {
      update((s, now) => dismissSummary(s, now));
      then();
    };
    if (quizOpen) setSkip(() => run);
    else run();
  };

  // what to offer next
  let next: { label: string; run: () => void } | null = null;
  if (sum.mode === 'campaign') {
    next = timeout ? { label: 'Try this level again', run: app.startCampaign } : { label: `Play level ${save.campaign.level}`, run: app.startCampaign };
  } else if (sum.mode === 'journey' && journey && jStatus) {
    if (sum.mastery && sum.masteryResult === 'fail') next = null;
    else if (jStatus.completedSteps < journey.steps.length) {
      const i = timeout ? (sum.journeyStep ?? 0) : jStatus.completedSteps;
      next = { label: `${timeout ? 'Retry' : 'Next'}: ${journey.steps[Math.min(i, journey.steps.length - 1)].title}`, run: () => app.startJourney(journey, Math.min(i, journey.steps.length - 1)) };
    } else if (!jStatus.mastered) {
      next = { label: 'Take the mastery challenge', run: () => app.startJourney(journey, 'mastery') };
    }
  } else if (sum.mode === 'expert') {
    next = { label: 'Another expert challenge', run: app.startExpert };
  } else if (sum.mode === 'practice') {
    next = { label: 'Practice again', run: () => app.startPractice({ categoryId: sum.categoryId, topicId: sum.topicId || undefined }) };
  }

  return (
    <div className="stack-lg summary">
      <header className="sum-hero">
        <span className="eyebrow">
          {modeLabel(sum.mode, sum.level)}
          {sum.dailyKey ? ` · ${sum.dailyKey}` : ''}
        </span>
        <h1>{timeout ? 'Time ran out' : sum.mastery ? (sum.masteryResult === 'pass' ? 'Mastery achieved' : 'Puzzle complete') : 'Puzzle complete'}</h1>
        <p className="muted">
          {sum.title} · {category?.name ?? sum.theme}
        </p>
        {!timeout && (
          <div className="sum-stars" aria-live="polite">
            <Stars value={sum.stars} large />
            {quizOpen && sum.stars < 3 && <p className="small muted">Answer the Fact Challenge well to earn a third star.</p>}
          </div>
        )}
        {timeout && <p className="muted">What you found still counts as learned. There are no stars or level progress for a timed-out challenge.</p>}
      </header>

      <section className="sum-numbers" aria-label="Results">
        <div className="stat"><span className="stat-n num">+{n(sum.xpTotal)}</span><span className="stat-l">XP</span></div>
        <div className="stat"><span className="stat-n num">+{n(sum.coins)}</span><span className="stat-l">coins</span></div>
        <div className="stat"><span className="stat-n num">{pct(sum.accuracy)}</span><span className="stat-l">accuracy</span></div>
        <div className="stat"><span className="stat-n num">{duration(sum.elapsedMs)}</span><span className="stat-l">time</span></div>
        {sum.dailyScore !== undefined && <div className="stat"><span className="stat-n num">{sum.dailyScore}</span><span className="stat-l">daily score</span></div>}
        <div className="stat"><span className="stat-n num">{sum.streak}</span><span className="stat-l">day streak</span></div>
      </section>

      {(rankUp || unlocked.length > 0) && (
        <section className="card accent unlock-card">
          {rankUp && (
            <div>
              <span className="eyebrow">New rank</span>
              <h2>{rankTitle(sum.rankAfter)}</h2>
            </div>
          )}
          {unlocked.map((u) => (
            <div key={u.id} className="row between">
              <div>
                <b>{u.name}</b> <span className="muted small">{u.kind === 'grid' ? 'grid theme' : 'highlight style'} unlocked. {u.blurb}</span>
              </div>
              <button className="btn sm" onClick={() => set(u.kind === 'grid' ? { gridTheme: u.id } : { highlightStyle: u.id })}>Use it</button>
            </div>
          ))}
        </section>
      )}

      {sum.xp && (
        <details className="card flat">
          <summary>How your XP was earned</summary>
          <ul className="xp-list">
            <li><span>Finding the words</span><b className="num">+{sum.xp.base}</b></li>
            {sum.xp.bonusWords > 0 && <li><span>Hidden bonus words</span><b className="num">+{sum.xp.bonusWords}</b></li>}
            {sum.xp.precision > 0 && <li><span>Precision (few wrong selections, few hints)</span><b className="num">+{sum.xp.precision}</b></li>}
            {sum.xp.unassisted > 0 && <li><span>No hints used</span><b className="num">+{sum.xp.unassisted}</b></li>}
            {sum.xp.discovery > 0 && <li><span>New words discovered</span><b className="num">+{sum.xp.discovery}</b></li>}
          </ul>
          <p className="tiny faint">Speed never earns XP. Take the time to read the cards.</p>
        </details>
      )}

      {quiz && (
        <QuizView
          key={quiz.attempt}
          questions={quiz.questions}
          answers={quiz.answers}
          onAnswer={answer}
          title={quiz.kind === 'mastery' ? 'Mastery challenge' : sum.dailyKey ? 'Daily quiz' : 'Fact Challenge'}
          results={
            <div className="stack">
              <QuizResults sum={sum} />
              {sum.masteryResult === 'fail' && (
                <button className="btn primary" onClick={() => update((s, now) => retryMastery(s, now))}>
                  <Icon name="restart" /> Try the questions again
                </button>
              )}
            </div>
          }
        />
      )}

      <section className="stack">
        <div className="row between">
          <h2>What you learned</h2>
          <span className="small muted">
            {sum.words.length} {sum.words.length === 1 ? 'word' : 'words'}
            {sum.words.some((w) => w.isNew) ? ` · ${sum.words.filter((w) => w.isNew).length} new` : ''}
          </span>
        </div>
        <ul className="learned">
          {sum.words.map((w) => {
            const e = getEntry(w.entryId);
            if (!e) return null;
            return (
              <li key={w.entryId}>
                <details className="learned-item">
                  <summary>
                    <span className="learned-term">{e.term}</span>
                    {w.isNew && <span className="tag gold">new</span>}
                    {w.bonus && <span className="tag good">bonus</span>}
                    <span className="learned-def small muted">{e.definition}</span>
                  </summary>
                  <div className="learned-body">
                    <WordCard entry={e} />
                    <button className="btn sm" onClick={() => openEntry(e.id)}>Open in a window</button>
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="sum-actions">
        {next && (
          <button className="btn primary lg" onClick={() => leave(next!.run)}>
            {next.label} <Icon name="chevron" size={18} />
          </button>
        )}
        <button className="btn" onClick={() => leave(() => go('journal'))}>
          <Icon name="book" /> Journal
        </button>
        <button className="btn" onClick={() => leave(() => go('home'))}>
          <Icon name="home" /> Home
        </button>
      </div>

      {skip && (
        <Modal
          title="Skip the Fact Challenge?"
          onClose={() => setSkip(null)}
          actions={
            <>
              <button className="btn" onClick={() => setSkip(null)}>Stay and answer</button>
              <button
                className="btn danger"
                onClick={() => {
                  const run = skip;
                  setSkip(null);
                  run();
                }}
              >
                Skip it
              </button>
            </>
          }
        >
          <p className="muted">Answering locks in your third star and earns XP and coins. The words are already saved to your journal either way.</p>
        </Modal>
      )}
    </div>
  );
}
