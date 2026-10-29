import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/game.css';
import './styles/screens.css';

const el = document.getElementById('root');
if (el) createRoot(el).render(<App />);
