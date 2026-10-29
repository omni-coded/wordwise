import { useCallback } from 'react';
import { getEntry } from '../../content';
import { answerReviewQuestion, closeReview, dateKey, dayNumber, dueCount, startReview, type Question } from '../../game';
import { useApp } from '../state';
import { Icon } from '../components/Icon';
import { QuizView } from '../components/QuizView';

/** Smart Review: a short quiz over the words that are due. Right answers push a word further out; wrong ones bring it back. */
export function Review() {
  const { save, update, go, sound, buzz, openEntry, startReviewPuzzle, busy } = useApp();
  const rev = save.review;

  const answer = useCallback(
    (q: Question, optionId: string) => {
      const res: { finished: boolean; correct: boolean | null } = { finished: false, correct: null };
      update((s, now) => {
        const out = answerReviewQuestion(s, q.id, optionId, now);
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

  if (!rev) return null;
  const missed = rev.questions.filter((q) => rev.answers[q.id] !== undefined && rev.answers[q.id] !== q.correctId);
  const stillDue = dueCount(save.words, dayNumber(dateKey(new Date())));

  return (
    <div className="stack-lg narrow-col">
      <header className="page-head">
        <span className="eyebrow">Smart Review</span>
        <h1>Bring them back</h1>
        <p>Answer from memory. Each right answer moves a word to a longer interval; a miss brings it back sooner.</p>
      </header>
      <QuizView
        questions={rev.questions}
        answers={rev.answers}
        onAnswer={answer}
        title="Smart Review"
        results={
          <div className="stack">
            <section className="card accent quiz-results">
              <span className="eyebrow">Review complete</span>
              <h2>
                {rev.correct} of {rev.questions.length} remembered
              </h2>
              <p className="muted">
                <b>+{rev.xp} XP</b> · <b>+{rev.coins}</b> {rev.coins === 1 ? 'coin' : 'coins'}
              </p>
            </section>
            {missed.length > 0 && (
              <section className="card">
                <h3>Worth another look</h3>
                <ul className="stack-sm missed" style={{ marginTop: 10 }}>
                  {missed.map((q) => {
                    const e = getEntry(q.entryId);
                    return e ? (
                      <li key={q.id}>
                        <span className="grow">
                          <b>{e.term}</b> <span className="muted small">{e.definition}</span>
                        </span>
                        <button className="btn sm" onClick={() => openEntry(e.id)}>Open card</button>
                      </li>
                    ) : null;
                  })}
                </ul>
              </section>
            )}
            <div className="sum-actions">
              {stillDue > 0 && (
                <button
                  className="btn primary"
                  onClick={() => {
                    update((s, now) => startReview(closeReview(s, now), now));
                  }}
                >
                  <Icon name="repeat" /> Review {stillDue} more
                </button>
              )}
              <button className="btn" onClick={() => startReviewPuzzle()} disabled={busy}>
                <Icon name="play" /> Play a review puzzle
              </button>
              <button
                className="btn"
                onClick={() => {
                  update((s, now) => closeReview(s, now));
                  go('home');
                }}
              >
                <Icon name="home" /> Home
              </button>
            </div>
          </div>
        }
      />
    </div>
  );
}
