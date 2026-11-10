import { X } from '@phosphor-icons/react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';

import { BLOCKING_PAUSE_LIMIT, BLOCKING_PAUSE_MINUTES, BLOCKING_PAUSE_UNDO_MINUTES } from '../domain/blocklist';
import {
  CATEGORY_LIMIT,
  type BreakMinutes,
  type Category,
  type FocusMinutes,
  type PomodoroState,
  type ThemeMode,
} from '../domain/models';
import { Segmented, type SegmentedOption } from './Segmented';
import { ThemePicker } from './ThemePicker';

export type SettingsSection = 'blocklist';

const FOCUS_OPTIONS: SegmentedOption<FocusMinutes>[] = [{ value: 25, label: '25 min' }, { value: 50, label: '50 min' }];
const REST_OPTIONS: SegmentedOption<BreakMinutes>[] = [{ value: 10, label: '10 min' }, { value: 20, label: '20 min' }];

interface SettingsPageProps {
  initialSection?: SettingsSection;
  theme: ThemeMode;
  timer: PomodoroState;
  categories: Category[];
  sites: string[];
  sitesMissingAccess: string[];
  pausesUsed: number;
  pausedUntil: number | null;
  onSetTheme: (theme: ThemeMode) => void;
  onSetFocusMinutes: (minutes: FocusMinutes) => void;
  onSetBreakMinutes: (minutes: BreakMinutes) => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
  onAddSite: (site: string) => Promise<boolean>;
  onRemoveSite: (site: string) => void;
  onAllowSites: (sites: string[]) => void;
  onPauseBlocking: () => void;
  onResumeBlocking: () => void;
  backup: ReactNode;
}

type AddResult = boolean | void | Promise<boolean>;

function InlineAddForm({ placeholder, label, disabled, onAdd }: { placeholder: string; label: string; disabled?: boolean; onAdd: (value: string) => AddResult }) {
  const [value, setValue] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    const submitted = value;
    const result = onAdd(submitted);
    if (result instanceof Promise) {
      void result.then((added) => {
        if (added) setValue((current) => current === submitted ? '' : current);
      });
    } else if (result !== false) {
      setValue('');
    }
  }

  return (
    <form className="settings-add" onSubmit={submit}>
      <input value={value} onChange={(event) => setValue(event.target.value)} placeholder={placeholder} aria-label={label} disabled={disabled} autoComplete="off" />
      <button type="submit" className="ink-button" disabled={disabled || !value.trim()}>Add</button>
    </form>
  );
}

export function SettingsPage({
  initialSection,
  theme,
  timer,
  categories,
  sites,
  sitesMissingAccess,
  pausesUsed,
  pausedUntil,
  onSetTheme,
  onSetFocusMinutes,
  onSetBreakMinutes,
  onAddCategory,
  onDeleteCategory,
  onAddSite,
  onRemoveSite,
  onAllowSites,
  onPauseBlocking,
  onResumeBlocking,
  backup,
}: SettingsPageProps) {
  const blocklistRef = useRef<HTMLElement>(null);
  const [now, setNow] = useState(Date.now());
  const pauseActive = Boolean(pausedUntil && pausedUntil > now);
  const remainingPauses = Math.max(0, BLOCKING_PAUSE_LIMIT - pausesUsed);
  const remainingMinutes = pausedUntil ? Math.max(1, Math.ceil((pausedUntil - now) / 60_000)) : 0;
  const pauseStartedAt = pausedUntil ? pausedUntil - BLOCKING_PAUSE_MINUTES * 60_000 : 0;
  const pauseCanBeUndone = pauseActive && now - pauseStartedAt <= BLOCKING_PAUSE_UNDO_MINUTES * 60_000;
  const timerLocked = Boolean(timer.endsAt);

  useEffect(() => {
    if (initialSection === 'blocklist') blocklistRef.current?.scrollIntoView({ block: 'start' });
  }, [initialSection]);

  useEffect(() => {
    if (!pausedUntil || pausedUntil <= Date.now()) return;
    const interval = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(interval);
  }, [pausedUntil]);

  return (
    <section className="list-page settings-page" aria-labelledby="settings-title">
      <header className="list-header">
        <h1 id="settings-title">Settings</h1>
      </header>

      <section className="settings-section" aria-labelledby="settings-appearance">
        <h2 id="settings-appearance">Appearance</h2>
        <ThemePicker value={theme} onChange={onSetTheme} />
      </section>

      <section className="settings-section" aria-labelledby="settings-timer">
        <h2 id="settings-timer">Focus timer</h2>
        <div className="settings-row">
          <span>Focus block</span>
          <Segmented label="Focus block length" value={timer.focusMinutes} options={FOCUS_OPTIONS} onChange={onSetFocusMinutes} disabled={timerLocked} />
        </div>
        <div className="settings-row">
          <span>Rest</span>
          <Segmented label="Rest length" value={timer.breakMinutes} options={REST_OPTIONS} onChange={onSetBreakMinutes} disabled={timerLocked} />
        </div>
        <p className="settings-help">
          {timerLocked ? 'Pause the timer to change lengths. ' : ''}Every 25 focus minutes counts as one session.
        </p>
      </section>

      <section className="settings-section" aria-labelledby="settings-categories">
        <h2 id="settings-categories">
          Categories <span className="mono list-meta">{categories.length} of {CATEGORY_LIMIT}</span>
        </h2>
        <p className="settings-help">Type <span className="mono">#name</span> in any input to tag a task. New tags become categories.</p>
        {categories.length > 0 && (
          <ul className="settings-list">
            {categories.map((category) => (
              <li key={category.id}>
                <span className="chip">{category.name}</span>
                <button type="button" className="icon-button small" onClick={() => onDeleteCategory(category.id)} aria-label={`Delete category ${category.name}`} title="Delete">
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <InlineAddForm
          placeholder={categories.length >= CATEGORY_LIMIT ? 'Five categories is the limit' : 'Category name'}
          label="Category name"
          disabled={categories.length >= CATEGORY_LIMIT}
          onAdd={onAddCategory}
        />
      </section>

      <section ref={blocklistRef} className="settings-section" id="blocklist" aria-labelledby="settings-blocklist">
        <h2 id="settings-blocklist">
          Blocklist <span className="mono list-meta">{sites.length}</span>
        </h2>
        <p className="settings-help">These sites stay out of reach while Today or a due routine still has open work. Chrome asks you once per site.</p>
        {sitesMissingAccess.length > 0 && (
          <p className="settings-help access-note" role="status">
            {sitesMissingAccess.length === 1 ? '1 site isn’t' : `${sitesMissingAccess.length} sites aren’t`} blocked yet — Chrome needs your OK.
            {sitesMissingAccess.length > 1 && (
              <button type="button" className="text-button" onClick={() => onAllowSites(sitesMissingAccess)}>Allow all</button>
            )}
          </p>
        )}
        {sites.length > 0 && (
          <ul className="settings-list">
            {sites.map((site) => (
              <li key={site}>
                <span className="mono">{site}</span>
                {sitesMissingAccess.includes(site) && (
                  <button type="button" className="outline-button small site-allow" onClick={() => onAllowSites([site])} aria-label={`Allow Five to block ${site}`}>
                    Allow
                  </button>
                )}
                <button type="button" className="icon-button small" onClick={() => onRemoveSite(site)} aria-label={`Remove ${site}`} title="Remove">
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <InlineAddForm placeholder="reddit.com" label="Website to block" onAdd={onAddSite} />
        <div className="settings-row pause-row">
          <span>
            Pause blocking
            <span className="mono list-meta" aria-live="polite">{remainingPauses} of {BLOCKING_PAUSE_LIMIT} left today</span>
          </span>
          <button
            type="button"
            className="outline-button"
            onClick={pauseActive ? onResumeBlocking : onPauseBlocking}
            disabled={!pauseActive && remainingPauses === 0}
          >
            {pauseActive
              ? <>{pauseCanBeUndone ? 'Undo pause' : 'Resume blocking'} <span className="mono">{remainingMinutes}m</span></>
              : `Pause ${BLOCKING_PAUSE_MINUTES} min`}
          </button>
        </div>
      </section>

      {backup}
    </section>
  );
}
