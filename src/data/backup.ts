import type { AppState, TaskBucket } from '../domain/models';
import { localDateKey } from '../domain/date';
import { CURRENT_SCHEMA_VERSION, normalizeStoredState } from './storage';

const BACKUP_APP = 'focus-five';
const BUCKETS: TaskBucket[] = ['today', 'later', 'ideas'];

interface BackupFile {
  app: typeof BACKUP_APP;
  exportedAt: string;
  state: AppState;
}

export interface BackupSummary {
  today: number;
  later: number;
  ideas: number;
  done: number;
  routines: number;
  exportedAt?: number;
}

export type ParsedBackup =
  | { ok: true; state: AppState; summary: BackupSummary }
  | { ok: false; error: string };

export function summarizeState(state: AppState): BackupSummary {
  const open = (bucket: TaskBucket) => state.tasks.filter((task) => task.bucket === bucket && !task.completedAt).length;
  return {
    today: open('today'),
    later: open('later'),
    ideas: open('ideas'),
    done: state.tasks.filter((task) => task.completedAt).length,
    routines: state.recurringTasks.length,
  };
}

export function downloadBackup(state: AppState): void {
  const file: BackupFile = { app: BACKUP_APP, exportedAt: new Date().toISOString(), state };
  const url = URL.createObjectURL(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `focus-five-backup-${localDateKey()}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isValidTask(value: unknown): boolean {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && BUCKETS.includes(value.bucket as TaskBucket)
    && typeof value.createdAt === 'number';
}

/** Accepts a Five export or a raw `fiveState` object, and refuses anything Five would silently reset. */
export function parseBackup(text: string): ParsedBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file isn’t a Five backup — it isn’t valid JSON.' };
  }

  const wrapped = isRecord(parsed) && parsed.app === BACKUP_APP;
  const candidate = wrapped ? (parsed as Record<string, unknown>).state : parsed;
  if (!isRecord(candidate) || typeof candidate.schemaVersion !== 'number' || !Array.isArray(candidate.tasks)) {
    return { ok: false, error: 'That file doesn’t look like a Five backup.' };
  }
  if (candidate.schemaVersion > CURRENT_SCHEMA_VERSION) {
    return { ok: false, error: 'That backup comes from a newer version of Five. Update Five, then restore it.' };
  }
  if (candidate.schemaVersion < 1) return { ok: false, error: 'That file doesn’t look like a Five backup.' };
  const invalidTasks = candidate.tasks.filter((task) => !isValidTask(task)).length;
  if (invalidTasks) {
    return { ok: false, error: `That backup has ${invalidTasks} damaged ${invalidTasks === 1 ? 'task' : 'tasks'}, so nothing was restored.` };
  }

  const state = normalizeStoredState(candidate);
  const exportedAt = wrapped ? Date.parse(String((parsed as Record<string, unknown>).exportedAt)) : NaN;
  return {
    ok: true,
    state,
    summary: { ...summarizeState(state), ...(Number.isFinite(exportedAt) ? { exportedAt } : {}) },
  };
}
