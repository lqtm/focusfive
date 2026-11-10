import { Play } from '@phosphor-icons/react';

import type { PomodoroState } from '../domain/models';
import { usePomodoroClock } from '../hooks/usePomodoroClock';

interface NowTimerButtonProps {
  timer: PomodoroState;
  onStart: () => void;
}

export function NowTimerButton({ timer, onStart }: NowTimerButtonProps) {
  const clock = usePomodoroClock(timer);
  const resting = timer.mode === 'break';
  const label = clock.running
    ? resting ? 'Resting' : 'Focusing'
    : clock.started ? 'Resume' : resting ? 'Rest' : 'Start';
  const description = clock.running
    ? `Open focus mode, ${clock.formatted} left`
    : `${label} ${resting ? 'rest' : 'focus'} timer, ${clock.formatted}`;

  return (
    <button type="button" className="start-button" onClick={onStart} aria-label={description}>
      {clock.running ? <i className="running-dot" aria-hidden="true" /> : <Play size={13} weight="fill" aria-hidden="true" />}
      <span>{label}</span>
      <span className="mono">{clock.formatted}</span>
    </button>
  );
}
