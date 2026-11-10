import type { AppState } from '../domain/models';
import { localDateKey } from '../domain/date';
import { reconcileRecurringInstances } from '../domain/recurrence';

export function createDefaultState(date = new Date()): AppState {
  const now = date.getTime();
  const day = 86_400_000;

  return reconcileRecurringInstances({
    schemaVersion: 4,
    categories: [
      { id: 'work', name: 'Work', color: '#d6644a' },
      { id: 'life', name: 'Life', color: '#4d7c68' },
    ],
    tasks: [
      { id: 'welcome-1', title: 'Choose the five things that matter today', bucket: 'today', categoryId: 'work', createdAt: now - 4000, order: 0 },
      { id: 'welcome-2', title: 'Protect one uninterrupted hour', bucket: 'today', categoryId: 'work', createdAt: now - 3000, order: 1 },
      { id: 'welcome-3', title: 'Reply to the message you keep postponing', bucket: 'today', categoryId: 'life', createdAt: now - 2000, order: 2 },
      { id: 'idea-1', title: 'Try a no-coffee experiment', bucket: 'ideas', createdAt: now - 12 * day, order: 0 },
      { id: 'idea-2', title: 'Explore breathwork or meditation', bucket: 'ideas', createdAt: now - 3 * day, order: 1 },
      { id: 'idea-3', title: 'Sketch the calmer task flow', bucket: 'ideas', createdAt: now - 800, order: 2 },
      { id: 'later-1', title: 'Plan next week without stealing from today', bucket: 'later', categoryId: 'work', createdAt: now, order: 0 },
      { id: 'later-2', title: 'Book the dentist appointment', bucket: 'later', categoryId: 'life', createdAt: now + 1, order: 1 },
    ],
    recurringTasks: [
      { id: 'routine-water', title: 'Fill a bottle of water', cadence: 'daily', categoryId: 'life', enabled: true, createdAt: now },
      { id: 'routine-plan', title: 'Set tomorrow’s first task', cadence: 'weekdays', categoryId: 'work', enabled: true, createdAt: now + 1 },
    ],
    recurringInstances: [],
    nowTaskId: null,
    dailyNote: { date: localDateKey(date), text: '' },
    blocklist: ['instagram.com', 'reddit.com'],
    blockingPausedUntil: null,
    blockingPauseDate: localDateKey(date),
    blockingPausesUsed: 0,
    theme: 'system',
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
