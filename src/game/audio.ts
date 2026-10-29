/**
 * Sound. Everything is synthesised with the Web Audio API (no audio files), so the game stays a single
 * small bundle and works offline. Effects are short, soft and pitched to a pentatonic scale so they never clash;
 * the optional ambient music is a slow generative pad with sparse bell notes.
 *
 * Browsers only allow audio after a user gesture: call `unlock()` from a click or touch handler.
 */
export type Sfx = 'tap' | 'found' | 'bonus' | 'miss' | 'hint' | 'complete' | 'star' | 'badge' | 'correct' | 'wrong' | 'levelup';

export interface AudioEngine {
  unlock(): void;
  setSfx(enabled: boolean, volume: number): void;
  setMusic(enabled: boolean, volume: number): void;
  /** `step` raises the pitch along the scale for consecutive finds. */
  play(name: Sfx, step?: number): void;
  dispose(): void;
}

type AudioCtor = typeof AudioContext;

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
/** C major pentatonic, two octaves: calm, never dissonant. */
const PENTA = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];

const CHORDS: number[][] = [
  [45, 52, 57, 60, 64], // Am9-ish
  [41, 48, 53, 57, 60], // Fmaj7
  [48, 55, 59, 64, 67], // Cmaj7
  [43, 50, 55, 59, 62], // G6/9
];

export function createAudio(): AudioEngine {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let sfxBus: GainNode | null = null;
  let musicBus: GainNode | null = null;
  let sfxOn = true;
  let sfxVol = 0.6;
  let musicOn = false;
  let musicVol = 0.35;
  let timer: ReturnType<typeof setInterval> | null = null;
  let nextChordAt = 0;
  let nextBellAt = 0;
  let chordIndex = 0;
  const live = new Set<AudioScheduledSourceNode>();

  function ensure(): AudioContext | null {
    if (ctx) return ctx;
    const g = globalThis as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
    const Ctor = g.AudioContext ?? g.webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    master = ctx.createGain();
    master.gain.value = 0.9;
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    sfxBus.connect(master);
    musicBus.connect(master);
    master.connect(comp);
    comp.connect(ctx.destination);
    applyVolumes();
    return ctx;
  }

  function applyVolumes(): void {
    if (!ctx || !sfxBus || !musicBus) return;
    const t = ctx.currentTime;
    sfxBus.gain.setTargetAtTime(sfxOn ? sfxVol : 0, t, 0.02);
    musicBus.gain.setTargetAtTime(musicOn ? musicVol * 0.5 : 0, t, 0.4);
  }

  function tone(freq: number, at: number, dur: number, opts: { type?: OscillatorType; gain?: number; bus?: GainNode | null; attack?: number; detune?: number; glideTo?: number } = {}): void {
    if (!ctx) return;
    const bus = opts.bus ?? sfxBus;
    if (!bus) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, at);
    if (opts.glideTo) osc.frequency.exponentialRampToValueAtTime(opts.glideTo, at + dur);
    if (opts.detune) osc.detune.value = opts.detune;
    const peak = opts.gain ?? 0.2;
    const attack = opts.attack ?? 0.008;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g);
    g.connect(bus);
    osc.start(at);
    osc.stop(at + dur + 0.05);
    live.add(osc);
    osc.onended = () => {
      live.delete(osc);
      osc.disconnect();
      g.disconnect();
    };
  }

  /** A soft bell: a sine with a quiet octave partial. */
  function bell(freq: number, at: number, dur: number, gain: number, bus?: GainNode | null): void {
    tone(freq, at, dur, { gain, bus, attack: 0.01 });
    tone(freq * 2, at, dur * 0.6, { gain: gain * 0.25, bus, attack: 0.01 });
  }

  function play(name: Sfx, step = 0): void {
    if (!sfxOn || sfxVol <= 0) return;
    const c = ensure();
    if (!c || c.state === 'suspended') {
      void c?.resume();
      if (!c) return;
    }
    const t = c.currentTime + 0.01;
    const n = (i: number) => midi(PENTA[Math.max(0, Math.min(PENTA.length - 1, i))]);
    switch (name) {
      case 'tap':
        tone(n(5), t, 0.05, { type: 'triangle', gain: 0.05 });
        break;
      case 'found': {
        const i = Math.min(step, 6);
        bell(n(i), t, 0.45, 0.16);
        bell(n(i + 2), t + 0.09, 0.55, 0.14);
        break;
      }
      case 'bonus':
        [0, 2, 4, 5, 7].forEach((k, i) => bell(n(k + 2), t + i * 0.07, 0.5, 0.12));
        break;
      case 'miss':
        tone(190, t, 0.16, { type: 'sine', gain: 0.1, glideTo: 120 });
        break;
      case 'hint':
        tone(n(6), t, 0.3, { type: 'triangle', gain: 0.08, attack: 0.06 });
        tone(n(8), t + 0.12, 0.35, { type: 'triangle', gain: 0.07, attack: 0.06 });
        break;
      case 'correct':
        bell(n(4), t, 0.4, 0.15);
        bell(n(6), t + 0.08, 0.5, 0.13);
        break;
      case 'wrong':
        tone(220, t, 0.22, { type: 'triangle', gain: 0.09, glideTo: 165 });
        break;
      case 'star':
        bell(n(7), t, 0.6, 0.14);
        break;
      case 'badge':
        [0, 2, 4].forEach((k, i) => bell(n(k + 3), t + i * 0.1, 0.7, 0.13));
        break;
      case 'complete':
        [0, 2, 3, 5, 7].forEach((k, i) => bell(n(k), t + i * 0.11, 0.9, 0.15));
        break;
      case 'levelup':
        [0, 2, 4, 5, 7, 9].forEach((k, i) => bell(n(k), t + i * 0.09, 0.9, 0.14));
        break;
    }
  }

  /* ───────────── ambient music ───────────── */

  function schedulePad(at: number): void {
    if (!ctx || !musicBus) return;
    const chord = CHORDS[chordIndex % CHORDS.length];
    chordIndex++;
    const dur = 9;
    for (const note of chord) {
      for (const detune of [-6, 7]) {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = midi(note);
        osc.detune.value = detune;
        filter.type = 'lowpass';
        filter.frequency.value = 900;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.045, at + 3.5);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur + 2.5);
        osc.connect(filter);
        filter.connect(g);
        g.connect(musicBus);
        osc.start(at);
        osc.stop(at + dur + 2.6);
        live.add(osc);
        osc.onended = () => {
          live.delete(osc);
          osc.disconnect();
          filter.disconnect();
          g.disconnect();
        };
      }
    }
  }

  function tickMusic(): void {
    if (!ctx || !musicOn) return;
    const now = ctx.currentTime;
    while (nextChordAt < now + 1.5) {
      schedulePad(Math.max(nextChordAt, now + 0.05));
      nextChordAt = Math.max(nextChordAt, now) + 9;
    }
    while (nextBellAt < now + 1.5) {
      const note = PENTA[Math.floor(Math.random() * PENTA.length)] + 12;
      bell(midi(note), Math.max(nextBellAt, now + 0.05), 2.6, 0.05, musicBus);
      nextBellAt = Math.max(nextBellAt, now) + 3 + Math.random() * 5;
    }
  }

  function startMusic(): void {
    const c = ensure();
    if (!c || timer) return;
    void c.resume();
    nextChordAt = c.currentTime;
    nextBellAt = c.currentTime + 2;
    timer = setInterval(tickMusic, 500);
    tickMusic();
  }

  function stopMusic(): void {
    if (timer) clearInterval(timer);
    timer = null;
  }

  return {
    unlock() {
      const c = ensure();
      if (c && c.state === 'suspended') void c.resume();
      if (musicOn) startMusic();
    },
    setSfx(enabled, volume) {
      sfxOn = enabled;
      sfxVol = Math.max(0, Math.min(1, volume));
      applyVolumes();
    },
    setMusic(enabled, volume) {
      musicOn = enabled;
      musicVol = Math.max(0, Math.min(1, volume));
      applyVolumes();
      if (enabled && ctx) startMusic();
      if (!enabled) stopMusic();
    },
    play,
    dispose() {
      stopMusic();
      for (const n of live) {
        try {
          n.stop();
        } catch {
          /* already stopped */
        }
      }
      live.clear();
      void ctx?.close();
      ctx = null;
    },
  };
}

/** Short vibration on devices that support it (a no-op elsewhere). */
export function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}
