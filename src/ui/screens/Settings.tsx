import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getCategories, isBuiltinCategory, listPacks } from '../../content';
import {
  GRID_THEMES,
  HIGHLIGHT_STYLES,
  MOTION_PREFS,
  TEXT_SIZES,
  THEME_MODES,
  addPack,
  exportSave,
  importSave,
  isUnlocked,
  rankFor,
  removePack,
  resetSave,
  type Settings as SettingsData,
  type Unlockable,
} from '../../game';
import { useApp } from '../state';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';

function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="switch">
      <span className="t">
        <span>{label}</span>
        {hint && <span className="small muted">{hint}</span>}
      </span>
      <button className="toggle" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />
    </div>
  );
}

function Section({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return (
    <section className="card stack">
      <div>
        <h2>{title}</h2>
        {note && <p className="small muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function Swatch({ item, kind, selected, unlocked, onPick }: { item: Unlockable; kind: 'grid' | 'hl'; selected: boolean; unlocked: boolean; onPick: () => void }) {
  return (
    <button className={`swatch ${selected ? 'on' : ''}`} onClick={onPick} disabled={!unlocked} aria-pressed={selected} aria-label={`${item.name}${unlocked ? '' : ' (locked)'}`}>
      <span className="board mini" data-grid={kind === 'grid' ? item.id : 'ivory'} data-hl={kind === 'hl' ? item.id : 'capsule'}>
        <svg viewBox="0 0 5 3" aria-hidden="true">
          {kind === 'hl' ? (
            <g style={{ ['--hi' as string]: 'var(--h0)' }} className="mark">
              {item.id === 'underline' && <rect x="0.4" y="1.85" width="4.2" height="0.14" className="m-solid" />}
              {item.id === 'outline' && <rect x="0.4" y="0.9" width="4.2" height="1.2" rx="0.25" className="m-stroke" />}
              {item.id === 'marker' && <rect x="0.4" y="0.95" width="4.2" height="1.1" rx="0.12" className="m-fill" />}
              {item.id === 'capsule' && <rect x="0.4" y="0.95" width="4.2" height="1.1" rx="0.55" className="m-capsule" />}
              {item.id === 'glow' && <rect x="0.4" y="0.95" width="4.2" height="1.1" rx="0.55" className="m-glow" />}
            </g>
          ) : null}
          <text x="0.5" y="2.05" fontSize="1.25" fill="currentColor" fontFamily="Georgia, serif" fontWeight="700">WORD</text>
        </svg>
        {!unlocked && <span className="lock"><Icon name="lock" size={16} /></span>}
      </span>
      <span className="swatch-name">{item.name}</span>
      <span className="tiny faint">{unlocked ? item.blurb : `Reach rank ${item.rank + 1}`}</span>
    </button>
  );
}

export function Settings() {
  const { save, set, update, replaceSave, resetStore, toast, sound } = useApp();
  const s: SettingsData = save.settings;
  const xp = save.stats.xp;
  const [confirmReset, setConfirmReset] = useState(false);
  const [dialog, setDialog] = useState<null | 'export' | 'import'>(null);
  const [importText, setImportText] = useState('');
  const exportRef = useRef<HTMLTextAreaElement>(null);
  const [keepSettings, setKeepSettings] = useState(true);
  const [packText, setPackText] = useState('');
  const [packMsg, setPackMsg] = useState<{ ok: boolean; lines: string[] } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const packRef = useRef<HTMLInputElement>(null);
  const cats = getCategories();
  const packs = listPacks();
  const enabled = s.enabledCategories ?? cats.map((c) => c.id);

  // Embedded viewers (the artifact build) block file downloads, so there the export is copy-and-paste only.
  const download = __WW_EMBEDDED__
    ? () => {}
    : (name: string, text: string) => {
        const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      };

  const stamp = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const copyExport = async () => {
    const text = exportSave(save);
    try {
      await navigator.clipboard.writeText(text);
      toast({ kind: 'info', title: 'Copied', body: 'Paste it into a note or file to keep your progress.' });
    } catch {
      exportRef.current?.focus();
      exportRef.current?.select();
      toast({ kind: 'info', title: 'Select and copy', body: 'Your browser blocked automatic copying: the text is selected, press Ctrl/Cmd+C.' });
    }
  };

  const doImport = (text: string) => {
    const res = importSave(text);
    if (!res.ok) {
      toast({ kind: 'error', title: 'Could not import', body: res.error });
      return;
    }
    replaceSave(res.save, { backup: true });
    setDialog(null);
    setImportText('');
    toast({ kind: 'info', title: 'Progress imported', body: `${Object.keys(res.save.words).length} words in your journal.` });
  };

  const onImport = async (file: File | undefined) => {
    if (file) doImport(await file.text());
  };

  const installPack = (text: string) => {
    const box: { msg: { ok: boolean; lines: string[] } | null } = { msg: null };
    update((sv, now) => {
      const out = addPack(sv, text, now);
      box.msg = out.result.ok
        ? { ok: true, lines: [`Installed “${out.result.category!.name}” with ${out.result.category!.entries.length} words.`, ...out.result.warnings] }
        : { ok: false, lines: out.result.problems.slice(0, 12) };
      return out.save;
    });
    setPackMsg(box.msg);
    if (box.msg?.ok) setPackText('');
  };

  const toggleCategory = (id: string) => {
    const next = enabled.includes(id) ? enabled.filter((x) => x !== id) : [...enabled, id];
    if (next.length === 0) return;
    set({ enabledCategories: next.length === cats.length ? null : next });
  };

  return (
    <div className="stack-lg">
      <header className="page-head">
        <span className="eyebrow">Settings</span>
        <h1>Make it yours</h1>
      </header>

      <Section title="Appearance">
        <div className="setting stack-sm">
          <span className="label">Theme</span>
          <div className="seg" role="group" aria-label="Theme">
            {THEME_MODES.map((m) => <button key={m} aria-pressed={s.theme === m} onClick={() => set({ theme: m })}>{cap(m)}</button>)}
          </div>
        </div>
        <div className="setting stack-sm">
          <span className="label">Text size</span>
          <div className="seg" role="group" aria-label="Text size">
            {TEXT_SIZES.map((m) => <button key={m} aria-pressed={s.textSize === m} onClick={() => set({ textSize: m })}>{m === 'xlarge' ? 'Largest' : cap(m)}</button>)}
          </div>
        </div>
        <Toggle on={s.highContrast} onChange={(v) => set({ highContrast: v })} label="High contrast" hint="Stronger borders and text for easier reading." />
        <Toggle on={s.plainFont} onChange={(v) => set({ plainFont: v })} label="Plain font" hint="Use a clean sans-serif everywhere instead of the editorial serif." />
        <div className="setting stack-sm">
          <span className="label">Motion</span>
          <div className="seg" role="group" aria-label="Motion">
            {MOTION_PREFS.map((m) => <button key={m} aria-pressed={s.motion === m} onClick={() => set({ motion: m })}>{m === 'system' ? 'Follow device' : m === 'reduce' ? 'Reduced' : 'Full'}</button>)}
          </div>
        </div>
      </Section>

      <Section title="The board" note="New styles unlock as you rank up.">
        <div className="setting stack-sm">
          <span className="label">Grid theme</span>
          <div className="swatches">
            {GRID_THEMES.map((g) => <Swatch key={g.id} item={g} kind="grid" selected={s.gridTheme === g.id} unlocked={isUnlocked(g, xp)} onPick={() => set({ gridTheme: g.id })} />)}
          </div>
        </div>
        <div className="setting stack-sm">
          <span className="label">Highlight style</span>
          <div className="swatches">
            {HIGHLIGHT_STYLES.map((g) => <Swatch key={g.id} item={g} kind="hl" selected={s.highlightStyle === g.id} unlocked={isUnlocked(g, xp)} onPick={() => set({ highlightStyle: g.id })} />)}
          </div>
        </div>
        <p className="tiny faint">Current rank: {rankFor(xp).title}.</p>
      </Section>

      <Section title="Play">
        <Toggle on={s.showTimer} onChange={(v) => set({ showTimer: v })} label="Show the timer" hint="Off by default. Nothing in WordWise rewards speed." />
        <Toggle on={s.focusMode} onChange={(v) => set({ focusMode: v })} label="Focus mode" hint="Hides the timer, pop-up cards and score chrome during puzzles." />
        <Toggle on={s.learnToasts} onChange={(v) => set({ learnToasts: v })} label="Learn as you find" hint="Show a short meaning card the moment you find a word." />
        <Toggle on={s.expertTimed} onChange={(v) => set({ expertTimed: v })} label="Expert Challenges are timed" hint="With a generous clock. Turn off for an untimed version." />
        <Toggle on={s.haptics} onChange={(v) => set({ haptics: v })} label="Vibration feedback" hint="On devices that support it." />
      </Section>

      <Section title="Sound">
        <Toggle on={s.sound} onChange={(v) => set({ sound: v })} label="Sound effects" />
        <div className="field">
          <label htmlFor="sfxv">Effects volume</label>
          <input id="sfxv" className="range" type="range" min="0" max="1" step="0.05" value={s.sfxVolume} disabled={!s.sound}
            onChange={(e) => set({ sfxVolume: Number(e.target.value) })} onPointerUp={() => sound('found')} />
        </div>
        <Toggle on={s.music} onChange={(v) => set({ music: v })} label="Ambient music" hint="A slow, generated background pad. Off by default." />
        <div className="field">
          <label htmlFor="musv">Music volume</label>
          <input id="musv" className="range" type="range" min="0" max="1" step="0.05" value={s.musicVolume} disabled={!s.music}
            onChange={(e) => set({ musicVolume: Number(e.target.value) })} />
        </div>
      </Section>

      <Section title="Subjects in the campaign" note="Choose which subjects your levels rotate through. Practice and Journeys can still use any.">
        <div className="chips">
          {cats.map((c) => (
            <button key={c.id} className="chip" aria-pressed={enabled.includes(c.id)} onClick={() => toggleCategory(c.id)}>
              <span aria-hidden="true">{c.glyph}</span> {c.shortName}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Content packs" note="Add your own verified word collections. A pack is a JSON file; the README describes the format and the review fields.">
        {packs.length > 0 && (
          <ul className="stack-sm">
            {packs.map((p) => (
              <li key={p.id} className="row between">
                <span>
                  <b>{p.name}</b> <span className="small muted">{p.entries.length} words · {p.entries.every((e) => e.status === 'verified') ? 'verified' : 'draft'}</span>
                </span>
                {!isBuiltinCategory(p.id) && <button className="btn sm danger" onClick={() => update((sv, now) => removePack(sv, p.id, now))}>Remove</button>}
              </li>
            ))}
          </ul>
        )}
        <div className="field">
          <label htmlFor="pack">Paste pack JSON</label>
          <textarea id="pack" className="input" value={packText} onChange={(e) => setPackText(e.target.value)} placeholder={'{ "format": "wordwise-pack", "version": 1, "category": { … } }'} spellCheck={false} />
        </div>
        <div className="row">
          <button className="btn primary sm" disabled={!packText.trim()} onClick={() => installPack(packText)}>Install pack</button>
          <button className="btn sm" onClick={() => packRef.current?.click()}><Icon name="upload" /> From file</button>
          <input ref={packRef} type="file" accept="application/json,.json" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) installPack(await f.text()); }} />
        </div>
        {packMsg && (
          <div className={`banner ${packMsg.ok ? '' : 'bad'}`} role="status">
            <ul>{packMsg.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
          </div>
        )}
      </Section>

      <Section title="Your data" note="Everything is stored only in this browser. Export a backup now and then, especially before clearing browser data.">
        <div className="row">
          <button className="btn" onClick={() => setDialog('export')}><Icon name="download" /> Export progress</button>
          <button className="btn" onClick={() => setDialog('import')}><Icon name="upload" /> Import progress</button>
          <button className="btn danger" onClick={() => setConfirmReset(true)}><Icon name="trash" /> Reset…</button>
        </div>
      </Section>

      <p className="tiny faint center">WordWise · content v{save.contentVersion} · all word entries are drafts awaiting editorial review.</p>

      {dialog === 'export' && (
        <Modal
          title="Export your progress"
          onClose={() => setDialog(null)}
          wide
          actions={
            <>
              {!__WW_EMBEDDED__ && (
                <button className="btn" onClick={() => download(`wordwise-${stamp()}.json`, exportSave(save))}><Icon name="download" /> Download file</button>
              )}
              <button className="btn primary" onClick={copyExport}>Copy to clipboard</button>
            </>
          }
        >
          <p className="muted small">
            {__WW_EMBEDDED__
              ? 'This is your whole journal as text. Copy it into a note or a file; to restore it later, paste it into Import progress.'
              : 'This is your whole journal as text. Download it, or copy it into a note: some browsers and embedded views block file downloads, and copying always works.'}
          </p>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="export-text">Progress data</label>
            <textarea id="export-text" ref={exportRef} className="input" readOnly value={exportSave(save)} onFocus={(e) => e.target.select()} style={{ minHeight: 180 }} />
          </div>
        </Modal>
      )}
      {dialog === 'import' && (
        <Modal
          title="Import progress"
          onClose={() => setDialog(null)}
          wide
          actions={
            <>
              <button className="btn" onClick={() => importRef.current?.click()}><Icon name="upload" /> Choose a file</button>
              <button className="btn primary" disabled={!importText.trim()} onClick={() => doImport(importText)}>Import pasted text</button>
            </>
          }
        >
          <p className="muted small">Importing replaces the progress in this browser with the file’s contents. Export first if you want to keep the current progress.</p>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="import-text">Paste exported data</label>
            <textarea id="import-text" className="input" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={'{ "app": "wordwise", … }'} spellCheck={false} style={{ minHeight: 160 }} />
          </div>
          <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void onImport(f); }} />
        </Modal>
      )}

      {confirmReset && (
        <Modal
          title="Reset all progress?"
          onClose={() => setConfirmReset(false)}
          actions={
            <>
              <button className="btn" onClick={() => setConfirmReset(false)}>Cancel</button>
              <button
                className="btn danger"
                onClick={() => {
                  replaceSave(resetSave(resetStore(), keepSettings ? s : null));
                  setConfirmReset(false);
                  toast({ kind: 'info', title: 'Progress reset' });
                }}
              >
                Erase everything
              </button>
            </>
          }
        >
          <p className="muted">This permanently removes your journal, stars, streaks, badges and imported packs from this browser. Export first if you might want them back.</p>
          <div className="switch">
            <span className="t"><span>Keep my settings</span></span>
            <button className="toggle" role="switch" aria-checked={keepSettings} aria-label="Keep my settings" onClick={() => setKeepSettings(!keepSettings)} />
          </div>
        </Modal>
      )}
    </div>
  );
}
