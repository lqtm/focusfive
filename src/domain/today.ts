import { localDateKey } from './date';
import { TODAY_LIMIT, type AppState, type Task } from './models';

export function byOrder(a: Task, b: Task): number {
  return (a.order ?? 0) - (b.order ?? 0);
}

/** Open Today tasks always hold a slot; tasks done today hold theirs until cleared. */
export function occupiesTodaySlot(task: Task, today: string): boolean {
  if (task.bucket !== 'today') return false;
  if (!task.completedAt) return true;
  return !task.clearedAt && localDateKey(new Date(task.completedAt)) === today;
}

export function getTodaySlots(state: AppState, date = new Date()): Task[] {
  const today = localDateKey(date);
  return state.tasks.filter((task) => occupiesTodaySlot(task, today)).sort(byOrder);
}

export function hasFreeTodaySlot(state: AppState, date = new Date()): boolean {
  return getTodaySlots(state, date).length < TODAY_LIMIT;
}

export function resolveNowTask(slots: Task[], nowTaskId: string | null): Task | undefined {
  const open = slots.filter((task) => !task.completedAt);
  return open.find((task) => task.id === nowTaskId) ?? open[0];
}
