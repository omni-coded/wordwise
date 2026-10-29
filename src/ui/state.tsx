/**
 * The app store: one React context holding the SaveData, the current screen, toasts and the audio engine.
 * All game rules live in src/game (pure functions); this file only wires them to React, the clock,
 * localStorage and the browser (theme, visibility, hash routing).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Cell } from '../engine/types';
import type { SubmitResult } from '../engine/session';
import type { Journey } from '../content/journeys';
import {
  abandonGame,
  ackBadges,
  applySelection,
  beginGame,
  buildPuzzle,
  campaignPlan,
  dailyPlan,
  dateKey,
  dayNumber,
  detectStore,
  expertPlan,
  journeyPlan,
  loadSave,
  pauseGame,
  practicePlan,
  restartGame,
  resumeGame,
  reviewPlan,
  tickGame,
  updateSettings,
  useHint,
  writeSave,
  getAchievement,
  type HintOutcome,
  type LoadStatus,
  type PlanContext,
  type PlannedPuzzle,
  type PracticeOptions,
  type SaveData,
  type Settings,
} from '../game';
import { createAudio, vibrate, type AudioEngine, type Sfx } from '../game/audio';

export type Route =
  | 'home'
  | 'play'
  | 'summary'
  | 'journal'
  | 'review'
  | 'stats'
  | 'achievements'
  | 'journeys'
  | 'practice'
  | 'settings';

const ROUTES: readonly Route[] = ['home', 'play', 'summary', 'journal', 'review', 'stats', 'achievements', 'journeys', 'practice', 'settings'];

export type ToastKind = 'badge' | 'unlock' | 'info' | 'error';
export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
  glyph?: string;
}

export interface App {
  save: SaveData;
  /** Applies a pure state transition and persists the result. Returns the new save. */
  update: (fn: (s: SaveData, now: number) => SaveData) => SaveData;
  route: Route;
  go: (route: Route) => void;
  busy: boolean;
  loadStatus: LoadStatus;
  persistent: boolean;
  saveFailed: boolean;
  toasts: Toast[];
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: number) => void;
  /** The entry shown in the full word-card dialog, if any. */
  openEntryId: string | null;
  openEntry: (id: string | null) => void;
  sound: (name: Sfx, step?: number) => void;
  buzz: (pattern: number | number[]) => void;
  /** Settings shortcut. */
  set: (patch: Partial<Settings>) => void;
  // starting games
  startCampaign: () => void;
  startDaily: () => void;
  startJourney: (journey: Journey, step: number | 'mastery') => void;
  startExpert: () => void;
  startPractice: (opts: Omit<PracticeOptions, 'serial' | 'level'> & { level?: number }) => void;
  startReviewPuzzle: () => boolean;
  // playing
  select: (cells: readonly Cell[]) => SubmitResult;
  hint: () => HintOutcome;
  pause: () => void;
  resume: () => void;
  restart: () => void;
  quit: () => void;
  /** Replace everything (import / reset). */
  replaceSave: (next: SaveData, opts?: { backup?: boolean }) => void;
  resetStore: () => ReturnType<typeof detectStore>['store'];
}

const Ctx = createContext<App | null>(null);

export function useApp(): App {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside <AppProvider>');
  return v;
}

/** Routes live in the URL hash as `#ww-<route>` (plain ASCII, so hosts that only pass simple hashes keep them). */
const hashFor = (r: Route): string => `#ww-${r}`;

function routeFromHash(): Route {
  const h = (typeof location !== 'undefined' ? location.hash : '').replace(/^#ww-/, '');
  return (ROUTES as readonly string[]).includes(h) ? (h as Route) : 'home';
}

interface Boot {
  store: ReturnType<typeof detectStore>['store'];
  persistent: boolean;
  save: SaveData;
  status: LoadStatus;
}

function boot(): Boot {
  const { store, persistent } = detectStore();
  const { save, status } = loadSave(store, Date.now());
  // A reload never resumes mid-swipe: an active puzzle always comes back paused.
  const resumed = save.game && !save.game.paused ? pauseGame(save, Date.now()) : save;
  return { store, persistent, save: resumed, status };
}

const todayOf = (now: number) => dayNumber(dateKey(new Date(now)));

function planContext(s: SaveData, now: number): PlanContext {
  return { enabled: s.settings.enabledCategories, words: s.words, today: todayOf(now), level: s.campaign.level };
}

/**
 * Writes every display preference onto <html>. The resolved light/dark theme is the player's explicit choice,
 * else the host page's `data-theme` (an embedding viewer may set it), else the device preference.
 */
function applyDisplay(settings: Settings): void {
  const root = document.documentElement;
  const dark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  const host = root.getAttribute('data-theme');
  const system = host === 'dark' || host === 'light' ? host : dark ? 'dark' : 'light';
  const theme = settings.theme === 'system' ? system : settings.theme;
  root.dataset.resolved = theme;
  root.dataset.text = settings.textSize;
  root.dataset.contrast = settings.highContrast ? 'high' : 'normal';
  root.dataset.font = settings.plainFont ? 'plain' : 'editorial';
  const reduce =
    settings.motion === 'reduce' ||
    (settings.motion === 'system' && typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  root.dataset.motion = reduce ? 'reduced' : 'full';
  root.dataset.focus = settings.focusMode ? 'on' : 'off';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d1424' : '#f6f1e7');
}

export function AppProvider({ children }: { children: ReactNode }) {
  const bootRef = useRef<Boot | null>(null);
  if (!bootRef.current) bootRef.current = boot();
  const b = bootRef.current;

  const [save, setSave] = useState<SaveData>(b.save);
  const saveRef = useRef<SaveData>(b.save);
  const storeRef = useRef(b.store);
  const [route, setRoute] = useState<Route>(routeFromHash);
  const routeRef = useRef<Route>(route);
  const [busy, setBusy] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const toastId = useRef(1);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const lastSummaryId = useRef<string | null>(b.save.summary?.id ?? null);
  const audio = useRef<AudioEngine | null>(null);
  if (!audio.current) audio.current = createAudio();

  /* ───────────── persistence ───────────── */

  const flush = useCallback((backup = false) => {
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = null;
    if (!dirty.current && !backup) return;
    dirty.current = false;
    const ok = writeSave(storeRef.current, saveRef.current, { backup });
    setSaveFailed((prev) => (prev === !ok ? prev : !ok));
  }, []);

  const commit = useCallback(
    (next: SaveData) => {
      if (next === saveRef.current) return next;
      saveRef.current = next;
      setSave(next);
      dirty.current = true;
      const sumId = next.summary?.id ?? null;
      if (sumId && sumId !== lastSummaryId.current) {
        lastSummaryId.current = sumId;
        flush(true); // a finished puzzle is worth an immediate write and a fresh backup
      } else {
        if (!next.summary) lastSummaryId.current = null;
        if (!writeTimer.current) writeTimer.current = setTimeout(() => flush(false), 400);
      }
      return next;
    },
    [flush],
  );

  const update = useCallback(
    (fn: (s: SaveData, now: number) => SaveData) => commit(fn(saveRef.current, Date.now())),
    [commit],
  );

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') {
        if (saveRef.current.game && !saveRef.current.game.paused) {
          commit(pauseGame(saveRef.current, Date.now()));
        }
        flush(false);
      }
    };
    const onPageHide = () => flush(false);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [commit, flush]);

  /* ───────────── display & audio preferences ───────────── */

  useEffect(() => {
    applyDisplay(save.settings);
    if (save.settings.theme !== 'system') return;
    const again = () => applyDisplay(saveRef.current.settings);
    const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
    mq?.addEventListener('change', again);
    // an embedding page may flip data-theme later
    const mo = new MutationObserver(again);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      mq?.removeEventListener('change', again);
      mo.disconnect();
    };
  }, [save.settings]);

  useEffect(() => {
    const a = audio.current!;
    a.setSfx(save.settings.sound, save.settings.sfxVolume);
    a.setMusic(save.settings.music, save.settings.musicVolume);
  }, [save.settings.sound, save.settings.sfxVolume, save.settings.music, save.settings.musicVolume]);

  useEffect(() => {
    // Browsers only start audio after a gesture.
    const unlock = () => audio.current?.unlock();
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const sound = useCallback((name: Sfx, step?: number) => audio.current?.play(name, step), []);
  const buzz = useCallback((pattern: number | number[]) => {
    if (saveRef.current.settings.haptics) vibrate(pattern);
  }, []);

  /* ───────────── routing ───────────── */

  const go = useCallback(
    (next: Route) => {
      const prev = routeRef.current;
      if (prev === 'play' && next !== 'play' && saveRef.current.game && !saveRef.current.game.paused) {
        commit(pauseGame(saveRef.current, Date.now()));
      }
      routeRef.current = next;
      setRoute(next);
      try {
        const want = hashFor(next);
        if (location.hash !== want) history.pushState(null, '', want);
      } catch {
        /* sandboxed frames may forbid history changes */
      }
      window.scrollTo?.(0, 0);
    },
    [commit],
  );

  useEffect(() => {
    const onPop = () => {
      const r = routeFromHash();
      const prev = routeRef.current;
      if (prev === 'play' && r !== 'play' && saveRef.current.game && !saveRef.current.game.paused) {
        commit(pauseGame(saveRef.current, Date.now()));
      }
      routeRef.current = r;
      setRoute(r);
    };
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, [commit]);

  // Screens that need data the save does not have fall back gracefully.
  useEffect(() => {
    if (route === 'play' && !save.game && !save.summary) go('home');
    if (route === 'summary' && !save.summary) go('home');
    if (route === 'review' && !save.review) go('home');
  }, [route, save.game, save.summary, save.review, go]);

  /* ───────────── toasts ───────────── */

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = toastId.current++;
    setToasts((list) => [...list.slice(-3), { ...t, id }]);
    window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), t.kind === 'error' ? 8000 : 5200);
  }, []);

  // New badges announce themselves wherever the player happens to be.
  useEffect(() => {
    if (save.unseenBadges.length === 0) return;
    if (save.game) return; // keep the board uncluttered mid-puzzle; they appear right after
    for (const id of save.unseenBadges) {
      const a = getAchievement(id);
      if (a) toast({ kind: 'badge', title: a.name, body: a.description, glyph: a.glyph });
    }
    sound('badge');
    commit(ackBadges(saveRef.current));
  }, [save.unseenBadges, save.game, toast, sound, commit]);

  /* ───────────── the game clock ───────────── */

  const clockActive = !!save.game && !save.game.paused && save.game.state.status === 'playing' && route === 'play' && openEntryId === null;
  const fast = save.settings.showTimer || (save.game?.limitMs ?? null) !== null;
  useEffect(() => {
    if (!clockActive) return;
    let last = Date.now();
    const id = window.setInterval(() => {
      const t = Date.now();
      const d = t - last;
      last = t;
      if (document.visibilityState === 'hidden') return;
      commit(tickGame(saveRef.current, d, t));
    }, fast ? 250 : 1000);
    return () => window.clearInterval(id);
  }, [clockActive, fast, commit]);

  /* ───────────── starting puzzles ───────────── */

  const launch = useCallback(
    (make: (s: SaveData, now: number) => PlannedPuzzle | null, after?: (s: SaveData) => SaveData): boolean => {
      const now = Date.now();
      const plan = make(saveRef.current, now);
      if (!plan) return false;
      setBusy(true);
      // yield one frame so the "preparing" state can paint before the generator runs
      window.setTimeout(() => {
        try {
          const puzzle = buildPuzzle(plan);
          let next = beginGame(saveRef.current, puzzle, Date.now());
          if (after) next = after(next);
          commit(next);
          routeRef.current = 'play';
          setRoute('play');
          try {
            if (location.hash !== hashFor('play')) history.pushState(null, '', hashFor('play'));
          } catch {
            /* ignore */
          }
          window.scrollTo?.(0, 0);
        } catch (err) {
          toast({ kind: 'error', title: 'Could not build that puzzle', body: err instanceof Error ? err.message : String(err) });
        } finally {
          setBusy(false);
        }
      }, 30);
      return true;
    },
    [commit, toast],
  );

  const startCampaign = useCallback(() => {
    launch((s, now) => campaignPlan(s.campaign.level, planContext(s, now)));
  }, [launch]);

  const startDaily = useCallback(() => {
    launch((s, now) => {
      const key = dateKey(new Date(now));
      return s.daily[key] ? null : dailyPlan(key);
    });
  }, [launch]);

  const startJourney = useCallback(
    (journey: Journey, step: number | 'mastery') => {
      launch((s, now) => journeyPlan(journey, step, planContext(s, now)));
    },
    [launch],
  );

  const startExpert = useCallback(() => {
    launch(
      (s, now) => expertPlan(s.serial, planContext(s, now)),
      (s) => ({ ...s, serial: s.serial + 1 }),
    );
  }, [launch]);

  const startPractice = useCallback(
    (opts: Omit<PracticeOptions, 'serial' | 'level'> & { level?: number }) => {
      launch(
        (s, now) => practicePlan({ ...opts, level: opts.level ?? Math.max(1, s.campaign.level), serial: s.serial }, planContext(s, now)),
        (s) => ({ ...s, serial: s.serial + 1 }),
      );
    },
    [launch],
  );

  const startReviewPuzzle = useCallback((): boolean => {
    return launch(
      (s, now) => reviewPlan(s.serial, planContext(s, now)),
      (s) => ({ ...s, serial: s.serial + 1 }),
    );
  }, [launch]);

  /* ───────────── playing ───────────── */

  const select = useCallback(
    (cells: readonly Cell[]): SubmitResult => {
      const out = applySelection(saveRef.current, cells, Date.now());
      commit(out.save);
      const r = out.result;
      const found = out.save.game?.state.found.length ?? saveRef.current.summary?.words.length ?? 0;
      if (r.kind === 'found') {
        sound(out.completed ? 'complete' : 'found', Math.max(0, found - 1));
        buzz(out.completed ? [20, 40, 30] : 14);
      } else if (r.kind === 'bonus') {
        sound('bonus');
        buzz([12, 30, 12]);
      } else if (r.kind === 'miss') {
        sound('miss');
        buzz(24);
      }
      return r;
    },
    [commit, sound, buzz],
  );

  const hint = useCallback((): HintOutcome => {
    const out = useHint(saveRef.current, Date.now());
    if (out.ok) {
      commit(out.save);
      sound('hint');
    } else {
      sound('wrong');
    }
    return out;
  }, [commit, sound]);

  const pause = useCallback(() => commit(pauseGame(saveRef.current, Date.now())), [commit]);
  const resume = useCallback(() => commit(resumeGame(saveRef.current, Date.now())), [commit]);
  const restart = useCallback(() => commit(restartGame(saveRef.current, Date.now())), [commit]);
  const quit = useCallback(() => {
    commit(abandonGame(saveRef.current, Date.now()));
    go('home');
  }, [commit, go]);

  const set = useCallback((patch: Partial<Settings>) => update((s, now) => updateSettings(s, patch, now)), [update]);

  const replaceSave = useCallback(
    (next: SaveData, opts?: { backup?: boolean }) => {
      saveRef.current = next;
      setSave(next);
      lastSummaryId.current = next.summary?.id ?? null;
      dirty.current = true;
      flush(!!opts?.backup);
    },
    [flush],
  );

  const resetStore = useCallback(() => storeRef.current, []);

  const value = useMemo<App>(
    () => ({
      save,
      update,
      route,
      go,
      busy,
      loadStatus: b.status,
      persistent: b.persistent,
      saveFailed,
      toasts,
      toast,
      dismissToast,
      openEntryId,
      openEntry: setOpenEntryId,
      sound,
      buzz,
      set,
      startCampaign,
      startDaily,
      startJourney,
      startExpert,
      startPractice,
      startReviewPuzzle,
      select,
      hint,
      pause,
      resume,
      restart,
      quit,
      replaceSave,
      resetStore,
    }),
    [save, update, route, go, busy, b.status, b.persistent, saveFailed, toasts, toast, dismissToast, openEntryId, sound, buzz, set, startCampaign, startDaily, startJourney, startExpert, startPractice, startReviewPuzzle, select, hint, pause, resume, restart, quit, replaceSave, resetStore],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
