import { useApp } from '../state';
import { Icon } from './Icon';

/** Short-lived notices (badges, errors). Screen readers get them through a polite live region. */
export function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="toasts" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          <div className="glyph" aria-hidden="true">
            {t.glyph ?? (t.kind === 'error' ? '!' : '✦')}
          </div>
          <div className="grow">
            <b>{t.kind === 'badge' ? `Badge unlocked: ${t.title}` : t.title}</b>
            {t.body && <span className="small muted">{t.body}</span>}
          </div>
          <button className="x" onClick={() => dismissToast(t.id)} aria-label="Dismiss">
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
