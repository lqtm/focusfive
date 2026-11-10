import { useRef, type KeyboardEvent } from 'react';

import type { ThemeMode } from '../domain/models';

interface ThemeOption {
  id: ThemeMode;
  label: string;
  note: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'system', label: 'System', note: 'Follows your OS' },
  { id: 'light', label: 'Light', note: 'Plain' },
  { id: 'dark', label: 'Dark', note: 'Plain' },
  { id: 'paper', label: 'Paper', note: 'Warm grain' },
  { id: 'dots', label: 'Dot grid', note: 'Notebook' },
  { id: 'blueprint', label: 'Blueprint', note: 'Drafting grid' },
  { id: 'dusk', label: 'Dusk', note: 'Ember glass' },
  { id: 'brutal', label: 'Brutal', note: 'Concrete' },
  { id: 'acid', label: 'Acid', note: 'Brutal, at night' },
];

function SwatchArt() {
  return (
    <>
      <span className="swatch-card">
        <span className="swatch-title" />
        <span className="swatch-meta"><i /> <span /></span>
        <span className="swatch-start" />
      </span>
      <span className="swatch-row" />
      <span className="swatch-row short" />
    </>
  );
}

interface ThemePickerProps {
  value: ThemeMode;
  onChange: (theme: ThemeMode) => void;
}

export function ThemePicker({ value, onChange }: ThemePickerProps) {
  const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, THEME_OPTIONS.findIndex((option) => option.id === value));

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const columns = Math.max(1, Math.round((event.currentTarget.parentElement?.clientWidth ?? 0) / event.currentTarget.offsetWidth));
    const steps: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns };
    if (!(event.key in steps)) return;
    event.preventDefault();
    const next = Math.min(THEME_OPTIONS.length - 1, Math.max(0, index + steps[event.key]));
    onChange(THEME_OPTIONS[next].id);
    tileRefs.current[next]?.focus();
  }

  return (
    <div className="theme-picker" role="radiogroup" aria-label="Theme">
      {THEME_OPTIONS.map((option, index) => {
        const selected = index === selectedIndex;
        return (
          <button
            key={option.id}
            ref={(node) => { tileRefs.current[index] = node; }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={selected ? 'theme-tile selected' : 'theme-tile'}
            onClick={() => onChange(option.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {option.id === 'system' ? (
              <span className="theme-swatch split" aria-hidden="true">
                <span className="swatch-half" data-theme="light"><SwatchArt /></span>
                <span className="swatch-half" data-theme="dark"><SwatchArt /></span>
              </span>
            ) : (
              <span className="theme-swatch" data-theme={option.id} aria-hidden="true"><SwatchArt /></span>
            )}
            <span className="theme-label">
              {option.label}
              <span className="theme-note">{option.note}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
