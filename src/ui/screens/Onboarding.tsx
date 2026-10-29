import { useState } from 'react';
import { completeOnboarding } from '../../game';
import { useApp } from '../state';
import { Icon } from '../components/Icon';

const PAGES = [
  {
    eyebrow: 'Welcome to WordWise',
    title: 'Find words. Expand your world.',
    body: 'Every puzzle is a fresh word search built around real ideas: psychology, money, science, history, technology and more. Every word you find comes with what it means, an example, and why it matters.',
  },
  {
    eyebrow: 'How to play',
    title: 'Swipe, tap, or type',
    body: 'Drag from the first letter of a word to its last, in any of eight directions, forwards or backwards. Prefer tapping? Tap the first letter, then the last. With a keyboard, use the arrow keys and press Enter at each end.',
  },
  {
    eyebrow: 'Learn as you go',
    title: 'Nothing here rewards speed',
    body: 'Take your time. A short Fact Challenge after each puzzle locks in what you found, your Journal keeps every word, and Smart Review brings words back right when you would otherwise forget them.',
  },
];

export function Onboarding() {
  const { update, startCampaign, go } = useApp();
  const [i, setI] = useState(0);
  const page = PAGES[i];
  const last = i === PAGES.length - 1;
  return (
    <div className="onboard" role="dialog" aria-modal="true" aria-label="Welcome">
      <div className="onboard-card">
        <div className="onboard-mark" aria-hidden="true">W</div>
        <span className="eyebrow">{page.eyebrow}</span>
        <h1>{page.title}</h1>
        <p className="muted">{page.body}</p>
        <div className="dots-nav" aria-hidden="true">
          {PAGES.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          {i > 0 && <button className="btn" onClick={() => setI(i - 1)}>Back</button>}
          {!last ? (
            <button className="btn primary" onClick={() => setI(i + 1)} autoFocus>
              Next <Icon name="chevron" size={16} />
            </button>
          ) : (
            <button
              className="btn primary lg"
              autoFocus
              onClick={() => {
                update((s, now) => completeOnboarding(s, now));
                startCampaign();
              }}
            >
              <Icon name="play" /> Play level 1
            </button>
          )}
        </div>
        {!last && (
          <button className="btn ghost sm" onClick={() => { update((s, now) => completeOnboarding(s, now)); go('home'); }}>
            Skip the tour
          </button>
        )}
      </div>
    </div>
  );
}
