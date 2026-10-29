/** A small set of line icons, drawn inline so the app needs no icon font or network. */
export type IconName =
  | 'home' | 'compass' | 'book' | 'chart' | 'medal' | 'gear' | 'play' | 'pause' | 'bulb' | 'restart' | 'back'
  | 'close' | 'star' | 'coin' | 'flame' | 'check' | 'heart' | 'search' | 'clock' | 'download' | 'upload'
  | 'trash' | 'chevron' | 'sound' | 'mute' | 'sparkle' | 'repeat' | 'lock' | 'target' | 'flag' | 'eye' | 'plus';

const P: Record<IconName, string> = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h5v-6h3v6h5V10',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM15.8 8.2l-2.1 5.5-5.5 2.1 2.1-5.5 5.5-2.1Z',
  book: 'M5 4.5h10.5A3.5 3.5 0 0 1 19 8v12H8.5A3.5 3.5 0 0 1 5 16.5v-12ZM5 16.5A3.5 3.5 0 0 1 8.5 13H19',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  medal: 'M12 15a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM8.5 14 7 21l5-2.8 5 2.8-1.5-7',
  gear: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM19.4 13.5l1.5 1.2-1.7 3-1.8-.6a7 7 0 0 1-1.6.9l-.4 1.9h-3.4l-.4-1.9a7 7 0 0 1-1.6-.9l-1.8.6-1.7-3 1.5-1.2a7 7 0 0 1 0-1.9L4.5 10.4l1.7-3 1.8.6a7 7 0 0 1 1.6-.9l.4-1.9h3.4l.4 1.9a7 7 0 0 1 1.6.9l1.8-.6 1.7 3-1.5 1.2a7 7 0 0 1 0 1.9Z',
  play: 'M8 5.5v13l11-6.5-11-6.5Z',
  pause: 'M8 5v14M16 5v14',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z',
  restart: 'M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6 6 18',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5Z',
  coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v10M9.5 9.5c0-1 1-1.7 2.5-1.7s2.5.7 2.5 1.7-1 1.4-2.5 1.8-2.5.8-2.5 1.8 1 1.7 2.5 1.7 2.5-.7 2.5-1.7',
  flame: 'M12 21c3.6 0 6-2.4 6-5.7 0-2.6-1.6-4.2-2.7-5.7-.7-1-1.1-2.2-1-3.6-2.7 1.5-4.3 4-4.5 6.2-1-.5-1.5-1.5-1.5-2.7C6.5 11 6 12.700 6 15.300 6 18.600 8.400 21 12 21Z',
  check: 'M5 12.5l4.5 4.5L19 7.500',
  heart: 'M12 20s-7.500-4.600-7.500-10.200A4.300 4.300 0 0 1 12 7.300a4.300 4.300 0 0 1 7.500 2.500C19.500 15.400 12 20 12 20Z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5.500l3.500 2',
  download: 'M12 4v11M7.500 11 12 15.500 16.500 11M5 20h14',
  upload: 'M12 16V5M7.500 9 12 4.500 16.500 9M5 20h14',
  trash: 'M5 7h14M10 7V4.500h4V7M7 7l.8 12.500h8.400L17 7M10 11v5M14 11v5',
  chevron: 'M9 5l7 7-7 7',
  sound: 'M4 9.500v5h3.500L12 18.500v-13L7.500 9.500H4ZM15.500 9a4 4 0 0 1 0 6M18 6.500a8 8 0 0 1 0 11',
  mute: 'M4 9.500v5h3.500L12 18.500v-13L7.500 9.500H4ZM16 9.500l5 5M21 9.500l-5 5',
  sparkle: 'M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800L12 3ZM19 16l.8 2.200L22 19l-2.200.8L19 22l-.8-2.200L16 19l2.200-.8L19 16Z',
  repeat: 'M17 3l3.500 3.500L17 10M4 11V9.500a3 3 0 0 1 3-3h13M7 21l-3.500-3.500L7 14M20 13v1.500a3 3 0 0 1-3 3H4',
  lock: 'M6.500 11h11v9h-11v-9ZM8.500 11V8a3.500 3.500 0 0 1 7 0v3',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 16.500a4.500 4.500 0 1 0 0-9 4.500 4.500 0 0 0 0 9ZM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  flag: 'M6 21V4.500M6 5h11l-2 3.500 2 3.500H6',
  eye: 'M2.500 12S6 5.500 12 5.500 21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12ZM12 14.800a2.800 2.800 0 1 0 0-5.600 2.800 2.800 0 0 0 0 5.600Z',
  plus: 'M12 5v14M5 12h14',
};

const FILLED: ReadonlySet<IconName> = new Set<IconName>(['play']);

export function Icon({ name, size, filled, className }: { name: IconName; size?: number; filled?: boolean; className?: string }) {
  const fill = filled || FILLED.has(name) ? 'currentColor' : 'none';
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={fill}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={P[name]} />
    </svg>
  );
}

export function Stars({ value, max = 3, large }: { value: number; max?: number; large?: boolean }) {
  const items = [];
  for (let i = 0; i < max; i++) {
    items.push(
      <span key={i} className={i < value ? 'on' : ''}>
        <Icon name="star" filled={i < value} />
      </span>,
    );
  }
  return (
    <span className={`stars${large ? ' lg' : ''}`} role="img" aria-label={`${value} of ${max} stars`}>
      {items}
    </span>
  );
}
