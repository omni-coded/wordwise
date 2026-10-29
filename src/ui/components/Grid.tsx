/**
 * The letter board. Pointer events cover mouse, touch and pen with one code path:
 *   - drag from the first letter to the last (the line snaps to the 8 compass directions), or
 *   - tap the first letter, then tap the last.
 * Keyboard: arrow keys move, Enter / Space marks the start and then the end, Escape cancels.
 * Highlights are drawn in an SVG layer beneath the letters so they never hide them.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as RKeyboardEvent, PointerEvent as RPointerEvent } from 'react';
import { cellsBetween, cellsOf, pathString, snapToLine } from '../../engine';
import type { Cell, Placement, Puzzle } from '../../engine/types';
import type { SubmitResult } from '../../engine/session';

export interface GridProps {
  puzzle: Puzzle;
  found: readonly string[];
  bonusFound: readonly string[];
  hinted: readonly string[];
  disabled: boolean;
  gridTheme: string;
  highlight: string;
  onSubmit: (cells: readonly Cell[]) => SubmitResult;
  onAnnounce?: (message: string) => void;
}

interface Geometry {
  cx: number;
  cy: number;
  len: number;
  angle: number;
}

function geometry(a: Cell, b: Cell): Geometry {
  const x1 = a.c + 0.5;
  const y1 = a.r + 0.5;
  const x2 = b.c + 0.5;
  const y2 = b.r + 0.5;
  return { cx: (x1 + x2) / 2, cy: (y1 + y2) / 2, len: Math.hypot(x2 - x1, y2 - y1), angle: (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI };
}

const ends = (p: Placement): [Cell, Cell] => {
  const c = cellsOf(p);
  return [c[0], c[c.length - 1]];
};

function Mark({ a, b, style, cls, index }: { a: Cell; b: Cell; style: string; cls: string; index: number }) {
  const g = geometry(a, b);
  const t = `translate(${g.cx} ${g.cy}) rotate(${g.angle})`;
  const hi = `var(--h${index % 8})`;
  const common = { className: `mark ${cls}`, style: { ['--hi' as string]: hi } };
  switch (style) {
    case 'marker':
      return (
        <g transform={t} {...common}>
          <rect x={-(g.len + 0.72) / 2} y={-0.36} width={g.len + 0.72} height={0.72} rx={0.1} className="m-fill" />
        </g>
      );
    case 'underline':
      return (
        <g transform={t} {...common}>
          <rect x={-(g.len + 0.7) / 2} y={0.27} width={g.len + 0.7} height={0.1} rx={0.05} className="m-solid" />
        </g>
      );
    case 'outline':
      return (
        <g transform={t} {...common}>
          <rect x={-(g.len + 0.86) / 2} y={-0.43} width={g.len + 0.86} height={0.86} rx={0.2} className="m-stroke" />
        </g>
      );
    case 'glow':
      return (
        <g transform={t} {...common}>
          <rect x={-(g.len + 0.8) / 2} y={-0.4} width={g.len + 0.8} height={0.8} rx={0.4} className="m-glow" filter="url(#ww-blur)" />
          <rect x={-(g.len + 0.8) / 2} y={-0.4} width={g.len + 0.8} height={0.8} rx={0.4} className="m-stroke thin" />
        </g>
      );
    default:
      return (
        <g transform={t} {...common}>
          <rect x={-(g.len + 0.86) / 2} y={-0.39} width={g.len + 0.86} height={0.78} rx={0.39} className="m-capsule" />
        </g>
      );
  }
}

function GridImpl({ puzzle, found, bonusFound, hinted, disabled, gridTheme, highlight, onSubmit, onAnnounce }: GridProps) {
  const N = puzzle.size;
  const boardRef = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState<Cell[]>([]);
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [cursor, setCursor] = useState<Cell>({ r: 0, c: 0 });
  const [kb, setKb] = useState(false);
  const [flash, setFlash] = useState<{ cells: Cell[]; kind: 'miss' } | null>(null);
  const drag = useRef<{ start: Cell; moved: boolean; id: number } | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  // A new puzzle (or a restart) starts with a clean board.
  useEffect(() => {
    setSel([]);
    setAnchor(null);
    setFlash(null);
    setCursor({ r: 0, c: 0 });
  }, [puzzle.id]);

  useEffect(() => {
    if (disabled) {
      setSel([]);
      setAnchor(null);
      drag.current = null;
    }
  }, [disabled]);

  const cellAt = useCallback(
    (e: { clientX: number; clientY: number }): { cell: Cell; x: number; y: number } | null => {
      const el = boardRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * N;
      const y = ((e.clientY - rect.top) / rect.height) * N;
      return { cell: { r: Math.min(N - 1, Math.max(0, Math.floor(y))), c: Math.min(N - 1, Math.max(0, Math.floor(x))) }, x, y };
    },
    [N],
  );

  const submit = useCallback(
    (cells: Cell[]) => {
      setSel([]);
      setAnchor(null);
      if (cells.length < 2) return;
      const text = pathString(puzzle.grid, cells);
      const res = onSubmit(cells);
      if (res.kind === 'miss') {
        setFlash({ cells, kind: 'miss' });
        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setFlash(null), 520);
        onAnnounce?.(`${text} is not one of the hidden words.`);
      } else if (res.kind === 'found' && res.placement) {
        onAnnounce?.(`Found ${res.placement.display}.`);
      } else if (res.kind === 'bonus' && res.placement) {
        onAnnounce?.(`Bonus word found: ${res.placement.display}.`);
      } else if (res.kind === 'duplicate' && res.placement) {
        onAnnounce?.(`${res.placement.display} is already found.`);
      }
    },
    [onSubmit, onAnnounce, puzzle.grid],
  );

  /* ───────── pointer ───────── */

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const hit = cellAt(e);
    if (!hit) return;
    e.preventDefault();
    setKb(false);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* some browsers throw for synthetic pointers */
    }
    drag.current = { start: hit.cell, moved: false, id: e.pointerId };
    setCursor(hit.cell);
    setSel([hit.cell]);
    setFlash(null);
  };

  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const hit = cellAt(e);
    if (!hit) return;
    const end = snapToLine(d.start, hit.x, hit.y, N);
    const line = cellsBetween(d.start, end) ?? [d.start];
    if (line.length > 1 && !d.moved) {
      d.moved = true;
      setAnchor(null);
    }
    setSel((prev) => (prev.length === line.length && prev[prev.length - 1].r === end.r && prev[prev.length - 1].c === end.c ? prev : line));
    setCursor(end);
  };

  const finishPointer = (e: RPointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (cancelled) {
      setSel([]);
      return;
    }
    if (d.moved) {
      const hit = cellAt(e);
      const end = hit ? snapToLine(d.start, hit.x, hit.y, N) : d.start;
      submit(cellsBetween(d.start, end) ?? []);
      return;
    }
    // a tap: first tap marks the start, second tap completes the line
    if (anchor) {
      if (anchor.r === d.start.r && anchor.c === d.start.c) {
        setAnchor(null);
        setSel([]);
        return;
      }
      const line = cellsBetween(anchor, d.start);
      if (line) {
        submit(line);
        return;
      }
    }
    setAnchor(d.start);
    setSel([d.start]);
  };

  /* ───────── keyboard ───────── */

  const move = (dr: number, dc: number) => {
    const next = { r: Math.min(N - 1, Math.max(0, cursor.r + dr)), c: Math.min(N - 1, Math.max(0, cursor.c + dc)) };
    setCursor(next);
    if (anchor) {
      const line = cellsBetween(anchor, next);
      setSel(line ?? [anchor]);
      onAnnounce?.(line ? `Row ${next.r + 1}, column ${next.c + 1}. Selection ${pathString(puzzle.grid, line)}.` : `Row ${next.r + 1}, column ${next.c + 1}. Not in a straight line from the start.`);
    } else {
      onAnnounce?.(`Row ${next.r + 1}, column ${next.c + 1}: ${puzzle.grid[next.r][next.c]}.`);
    }
  };

  const onKeyDown = (e: RKeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const k = e.key;
    const step: Record<string, [number, number]> = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
      w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1],
    };
    if (k in step && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setKb(true);
      move(step[k][0], step[k][1]);
    } else if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      setKb(true);
      if (!anchor) {
        setAnchor(cursor);
        setSel([cursor]);
        onAnnounce?.(`Start set at row ${cursor.r + 1}, column ${cursor.c + 1}. Move to the last letter and press Enter again.`);
      } else {
        const line = cellsBetween(anchor, cursor);
        if (line && line.length > 1) submit(line);
        else if (!line) onAnnounce?.('Those letters are not in a straight line.');
        else {
          setAnchor(null);
          setSel([]);
        }
      }
    } else if (k === 'Escape') {
      if (anchor || sel.length) {
        e.preventDefault();
        e.stopPropagation();
        setAnchor(null);
        setSel([]);
        onAnnounce?.('Selection cleared.');
      }
    } else if (k === 'Home') {
      e.preventDefault();
      setCursor({ r: cursor.r, c: 0 });
    } else if (k === 'End') {
      e.preventDefault();
      setCursor({ r: cursor.r, c: N - 1 });
    }
  };

  /* ───────── derived drawing data ───────── */

  const marks = useMemo(() => {
    const out: Array<{ key: string; a: Cell; b: Cell; index: number; bonus: boolean }> = [];
    puzzle.placements.forEach((p, index) => {
      const isTarget = p.kind === 'target';
      if (isTarget ? found.includes(p.entryId) : bonusFound.includes(p.entryId)) {
        const [a, b] = ends(p);
        out.push({ key: p.entryId, a, b, index, bonus: !isTarget });
      }
    });
    return out;
  }, [puzzle, found, bonusFound]);

  const hintCells = useMemo(
    () =>
      puzzle.placements
        .filter((p) => p.kind === 'target' && hinted.includes(p.entryId) && !found.includes(p.entryId))
        .map((p) => cellsOf(p)[0]),
    [puzzle, hinted, found],
  );

  const live = flash ? flash.cells : sel;
  const liveKind = flash ? 'miss' : 'sel';
  const showCursor = kb && !disabled;

  const letters = useMemo(() => {
    const out = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) out.push(<span key={`${r}-${c}`} className="cell">{puzzle.grid[r][c]}</span>);
    return out;
  }, [puzzle.grid, N]);

  return (
    <div
      className="board"
      ref={boardRef}
      data-grid={gridTheme}
      data-hl={highlight}
      data-disabled={disabled || undefined}
      style={{ ['--n' as string]: N }}
      role="application"
      aria-roledescription="word search grid"
      aria-label={`Word search, ${N} by ${N}. Use the arrow keys to move, Enter to mark the first and last letter of a word.`}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finishPointer(e, false)}
      onPointerCancel={(e) => finishPointer(e, true)}
      onKeyDown={onKeyDown}
      onBlur={() => setKb(false)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg className="overlay" viewBox={`0 0 ${N} ${N}`} aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <filter id="ww-blur" x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="0.16" />
          </filter>
        </defs>
        {marks.map((m) => (
          <Mark key={m.key} a={m.a} b={m.b} style={highlight} cls={m.bonus ? 'bonus' : ''} index={m.index} />
        ))}
        {hintCells.map((h) => (
          <circle key={`h${h.r}-${h.c}`} cx={h.c + 0.5} cy={h.r + 0.5} r={0.43} className="hint-ring" />
        ))}
        {live.length > 0 && (
          <g className={`live ${liveKind}`}>
            {live.length === 1 ? (
              <circle cx={live[0].c + 0.5} cy={live[0].r + 0.5} r={0.4} className="live-shape" />
            ) : (
              (() => {
                const g = geometry(live[0], live[live.length - 1]);
                return (
                  <g transform={`translate(${g.cx} ${g.cy}) rotate(${g.angle})`}>
                    <rect x={-(g.len + 0.86) / 2} y={-0.39} width={g.len + 0.86} height={0.78} rx={0.39} className="live-shape" />
                  </g>
                );
              })()
            )}
          </g>
        )}
        {showCursor && <rect x={cursor.c + 0.04} y={cursor.r + 0.04} width={0.92} height={0.92} rx={0.14} className="cursor" />}
      </svg>
      <div className="cells">{letters}</div>
    </div>
  );
}

export const Grid = memo(GridImpl);
