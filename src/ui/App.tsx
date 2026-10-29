import { overview } from '../game';
import { AppProvider, useApp, type Route } from './state';
import { Icon, type IconName } from './components/Icon';
import { Toasts } from './components/Toasts';
import { EntryDialog } from './components/WordCard';
import { Home } from './screens/Home';
import { Play } from './screens/Play';
import { Summary } from './screens/Summary';
import { Journal } from './screens/Journal';
import { Review } from './screens/Review';
import { Stats } from './screens/Stats';
import { Achievements } from './screens/Achievements';
import { Journeys } from './screens/Journeys';
import { Practice } from './screens/Practice';
import { Settings } from './screens/Settings';
import { Onboarding } from './screens/Onboarding';
import { n } from './format';

const NAV: Array<{ route: Route; label: string; icon: IconName }> = [
  { route: 'home', label: 'Home', icon: 'home' },
  { route: 'journeys', label: 'Journeys', icon: 'compass' },
  { route: 'journal', label: 'Journal', icon: 'book' },
  { route: 'stats', label: 'Progress', icon: 'chart' },
  { route: 'settings', label: 'Settings', icon: 'gear' },
];

function Screen({ route }: { route: Route }) {
  switch (route) {
    case 'play':
      return <Play />;
    case 'summary':
      return <Summary />;
    case 'journal':
      return <Journal />;
    case 'review':
      return <Review />;
    case 'stats':
      return <Stats />;
    case 'achievements':
      return <Achievements />;
    case 'journeys':
      return <Journeys />;
    case 'practice':
      return <Practice />;
    case 'settings':
      return <Settings />;
    default:
      return <Home />;
  }
}

function Shell() {
  const { save, route, go, busy } = useApp();
  const ov = overview(save, Date.now());
  const immersive = route === 'play';
  const widthClass = route === 'play' ? 'wide' : route === 'review' || route === 'summary' ? 'narrow' : '';
  const current = route === 'achievements' || route === 'practice' ? (route === 'practice' ? 'home' : 'stats') : route;

  return (
    <div className={`app ${immersive ? 'immersive' : ''}`}>
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <header className="topbar">
        <button className="brand" onClick={() => go('home')} aria-label="WordWise home">
          <span className="brand-mark" aria-hidden="true">W</span>
          <span className="brand-name">Word<em>Wise</em></span>
        </button>
        <nav className="topnav" aria-label="Main">
          {NAV.map((i) => (
            <button key={i.route} aria-current={current === i.route ? 'page' : undefined} onClick={() => go(i.route)}>
              {i.label}
            </button>
          ))}
          <button aria-current={route === 'achievements' ? 'page' : undefined} onClick={() => go('achievements')}>Achievements</button>
        </nav>
        <span className="top-spacer" />
        <div className="wallet">
          <span className="pill" title="Rank"><b>{ov.rank.title}</b></span>
          <span className="pill gold" title="Coins" aria-label={`${ov.coins} coins`}>
            <Icon name="coin" size={14} /> <b className="num">{n(ov.coins)}</b>
          </span>
          <button className="btn ghost icon sm" onClick={() => go('achievements')} aria-label="Achievements">
            <Icon name="medal" />
          </button>
        </div>
      </header>

      <main id="main" tabIndex={-1} className={`main ${widthClass}`}>
        <Screen route={route} />
      </main>

      <nav className="tabbar" aria-label="Main">
        {NAV.map((i) => (
          <button key={i.route} aria-current={current === i.route ? 'page' : undefined} onClick={() => go(i.route)}>
            <Icon name={i.icon} />
            <span>{i.label}</span>
            {i.route === 'journal' && ov.due > 0 && <span className="tab-dot" aria-label={`${ov.due} words due`}>{ov.due > 99 ? '99+' : ov.due}</span>}
          </button>
        ))}
      </nav>

      {busy && (
        <div className="scrim" role="status" aria-live="polite">
          <div className="busy"><span className="spinner" /><span>Building your puzzle…</span></div>
        </div>
      )}
      {!save.onboarded && !save.game && <Onboarding />}
      <EntryDialog />
      <Toasts />
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
