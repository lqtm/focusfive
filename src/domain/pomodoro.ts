import { localDateKey } from './date';
import type { AppState, PomodoroState } from './models';

export const SESSION_MINUTES = 25;

export function normalizePomodoroDay(timer: PomodoroState, date = new Date()): PomodoroState {
  const today = localDateKey(date);
  if (timer.sessionDate === today) return timer;
  return { ...timer, sessionDate: today, completedSessionUnits: 0 };
}

export function completePomodoroPhase(state: AppState, now = Date.now()): AppState {
  const timer = normalizePomodoroDay(state.pomodoro, new Date(now));
  if (!timer.endsAt || timer.endsAt > now) {
    return timer === state.pomodoro ? state : { ...state, pomodoro: timer };
  }

  const nextMode = timer.mode === 'focus' ? 'break' : 'focus';
  const nextMinutes = nextMode === 'focus' ? timer.focusMinutes : timer.breakMinutes;
  const completedSessionUnits = timer.mode === 'focus'
    ? timer.completedSessionUnits + (timer.focusMinutes / SESSION_MINUTES)
    : timer.completedSessionUnits;

  return {
    ...state,
    pomodoro: {
      ...timer,
      mode: nextMode,
      endsAt: null,
      pausedSeconds: nextMinutes * 60,
      completedSessionUnits,
    },
  };
}
