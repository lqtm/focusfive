import { ArrowsClockwise, Pause, Play, Timer } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import type { BreakMinutes, FocusMinutes, PomodoroMode, PomodoroState } from '../domain/models';

interface PomodoroProps {
  timer: PomodoroState;
  onStartPause: () => void;
  onReset: (mode?: PomodoroMode) => void;
  onComplete: () => void;
  onSetFocusMinutes: (minutes: FocusMinutes) => void;
  onSetBreakMinutes: (minutes: BreakMinutes) => void;
}

const focusOptions: FocusMinutes[] = [25, 50];
const breakOptions: BreakMinutes[] = [10, 20];

export function Pomodoro({
  timer,
  onStartPause,
  onReset,
  onComplete,
  onSetFocusMinutes,
  onSetBreakMinutes,
}: PomodoroProps) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setNow(Date.now());
    if (!timer.endsAt) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [timer.endsAt]);

  useEffect(() => {
    if (timer.endsAt && timer.endsAt <= now) onComplete();
  }, [now, onComplete, timer.endsAt]);

  const seconds = timer.endsAt ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : timer.pausedSeconds;
  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <aside className={open ? 'pomodoro open' : 'pomodoro'}>
      {open && (
        <div className="pomodoro-panel">
          <header>
            <span>{timer.mode === 'focus' ? 'FOCUS SESSION' : 'REST'}</span>
            <button onClick={() => setOpen(false)} aria-label="Collapse timer">Close</button>
          </header>

          <strong className="timer-display">{formatted}</strong>

          <div className="timer-presets">
            <div>
              <span>Focus</span>
              <div className="preset-options">
                {focusOptions.map((minutes) => (
                  <button
                    key={minutes}
                    className={timer.focusMinutes === minutes ? 'selected' : ''}
                    onClick={() => onSetFocusMinutes(minutes)}
                    disabled={Boolean(timer.endsAt)}
                    aria-pressed={timer.focusMinutes === minutes}
                  >{minutes}m</button>
                ))}
              </div>
            </div>
            <div>
              <span>Rest</span>
              <div className="preset-options">
                {breakOptions.map((minutes) => (
                  <button
                    key={minutes}
                    className={timer.breakMinutes === minutes ? 'selected' : ''}
                    onClick={() => onSetBreakMinutes(minutes)}
                    disabled={Boolean(timer.endsAt)}
                    aria-pressed={timer.breakMinutes === minutes}
                  >{minutes}m</button>
                ))}
              </div>
            </div>
          </div>

          <div className="session-score">
            <strong>{timer.completedSessionUnits}</strong>
            <span>sessions today<small>25 focus minutes = 1</small></span>
          </div>

          <div className="pomodoro-actions">
            <button className="timer-primary" onClick={onStartPause}>{timer.endsAt ? <Pause size={17} /> : <Play size={17} />}{timer.endsAt ? 'Pause' : 'Start'}</button>
            <button onClick={() => onReset()} aria-label="Reset timer" data-tooltip="Reset timer"><ArrowsClockwise size={17} /></button>
          </div>
        </div>
      )}
      <button className="pomodoro-trigger" onClick={() => setOpen((value) => !value)} aria-label={`${open ? 'Close' : 'Open'} Pomodoro timer`} data-tooltip={`${open ? 'Close' : 'Open'} timer`}>
        <Timer size={19} />
        <span>{formatted}</span>
        <b>{timer.completedSessionUnits} today</b>
      </button>
    </aside>
  );
}
