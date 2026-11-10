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
  const doneToday = (completedAt?: number) => Boolean(completedAt && localDateKey(new Date(completedAt)) === today);

  return [
    ...state.tasks
      .filter((task) => task.bucket !== 'ideas' && doneToday(task.completedAt))
      .map((task) => ({ id: task.id, title: task.title, completedAt: task.completedAt ?? 0, kind: 'task' as const })),
    ...state.recurringInstances
      .filter((instance) => doneToday(instance.completedAt))
      .map((instance) => ({ id: instance.id, title: instance.title, completedAt: instance.completedAt ?? 0, kind: 'routine' as const })),
  ].sort((a, b) => a.completedAt - b.completedAt);
}
