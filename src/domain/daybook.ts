import { localDateKey } from './date';
import type { AppState } from './models';

export interface DaybookEntry {
  id: string;
  title: string;
  completedAt: number;
  kind: 'task' | 'routine';
}

export function getDaybookEntries(state: AppState, date = new Date()): DaybookEntry[] {
  const today = localDateKey(date);
  const clearedAt = state.daybookClearedAt && localDateKey(new Date(state.daybookClearedAt)) === today
    ? state.daybookClearedAt
    : 0;

  return [
    ...state.tasks
      .filter((task) => task.bucket !== 'ideas' && task.completedAt && task.completedAt > clearedAt && localDateKey(new Date(task.completedAt)) === today)
      .map((task) => ({ id: task.id, title: task.title, completedAt: task.completedAt ?? 0, kind: 'task' as const })),
    ...state.recurringInstances
      .filter((instance) => instance.completedAt && instance.completedAt > clearedAt && localDateKey(new Date(instance.completedAt)) === today)
      .map((instance) => ({ id: instance.id, title: instance.title, completedAt: instance.completedAt ?? 0, kind: 'routine' as const })),
  ].sort((a, b) => b.completedAt - a.completedAt);
}
