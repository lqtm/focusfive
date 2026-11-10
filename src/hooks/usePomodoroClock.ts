import { useEffect, useState } from 'react';

import { formatClock } from '../domain/date';
import type { PomodoroState } from '../domain/models';

export interface PomodoroClock {
  seconds: number;
  totalSeconds: number;
  running: boolean;
  /** True once the current phase has been started and not reset. */
  started: boolean;
  formatted: string;
  progress: number;
}

export function usePomodoroClock(timer: PomodoroState, tickMs = 1000): PomodoroClock {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    setNow(Date.now());
    if (!timer.endsAt) return;
    const interval = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(interval);
  }, [tickMs, timer.endsAt]);

  const totalSeconds = (timer.mode === 'focus' ? timer.focusMinutes : timer.breakMinutes) * 60;
  const seconds = timer.endsAt ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : timer.pausedSeconds;
  return {
    seconds,
    totalSeconds,
    running: Boolean(timer.endsAt),
    started: Boolean(timer.endsAt) || timer.pausedSeconds < totalSeconds,
    formatted: formatClock(seconds),
    progress: totalSeconds ? Math.min(1, Math.max(0, 1 - seconds / totalSeconds)) : 0,
  };
}

/** Completes the phase when it runs out while a tab is open; the service worker covers closed tabs. */
export function usePomodoroCompletion(timer: PomodoroState | null, onComplete: () => void): void {
  const endsAt = timer?.endsAt ?? null;
  useEffect(() => {
    if (!endsAt) return;
    const timeout = window.setTimeout(onComplete, Math.max(0, endsAt - Date.now()) + 50);
    return () => window.clearTimeout(timeout);
  }, [endsAt, onComplete]);
}
