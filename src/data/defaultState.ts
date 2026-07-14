import type { AppState } from '../domain/models';
import { localDateKey } from '../domain/date';
import { reconcileRecurringInstances } from '../domain/recurrence';

export function createDefaultState(date = new Date()): AppState {
  const now = date.getTime();

  return reconcileRecurringInstances({
    schemaVersion: 3,
    categories: [
      { id: 'work', name: 'Work', color: '#d6644a' },
      { id: 'life', name: 'Life', color: '#4d7c68' },
    ],
    tasks: [
      { id: 'welcome-1', title: 'Choose the five things that matter today', bucket: 'today', categoryId: 'work', createdAt: now - 4000 },
      { id: 'welcome-2', title: 'Protect one uninterrupted hour', bucket: 'today', categoryId: 'work', createdAt: now - 3000 },
      { id: 'welcome-3', title: 'Reply to the message you keep postponing', bucket: 'today', categoryId: 'life', createdAt: now - 2000 },
      { id: 'idea-1', title: 'Try a no-coffee experiment', bucket: 'ideas', createdAt: now - 1000 },
      { id: 'idea-2', title: 'Explore breathwork or meditation', bucket: 'ideas', createdAt: now - 900 },
      { id: 'idea-3', title: 'Sketch the calmer task flow', bucket: 'ideas', createdAt: now - 800 },
      { id: 'later-1', title: 'Plan next week without stealing from today', bucket: 'later', categoryId: 'work', createdAt: now },
      { id: 'later-2', title: 'Book the dentist appointment', bucket: 'later', categoryId: 'life', createdAt: now + 1 },
    ],
    recurringTasks: [
      { id: 'routine-water', title: 'Fill a bottle of water', cadence: 'daily', categoryId: 'life', enabled: true, createdAt: now },
      { id: 'routine-plan', title: 'Set tomorrow’s first task', cadence: 'weekdays', categoryId: 'work', enabled: true, createdAt: now + 1 },
    ],
    recurringInstances: [],
    blocklist: ['instagram.com', 'reddit.com'],
    blockingPausedUntil: null,
    blockingPauseDate: localDateKey(date),
    blockingPausesUsed: 0,
    daybookClearedAt: null,
    daybookMinimized: false,
    theme: 'light',
    privacyMode: false,
    privacyWallpaper: 'lonely-road',
    pomodoro: {
      mode: 'focus',
      focusMinutes: 50,
      breakMinutes: 10,
      endsAt: null,
      pausedSeconds: 50 * 60,
      sessionDate: localDateKey(date),
      completedSessionUnits: 0,
    },
  }, date);
}
