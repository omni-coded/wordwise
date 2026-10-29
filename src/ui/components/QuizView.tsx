import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Question } from '../../game';
import { Icon } from './Icon';

const KIND_LABEL: Record<Question['kind'], string> = {
  term: 'Which word fits this meaning?',
  definition: 'What does this word mean?',
  cloze: 'Complete the sentence',
};

/**
 * One question at a time with instant feedback and an explanation. Answers live in the save, so closing the app
 * mid-quiz loses nothing. When every question has been seen, `results` is shown instead.
 */
export function QuizView({
  questions,
  answers,
  onAnswer,
  results,
  title,
}: {
  questions: readonly Question[];
  answers: Readonly<Record<string, string>>;
  onAnswer: (q: Question, optionId: string) => void;
  results: ReactNode;
  title?: string;
}) {
  const firstOpen = questions.findIndex((q) => answers[q.id] === undefined);
  const [idx, setIdx] = useState(firstOpen === -1 ? questions.length : firstOpen);
  const q = questions[idx];
  const chosen = q ? answers[q.id] : undefined;
  const locked = chosen !== undefined;

  // number keys 1–4 answer the open question
  useEffect(() => {
    if (!q || locked) return;
    const onKey = (e: KeyboardEvent) => {
      const i = Number(e.key) - 1;
      if (i >= 0 && i < q.options.length && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const t = e.target as HTMLElement | null;
        if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
        onAnswer(q, q.options[i].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, locked, onAnswer]);

  if (!q) return <>{results}</>;

  const isLast = idx === questions.length - 1;
  return (
    <section className="quiz" aria-label={title ?? 'Fact Challenge'}>
      <div className="row between">
        <span className="eyebrow">{title ?? 'Fact Challenge'}</span>
        <span className="small muted num">
          Question {idx + 1} of {questions.length}
        </span>
      </div>
      <div className="progress thin" aria-hidden="true">
        <span style={{ width: `${((idx + (locked ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>
      <div className="quiz-q">
        <p className="small muted">{KIND_LABEL[q.kind]}</p>
        <p className={`quiz-stem ${q.kind === 'cloze' ? 'cloze' : ''}`}>{q.stem}</p>
      </div>
      <ul className="quiz-options" role="list">
        {q.options.map((o, i) => {
          const isChosen = chosen === o.id;
          const isRight = q.correctId === o.id;
          const state = !locked ? '' : isRight ? 'right' : isChosen ? 'wrong' : 'dim';
          return (
            <li key={o.id}>
              <button
                className={`qopt ${state}`}
                disabled={locked}
                onClick={() => onAnswer(q, o.id)}
                aria-label={`${i + 1}. ${o.text}${locked && isRight ? ' (correct answer)' : ''}${locked && isChosen && !isRight ? ' (your answer, incorrect)' : ''}`}
              >
                <span className="qkey" aria-hidden="true">{i + 1}</span>
                <span className="qtext">{o.text}</span>
                {locked && isRight && <Icon name="check" size={18} />}
                {locked && isChosen && !isRight && <Icon name="close" size={18} />}
              </button>
            </li>
          );
        })}
      </ul>
      {locked && (
        <div className={`quiz-feedback ${chosen === q.correctId ? 'good' : 'bad'}`} role="status">
          <b>{chosen === q.correctId ? 'Correct.' : 'Not quite.'}</b> <span>{q.explanation}</span>
        </div>
      )}
      {locked && (
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button className="btn primary" onClick={() => setIdx(idx + 1)} autoFocus>
            {isLast ? 'See results' : 'Next question'} <Icon name="chevron" size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
