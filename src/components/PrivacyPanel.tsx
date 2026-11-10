import { Check, Eye, ImagesSquare, Pause, Play } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import { PRIVACY_WALLPAPERS } from '../data/privacyWallpapers';
import type { PomodoroState, PrivacyWallpaperId } from '../domain/models';
import { usePomodoroClock } from '../hooks/usePomodoroClock';

interface PrivacyPanelProps {
  wallpaperId: PrivacyWallpaperId;
  timer: PomodoroState;
  onReveal: () => void;
  onSelectWallpaper: (wallpaperId: PrivacyWallpaperId) => void;
  onStartPauseTimer: () => void;
}

const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

function PresentationTimer({ timer, onStartPause }: { timer: PomodoroState; onStartPause: () => void }) {
  const clock = usePomodoroClock(timer);
  if (!clock.started) return null;
  return (
    <button
      type="button"
      className="presentation-timer"
      onClick={onStartPause}
      aria-label={`${clock.running ? 'Pause' : 'Resume'} timer, ${clock.formatted} left`}
    >
      {clock.running ? <Pause size={13} weight="fill" aria-hidden="true" /> : <Play size={13} weight="fill" aria-hidden="true" />}
      <span className="mono">{clock.formatted}</span>
    </button>
  );
}

export function PrivacyPanel({ wallpaperId, timer, onReveal, onSelectWallpaper, onStartPauseTimer }: PrivacyPanelProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const wallpaper = PRIVACY_WALLPAPERS.find((option) => option.id === wallpaperId) ?? PRIVACY_WALLPAPERS[1];

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <section
      className="privacy-panel"
      aria-label="Presentation mode"
      style={{
        backgroundImage: `linear-gradient(180deg, rgb(20 31 39 / 6%), rgb(16 25 30 / 14%)), url('${wallpaper.imagePath}')`,
        backgroundPosition: wallpaper.position,
      }}
    >
      <div className="privacy-controls">
        <button
          type="button"
          className="privacy-button"
          onClick={() => setPickerOpen((open) => !open)}
          aria-label="Choose presentation wallpaper"
          aria-expanded={pickerOpen}
          title="Choose wallpaper"
        >
          <ImagesSquare size={19} />
        </button>
        <button type="button" className="privacy-button" onClick={onReveal} aria-label="Show my list" title="Show my list">
          <Eye size={19} />
        </button>

        {pickerOpen && (
          <div className="privacy-wallpaper-picker" role="group" aria-label="Presentation wallpapers">
            {PRIVACY_WALLPAPERS.map((option) => (
              <button
                type="button"
                key={option.id}
                className={option.id === wallpaper.id ? 'selected' : ''}
                onClick={() => {
                  onSelectWallpaper(option.id);
                  setPickerOpen(false);
                }}
                aria-pressed={option.id === wallpaper.id}
                aria-label={`Use ${option.label} wallpaper`}
                style={{ backgroundImage: `linear-gradient(180deg, transparent, rgb(10 14 15 / 65%)), url('${option.imagePath}')` }}
              >
                <span>{option.label}</span>
                {option.id === wallpaper.id && <Check size={13} weight="bold" />}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="privacy-clock">
        <span className="wordmark" aria-hidden="true">five</span>
        <time className="mono" dateTime={now.toISOString()}>{TIME_FORMATTER.format(now)}</time>
        <span>{DATE_FORMATTER.format(now)}</span>
      </div>
      <a className="privacy-credit" href={wallpaper.sourceUrl} target="_blank" rel="noreferrer">
        {wallpaper.photographer ? `Photo by ${wallpaper.photographer} · Unsplash` : 'Photo from Unsplash'}
      </a>
      <PresentationTimer timer={timer} onStartPause={onStartPauseTimer} />
    </section>
  );
}
