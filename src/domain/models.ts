export const TODAY_LIMIT = 5;
export const RECURRING_LIMIT = 5;
export const CATEGORY_LIMIT = 5;
export const PRIVACY_WALLPAPER_IDS = [
  'misty-lake',
  'lonely-road',
  'wanderlust',
  'forest-bend',
  'sunset-road',
  'open-country',
] as const;

export type TabId = 'today' | 'later' | 'ideas' | 'recurring';
export type ThemeMode = 'light' | 'dark';
export type PrivacyWallpaperId = typeof PRIVACY_WALLPAPER_IDS[number];
export type TaskBucket = 'today' | 'later' | 'ideas';
export type RecurrenceCadence = 'daily' | 'weekdays' | 'weekly';
export type PomodoroMode = 'focus' | 'break';
export type FocusMinutes = 25 | 50;
export type BreakMinutes = 10 | 20;

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  bucket: TaskBucket;
  categoryId?: string;
  createdAt: number;
  order?: number;
  completedAt?: number;
}

export interface RecurringTask {
  id: string;
  title: string;
  cadence: RecurrenceCadence;
  categoryId?: string;
  weekday?: number;
  enabled: boolean;
  createdAt: number;
}

export interface RecurringInstance {
  id: string;
  recurringTaskId: string;
  title: string;
  categoryId?: string;
  dueOn: string;
  completedAt?: number;
}

export interface PomodoroState {
  mode: PomodoroMode;
  focusMinutes: FocusMinutes;
  breakMinutes: BreakMinutes;
  endsAt: number | null;
  pausedSeconds: number;
  sessionDate: string;
  completedSessionUnits: number;
}

export interface AppState {
  schemaVersion: 3;
  tasks: Task[];
  recurringTasks: RecurringTask[];
  recurringInstances: RecurringInstance[];
  categories: Category[];
  blocklist: string[];
  blockingPausedUntil: number | null;
  blockingPauseDate: string;
  blockingPausesUsed: number;
  daybookClearedAt: number | null;
  daybookMinimized: boolean;
  theme: ThemeMode;
  privacyMode: boolean;
  privacyWallpaper: PrivacyWallpaperId;
  pomodoro: PomodoroState;
}

export interface AppNotice {
  id: number;
  message: string;
}
