import { useEffect, useRef } from 'react';

import { TODAY_LIMIT, type Category, type PomodoroState, type Task } from '../domain/models';
import { usePomodoroClock } from '../hooks/usePomodoroClock';

interface FocusModeProps {
  task?: Task;
  slot: number;
  category?: Category;
  nextTask?: Task;
  timer: PomodoroState;
  blockStatus: string;
  onStartPause: () => void;
  onDone: () => void;
  onSwitch: () => void;
  onSkipRest: () => void;
  onExit: () => void;
}

export function FocusMode({ task, slot, category, nextTask, timer, blockStatus, onStartPause, onDone, onSwitch, onSkipRest, onExit }: FocusModeProps) {
  const clock = usePomodoroClock(timer, 250);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const resting = timer.mode === 'break';

  useEffect(() => {
    primaryRef.current?.focus();
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${clock.formatted} · ${resting ? 'Rest' : task?.title ?? 'Focus'}`;
    return () => { document.title = previousTitle; };
  }, [clock.formatted, resting, task?.title]);

  const primaryLabel = clock.running ? 'Pause' : clock.started ? 'Resume' : resting ? 'Start rest' : 'Start';

  return (
    <section className="focus-mode" role="region" aria-label="Focus mode">
      <button type="button" className="focus-exit" onClick={onExit}>
        Exit focus <span className="mono" aria-hidden="true">· Esc</span>
      </button>

      <div className="focus-center">
        <p className="mono focus-meta">
          <i className="accent-dot" aria-hidden="true" />
          {resting
            ? 'Rest'
            : task
              ? `${String(slot).padStart(2, '0')} of ${String(TODAY_LIMIT).padStart(2, '0')}${category ? ` · ${category.name}` : ''}`
              : 'Nothing open'}
        </p>
        <h1 className="focus-title" aria-live="polite">{task ? task.title : 'Today is clear.'}</h1>
        {task?.hint && <p className="focus-hint">{task.hint}</p>}
        <p className="mono focus-timer" role="timer" aria-label={`${clock.formatted} ${resting ? 'rest' : 'focus'} remaining`}>
          {clock.formatted}
        </p>
        <div
          className="focus-progress"
          role="progressbar"
          aria-label={resting ? 'Rest progress' : 'Focus progress'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(clock.progress * 100)}
        >
          <i style={{ transform: `scaleX(${clock.progress})` }} />
        </div>
        <div className="focus-actions">
          <button ref={primaryRef} type="button" className="focus-button outline" onClick={onStartPause}>{primaryLabel}</button>
          <button type="button" className="focus-button filled" onClick={onDone} disabled={!task}>Done</button>
          {resting
            ? <button type="button" className="focus-button outline" onClick={onSkipRest}>Skip rest</button>
            : <button type="button" className="focus-button outline" onClick={onSwitch} disabled={!nextTask}>Switch task</button>}
        </div>
      </div>

      <footer className="focus-footer">
        <span>{nextTask ? <>Next up: {nextTask.title}</> : 'Nothing else open'}</span>
        <span className="mono">{blockStatus}</span>
      </footer>
    </section>
  );
}
