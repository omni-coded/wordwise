import { useCallback, useEffect, useRef, useState } from 'react';
import type { Cell } from '../../engine/types';
import { targetsOf } from '../../engine';
import { FREE_HINTS, hintCost, type ActiveGame } from '../../game';
import { useApp } from '../state';
import { clock, modeLabel } from '../format';
import { Icon } from '../components/Icon';
import { Grid } from '../components/Grid';
import { WordList } from '../components/WordList';
import { LearnCard, type LearnItem } from '../components/LearnCard';
import { Modal } from '../components/Modal';

const SPECIAL_NOTE: Record<string, string> = {
  relaxing: 'Relaxing level: take your time',
  milestone: 'Milestone level',
  gauntlet: 'Gauntlet: a tougher one',
  clue: 'Clue puzzle: find words from their meanings',
  mastery: 'Mastery challenge',
};

export function Play() {
  const app = useApp();
  const { save, select, hint, pause, resume, restart, quit, go, openEntry, toast } = app;
  const { settings } = save;
  const live = save.game;
  const lastRef = useRef<ActiveGame | null>(null);
  if (live) lastRef.current = live;
  const ended = !live && !!save.summary;
  const game = live ?? lastRef.current;

  const [learn, setLearn] = useState<LearnItem | null>(null);
  const [message, setMessage] = useState('');
  const [confirm, setConfirm] = useState<null | 'restart' | 'abandon'>(null);
  const learnKey = useRef(0);

  // After the last word, linger on the solved board for a moment, then show what was learned.
  useEffect(() => {
    if (!ended) return;
    const t = window.setTimeout(() => go('summary'), 1500);
    return () => window.clearTimeout(t);
  }, [ended, go]);

  const { learnToasts, focusMode } = settings;
  const submit = useCallback(
    (cells: readonly Cell[]) => {
      const res = select(cells);
      if ((res.kind === 'found' || res.kind === 'bonus') && res.placement && learnToasts && !focusMode) {
        setLearn({ key: ++learnKey.current, entryId: res.placement.entryId, bonus: res.kind === 'bonus' });
      }
      return res;
    },
    [select, learnToasts, focusMode],
  );
  const closeLearn = useCallback(() => setLearn(null), []);

  if (!game) return null;
  const { puzzle, state } = game;
  const targets = targetsOf(puzzle);
  const foundIds = ended && save.summary?.outcome === 'complete' ? targets.map((t) => t.entryId) : state.found;
  const paused = game.paused && !ended;
  const cost = hintCost(state);
  const freeLeft = Math.max(0, FREE_HINTS - state.hintsUsed);
  const remaining = game.limitMs !== null ? game.limitMs - state.elapsedMs : null;
  const showClock = !focusMode && (settings.showTimer || remaining !== null);
  const specials = puzzle.specials.filter((s) => SPECIAL_NOTE[s]);

  const onHint = () => {
    const out = hint();
    if (!out.ok) {
      if (out.reason === 'coins') {
        toast({ kind: 'info', title: 'Not enough coins', body: `A hint now costs ${cost} coins. Completing puzzles earns more.` });
      }
      return;
    }
    const p = out.placement;
    setMessage(`Hint: a word begins with ${p.word[0]} at row ${p.r + 1}, column ${p.c + 1}.`);
  };

  return (
    <div className="play">
      <div className="play-top">
        <button className="btn ghost icon" onClick={() => go('home')} aria-label="Save and leave the puzzle">
          <Icon name="back" />
        </button>
        <div className="play-title">
          <span className="eyebrow">{modeLabel(puzzle.spec.mode, puzzle.level)}</span>
          <h1>{puzzle.title}</h1>
          <span className="small muted">
            {puzzle.theme}
            {!focusMode && ` · ${puzzle.difficulty.label}`}
          </span>
        </div>
        <div className="play-actions">
          <button className="btn sm" onClick={onHint} disabled={paused || ended} aria-label={cost === 0 ? `Hint, free, ${freeLeft} left` : `Hint, costs ${cost} coins`}>
            <Icon name="bulb" />
            <span>{cost === 0 ? `Hint · ${freeLeft} free` : `Hint · ${cost}`}</span>
          </button>
          <button className="btn sm icon" onClick={pause} disabled={paused || ended} aria-label="Pause">
            <Icon name="pause" />
          </button>
        </div>
      </div>

      {!focusMode && (
        <div className="play-meta">
          <span className="pill">
            <b className="num">{foundIds.length}</b> of {targets.length} found
          </span>
          {showClock && (
            <span className={`pill timer${remaining !== null && remaining < 30000 ? ' low' : ''}`}>
              <Icon name="clock" size={14} />
              <b>{remaining !== null ? clock(remaining) : clock(state.elapsedMs)}</b>
              {remaining !== null && <span>left</span>}
            </span>
          )}
          <span className="pill">
            <Icon name="coin" size={14} /> <b className="num">{save.stats.coins}</b>
          </span>
          {specials.map((s) => (
            <span key={s} className="tag gold">
              {SPECIAL_NOTE[s]}
            </span>
          ))}
        </div>
      )}

      <div className="play-body">
        <div className="board-wrap">
          <Grid
            puzzle={puzzle}
            found={foundIds}
            bonusFound={state.bonusFound}
            hinted={state.hinted}
            disabled={paused || ended}
            gridTheme={settings.gridTheme}
            highlight={settings.highlightStyle}
            onSubmit={submit}
            onAnnounce={setMessage}
          />
          {paused && (
            <div className="overlay-card" role="dialog" aria-label="Paused">
              <div>
                <h2>{state.found.length > 0 || state.elapsedMs > 3000 ? 'Paused' : 'Ready when you are'}</h2>
                <p className="muted small">The board is hidden while paused.</p>
                <button className="btn primary lg" onClick={resume} autoFocus>
                  <Icon name="play" /> Resume
                </button>
                <div className="row" style={{ justifyContent: 'center' }}>
                  <button className="btn sm" onClick={() => go('home')}>Save and exit</button>
                  <button className="btn sm" onClick={() => setConfirm('restart')}>Restart</button>
                  <button className="btn sm danger" onClick={() => setConfirm('abandon')}>Abandon</button>
                </div>
              </div>
            </div>
          )}
          {ended && (
            <div className="solved-banner" role="status">
              {save.summary?.outcome === 'timeout' ? "Time's up" : 'Puzzle complete'}
            </div>
          )}
        </div>
        <div className="play-side">
          <WordList puzzle={puzzle} found={foundIds} bonusFound={state.bonusFound} hinted={state.hinted} onOpen={openEntry} />
        </div>
      </div>

      {learn && !paused && !ended && <LearnCard item={learn} onClose={closeLearn} onMore={openEntry} />}
      <div className="sr-only" aria-live="polite" role="status">{message}</div>

      {confirm && (
        <Modal
          title={confirm === 'restart' ? 'Restart this puzzle?' : 'Abandon this puzzle?'}
          onClose={() => setConfirm(null)}
          actions={
            <>
              <button className="btn" onClick={() => setConfirm(null)}>Keep playing</button>
              <button
                className={`btn ${confirm === 'abandon' ? 'danger' : 'primary'}`}
                onClick={() => {
                  if (confirm === 'restart') restart();
                  else quit();
                  setConfirm(null);
                }}
              >
                {confirm === 'restart' ? 'Restart' : 'Abandon'}
              </button>
            </>
          }
        >
          <p className="muted">
            {confirm === 'restart'
              ? 'Your found words and hints on this board are cleared and the clock starts over. Coins already spent on hints stay spent.'
              : 'This puzzle is discarded. Words you already discovered stay in your journal.'}
          </p>
        </Modal>
      )}
    </div>
  );
}
