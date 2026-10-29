import type { PuzzleMode } from '../engine/types';

export function clock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** "45 sec", "12 min", "3 h 05 min". */
export function duration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  if (total < 60) return `${total} sec`;
  const m = Math.round(total / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
}

export const n = (v: number): string => Math.round(v).toLocaleString('en-US');
export const pct = (v: number): string => `${Math.round(v * 100)}%`;
export const plural = (count: number, one: string, many = `${one}s`): string => `${count} ${count === 1 ? one : many}`;

export function modeLabel(mode: PuzzleMode, level: number): string {
  switch (mode) {
    case 'campaign':
      return `Level ${level}`;
    case 'daily':
      return 'Daily Brain Challenge';
    case 'journey':
      return 'Themed Journey';
    case 'expert':
      return 'Expert Challenge';
    default:
      return 'Practice';
  }
}

export function longDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

export function shortDate(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}
