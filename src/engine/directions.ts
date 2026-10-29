import type { Rng } from './rng';

export type DirId = 'E' | 'W' | 'S' | 'N' | 'SE' | 'NE' | 'SW' | 'NW';

export interface Direction {
  id: DirId;
  dr: number;
  dc: number;
  axis: 'h' | 'v' | 'd';
  /** Reads right-to-left or bottom-to-top. */
  backward: boolean;
  arrow: string;
  name: string;
}

export const DIRECTIONS: readonly Direction[] = [
  { id: 'E', dr: 0, dc: 1, axis: 'h', backward: false, arrow: '→', name: 'right' },
  { id: 'W', dr: 0, dc: -1, axis: 'h', backward: true, arrow: '←', name: 'left' },
  { id: 'S', dr: 1, dc: 0, axis: 'v', backward: false, arrow: '↓', name: 'down' },
  { id: 'N', dr: -1, dc: 0, axis: 'v', backward: true, arrow: '↑', name: 'up' },
  { id: 'SE', dr: 1, dc: 1, axis: 'd', backward: false, arrow: '↘', name: 'down-right' },
  { id: 'NE', dr: -1, dc: 1, axis: 'd', backward: false, arrow: '↗', name: 'up-right' },
  { id: 'SW', dr: 1, dc: -1, axis: 'd', backward: true, arrow: '↙', name: 'down-left' },
  { id: 'NW', dr: -1, dc: -1, axis: 'd', backward: true, arrow: '↖', name: 'up-left' },
];

export function directionFor(dr: number, dc: number): Direction | undefined {
  return DIRECTIONS.find((d) => d.dr === Math.sign(dr) && d.dc === Math.sign(dc));
}

/**
 * Picks a direction using the level's difficulty knobs:
 * `diagProb` = chance of a diagonal, `backProb` = chance it reads backwards.
 */
export function pickDirection(rng: Rng, diagProb: number, backProb: number): Direction {
  const axis = rng.chance(diagProb) ? 'd' : rng.chance(0.5) ? 'h' : 'v';
  const backward = rng.chance(backProb);
  const options = DIRECTIONS.filter((d) => d.axis === axis && d.backward === backward);
  return rng.pick(options);
}
