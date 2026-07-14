import type { AppState, RecurringInstance, RecurringTask } from './models';
import { localDateKey } from './date';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const INSTANCE_RETENTION_DAYS = 31;

export function isDueToday(task: RecurringTask, date = new Date()): boolean {
  if (!task.enabled) return false;

  const weekday = date.getDay();
  if (task.cadence === 'daily') return true;
  if (task.cadence === 'weekdays') return weekday >= 1 && weekday <= 5;
  return task.weekday === weekday;
}

export function reconcileRecurringInstances(state: AppState, date = new Date()): AppState {
  const today = localDateKey(date);
  const cutoffDate = new Date(date);
  cutoffDate.setHours(0, 0, 0, 0);
  cutoffDate.setDate(cutoffDate.getDate() - (INSTANCE_RETENTION_DAYS - 1));
  const cutoff = localDateKey(cutoffDate);
  const recurringTaskIds = new Set(state.recurringTasks.map((task) => task.id));
  const retainedInstances = state.recurringInstances.filter((instance) =>
    recurringTaskIds.has(instance.recurringTaskId) && instance.dueOn >= cutoff,
  );
  const existingIds = new Set(retainedInstances.map((instance) => instance.id));
  const dueInstances = state.recurringTasks
    .filter((task) => isDueToday(task, date))
    .map((task) => ({
      id: `${task.id}:${today}`,
      recurringTaskId: task.id,
      title: task.title,
      categoryId: task.categoryId,
      dueOn: today,
    }))
    .filter((instance) => !existingIds.has(instance.id));

  if (!dueInstances.length && retainedInstances.length === state.recurringInstances.length) return state;
  return {
    ...state,
    recurringInstances: [...retainedInstances, ...dueInstances],
  };
}

export function getActiveRecurringInstances(state: AppState, date = new Date()): RecurringInstance[] {
  const today = localDateKey(date);
  const activeTaskIds = new Set(
    state.recurringTasks.filter((task) => isDueToday(task, date)).map((task) => task.id),
  );
  return state.recurringInstances.filter((instance) =>
    instance.dueOn === today && !instance.completedAt && activeTaskIds.has(instance.recurringTaskId),
  );
}

export function cadenceLabel(task: RecurringTask): string {
  if (task.cadence === 'daily') return 'Every day';
  if (task.cadence === 'weekdays') return 'Weekdays';
  return `Every ${WEEKDAYS[task.weekday ?? 1]}`;
}
