import { createDefaultState } from './defaultState';
import {
  PRIVACY_WALLPAPER_IDS,
  THEME_IDS,
  type AppState,
  type DailyNote,
  type PomodoroState,
  type PrivacyWallpaperId,
  type ThemeMode,
} from '../domain/models';
import { BLOCKING_PAUSE_LIMIT, normalizeBlocklist } from '../domain/blocklist';
import { localDateKey } from '../domain/date';
import { normalizePomodoroDay } from '../domain/pomodoro';
import { reconcileRecurringInstances } from '../domain/recurrence';

export const STORAGE_KEY = 'fiveState';

const STATE_LOCK = 'five-state-update';
const hasChromeStorage = typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
let fallbackLock = Promise.resolve();

function freshDefaultState(): AppState {
  return createDefaultState();
}

type StoredState = Omit<Partial<AppState>, 'schemaVersion' | 'pomodoro' | 'theme' | 'dailyNote'> & {
  schemaVersion?: number;
  pomodoro?: Partial<PomodoroState>;
  theme?: unknown;
  dailyNote?: Partial<DailyNote>;
  /** Retired in schema 4. */
  daybookClearedAt?: unknown;
  daybookMinimized?: unknown;
};

export type StateUpdater = (current: AppState) => AppState;

interface StateSnapshot {
  state: AppState;
  shouldPersist: boolean;
  /** Set when the stored data comes from a newer schema; writing would replace it with defaults. */
  readOnly: boolean;
}

export const CURRENT_SCHEMA_VERSION = 4;

function isFromNewerSchema(value: unknown): boolean {
  const version = value && typeof value === 'object' ? (value as StoredState).schemaVersion : undefined;
  return typeof version === 'number' && version > CURRENT_SCHEMA_VERSION;
}

function snapshotOf(stored: unknown): StateSnapshot {
  const state = normalizeStoredState(stored);
  return {
    state,
    shouldPersist: JSON.stringify(stored) !== JSON.stringify(state),
    readOnly: isFromNewerSchema(stored),
  };
}

function withStateLock<T>(operation: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(STATE_LOCK, operation);
  }

  // Keep non-Chromium previews ordered within this context when Web Locks are unavailable.
  const result = fallbackLock.catch(() => undefined).then(operation);
  fallbackLock = result.then(() => undefined, () => undefined);
  return result;
}

function normalizeTaskOrder(tasks: AppState['tasks']): AppState['tasks'] {
  const orderById = new Map<string, number>();

  (['today', 'later', 'ideas'] as const).forEach((bucket) => {
    const ordered = tasks
      .filter((task) => task.bucket === bucket)
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return bucket === 'today' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
      });
    ordered.forEach((task, index) => orderById.set(task.id, index));
  });

  return tasks.map((task) => ({ ...task, order: orderById.get(task.id) ?? task.order ?? 0 }));
}

function normalizePrivacyWallpaper(value: unknown): PrivacyWallpaperId {
  return typeof value === 'string' && PRIVACY_WALLPAPER_IDS.includes(value as PrivacyWallpaperId)
    ? value as PrivacyWallpaperId
    : 'lonely-road';
}

function normalizeTheme(value: unknown): ThemeMode {
  return typeof value === 'string' && THEME_IDS.includes(value as ThemeMode) ? value as ThemeMode : 'system';
}

function normalizeDailyNote(value: StoredState['dailyNote'], today: string): DailyNote {
  return value && value.date === today && typeof value.text === 'string'
    ? { date: today, text: value.text }
    : { date: today, text: '' };
}

/** Schema 4 keeps done Today tasks in their slot, so earlier completions must start out cleared. */
function migrateV3(candidate: StoredState): StoredState {
  return {
    ...candidate,
    schemaVersion: 4,
    tasks: Array.isArray(candidate.tasks)
      ? candidate.tasks.map((task) => task.completedAt && !task.clearedAt ? { ...task, clearedAt: task.completedAt } : task)
      : [],
    theme: candidate.theme === 'dark' ? 'dark' : 'system',
  };
}

function normalizeV4(stored: StoredState): AppState {
  const { daybookClearedAt: _cleared, daybookMinimized: _minimized, ...candidate } = stored;
  const fallback = freshDefaultState();
  const today = localDateKey();
  const blockingPausesUsed = candidate.blockingPauseDate === today
    && typeof candidate.blockingPausesUsed === 'number'
    && Number.isFinite(candidate.blockingPausesUsed)
    ? Math.min(BLOCKING_PAUSE_LIMIT, Math.max(0, Math.floor(candidate.blockingPausesUsed)))
    : 0;
  const focusMinutes = candidate.pomodoro?.focusMinutes === 25 ? 25 : 50;
  const breakMinutes = candidate.pomodoro?.breakMinutes === 20 ? 20 : 10;
  const pomodoro = normalizePomodoroDay({
    ...fallback.pomodoro,
    ...candidate.pomodoro,
    focusMinutes,
    breakMinutes,
  });

  return reconcileRecurringInstances({
    ...fallback,
    ...candidate,
    schemaVersion: 4,
    tasks: normalizeTaskOrder(Array.isArray(candidate.tasks) ? candidate.tasks : []),
    recurringTasks: Array.isArray(candidate.recurringTasks) ? candidate.recurringTasks : [],
    recurringInstances: Array.isArray(candidate.recurringInstances) ? candidate.recurringInstances : [],
    categories: Array.isArray(candidate.categories) ? candidate.categories : [],
    blocklist: normalizeBlocklist(candidate.blocklist),
    blockingPausedUntil: typeof candidate.blockingPausedUntil === 'number' && candidate.blockingPausedUntil > Date.now()
      ? candidate.blockingPausedUntil
      : null,
    blockingPauseDate: today,
    blockingPausesUsed,
    nowTaskId: typeof candidate.nowTaskId === 'string' ? candidate.nowTaskId : null,
    dailyNote: normalizeDailyNote(candidate.dailyNote, today),
    theme: normalizeTheme(candidate.theme),
    privacyMode: candidate.privacyMode === true,
    privacyWallpaper: normalizePrivacyWallpaper(candidate.privacyWallpaper),
    pomodoro,
  });
}

export function normalizeStoredState(value: unknown): AppState {
  if (!value || typeof value !== 'object') return freshDefaultState();
  const candidate = value as StoredState;
  if (candidate.schemaVersion === 4) return normalizeV4(candidate);
  if (candidate.schemaVersion === 3) return normalizeV4(migrateV3(candidate));
  if (candidate.schemaVersion !== 1 && candidate.schemaVersion !== 2) return freshDefaultState();

  const legacyTasks = Array.isArray(candidate.tasks) ? candidate.tasks : [];
  const migratedContent: StoredState = candidate.schemaVersion === 1 ? {
    ...candidate,
    tasks: legacyTasks.map((task) => task.categoryId === 'ideas'
      ? { ...task, bucket: 'ideas', categoryId: undefined }
      : task),
    categories: Array.isArray(candidate.categories)
      ? candidate.categories.filter((category) => category.id !== 'ideas')
      : [],
    recurringTasks: Array.isArray(candidate.recurringTasks)
      ? candidate.recurringTasks.map((task) => task.categoryId === 'ideas' ? { ...task, categoryId: undefined } : task)
      : [],
    recurringInstances: Array.isArray(candidate.recurringInstances)
      ? candidate.recurringInstances.map((instance) => instance.categoryId === 'ideas' ? { ...instance, categoryId: undefined } : instance)
      : [],
  } : candidate;

  return normalizeV4(migrateV3({
    ...migratedContent,
    schemaVersion: 3,
    pomodoro: {
      ...candidate.pomodoro,
      mode: 'focus',
      focusMinutes: 50,
      breakMinutes: 10,
      endsAt: null,
      pausedSeconds: 50 * 60,
      sessionDate: localDateKey(),
      completedSessionUnits: 0,
    },
  }));
}

async function readStateSnapshot(): Promise<StateSnapshot> {
  if (hasChromeStorage) {
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return snapshotOf(result[STORAGE_KEY]);
  }

  const localValue = window.localStorage.getItem(STORAGE_KEY);
  if (!localValue) return { state: freshDefaultState(), shouldPersist: true, readOnly: false };
  try {
    return snapshotOf(JSON.parse(localValue) as unknown);
  } catch {
    return { state: freshDefaultState(), shouldPersist: true, readOnly: false };
  }
}

const NEWER_SCHEMA_MESSAGE = 'Saved data comes from a newer version of Five; refusing to overwrite it.';

async function saveState(state: AppState): Promise<void> {
  if (hasChromeStorage) {
    await chrome.storage.local.set({ [STORAGE_KEY]: state });
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function loadState(): Promise<AppState> {
  return (await readStateSnapshot()).state;
}

/** Apply one mutation to the latest stored state while excluding every other extension context. */
export function updateState(updater: StateUpdater, onUpdated?: (state: AppState) => void): Promise<AppState> {
  return withStateLock(async () => {
    const snapshot = await readStateSnapshot();
    if (snapshot.readOnly) throw new Error(NEWER_SCHEMA_MESSAGE);
    const nextState = updater(snapshot.state);
    if (nextState !== snapshot.state || snapshot.shouldPersist) await saveState(nextState);
    onUpdated?.(nextState);
    return nextState;
  });
}

export function ensureInitialState(): Promise<AppState> {
  return withStateLock(async () => {
    const snapshot = await readStateSnapshot();
    if (snapshot.readOnly) throw new Error(NEWER_SCHEMA_MESSAGE);
    if (snapshot.shouldPersist) await saveState(snapshot.state);
    return snapshot.state;
  });
}

export function watchState(onChange: (state: AppState) => void): () => void {
  if (!hasChromeStorage) {
    const listener = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      if (!event.newValue) {
        onChange(freshDefaultState());
        return;
      }
      try {
        onChange(normalizeStoredState(JSON.parse(event.newValue)));
      } catch {
        // Ignore malformed writes from another local preview tab.
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }

  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    const change = changes[STORAGE_KEY];
    if (area === 'local' && change) onChange(normalizeStoredState(change.newValue));
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
