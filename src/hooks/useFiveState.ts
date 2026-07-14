import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { loadState, normalizeStoredState, updateState, watchState, type StateUpdater } from '../data/storage';
import {
  BLOCKING_PAUSE_LIMIT,
  BLOCKING_PAUSE_MINUTES,
  BLOCKING_PAUSE_UNDO_MINUTES,
  normalizeBlockedDomain,
} from '../domain/blocklist';
import { localDateKey } from '../domain/date';
import { completePomodoroPhase, normalizePomodoroDay } from '../domain/pomodoro';
import { getActiveRecurringInstances, reconcileRecurringInstances } from '../domain/recurrence';
import {
  CATEGORY_LIMIT,
  RECURRING_LIMIT,
  TODAY_LIMIT,
  type AppNotice,
  type AppState,
  type BreakMinutes,
  type FocusMinutes,
  type PomodoroMode,
  type PrivacyWallpaperId,
  type RecurrenceCadence,
  type TaskBucket,
} from '../domain/models';

function insertionOrder(state: AppState, bucket: TaskBucket): number {
  const orders = state.tasks
    .filter((task) => task.bucket === bucket && !task.completedAt)
    .map((task) => task.order ?? 0);
  if (!orders.length) return 0;
  return bucket === 'today' ? Math.max(...orders) + 1 : Math.min(...orders) - 1;
}

function activeTodayTaskCount(state: AppState): number {
  return state.tasks.filter((task) => task.bucket === 'today' && !task.completedAt).length;
}

export function useFiveState(currentDate: Date) {
  const [state, setState] = useState<AppState | null>(null);
  const [notice, setNotice] = useState<AppNotice | null>(null);
  const stateRef = useRef<AppState | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());

  const announce = useCallback((message: string) => {
    setNotice({ id: Date.now(), message });
  }, []);

  const replaceState = useCallback((nextState: AppState) => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  useEffect(() => {
    let active = true;
    let externalChangeReceived = false;
    loadState()
      .then((loaded) => {
        if (active && !externalChangeReceived) replaceState(loaded);
      })
      .catch(() => {
        if (!active || externalChangeReceived) return;
        replaceState(normalizeStoredState(undefined));
        announce('Five could not read saved data, so it opened a fresh local state.');
      });
    const unwatch = watchState((nextState) => {
      externalChangeReceived = true;
      replaceState(nextState);
    });
    return () => {
      active = false;
      unwatch();
    };
  }, [announce, replaceState]);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const commit = useCallback((updater: StateUpdater) => {
    if (!stateRef.current) return;
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          await updateState(updater, replaceState);
        } catch {
          announce('Five could not save that change. Please try again.');
        }
      });
  }, [announce, replaceState]);

  useEffect(() => {
    commit((current) => {
      const reconciled = reconcileRecurringInstances(current, currentDate);
      const pomodoro = normalizePomodoroDay(reconciled.pomodoro, currentDate);
      const today = localDateKey(currentDate);
      const blockingUsage = reconciled.blockingPauseDate === today
        ? reconciled
        : { ...reconciled, blockingPauseDate: today, blockingPausesUsed: 0 };
      return pomodoro === blockingUsage.pomodoro ? blockingUsage : { ...blockingUsage, pomodoro };
    });
  }, [commit, currentDate]);

  const activeTodayCount = useMemo(
    () => state ? activeTodayTaskCount(state) : 0,
    [state],
  );

  const addTask = useCallback((title: string, requestedBucket: TaskBucket, categoryId?: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    commit((current) => {
      const todayCount = activeTodayTaskCount(current);
      const bucket = requestedBucket === 'today' && todayCount >= TODAY_LIMIT ? 'later' : requestedBucket;
      if (bucket !== requestedBucket) announce('Today already has five — sent to Later.');
      return {
        ...current,
        tasks: [{
          id: crypto.randomUUID(),
          title: cleanTitle,
          bucket,
          categoryId,
          createdAt: Date.now(),
          order: insertionOrder(current, bucket),
        }, ...current.tasks],
      };
    });
  }, [announce, commit]);

  const completeTask = useCallback((taskId: string) => {
    commit((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === taskId ? { ...task, completedAt: Date.now() } : task),
    }));
  }, [commit]);

  const restoreTask = useCallback((taskId: string) => {
    commit((current) => {
      const task = current.tasks.find((item) => item.id === taskId);
      if (!task) return current;
      const todayCount = activeTodayTaskCount(current);
      const bucket = task.bucket === 'today' && todayCount >= TODAY_LIMIT ? 'later' : task.bucket;
      if (bucket !== task.bucket) announce('Today is full — restored to Later instead.');
      return {
        ...current,
        tasks: current.tasks.map((item) => item.id === taskId
          ? { ...item, bucket, order: insertionOrder(current, bucket), completedAt: undefined }
          : item),
      };
    });
  }, [announce, commit]);

  const deleteTask = useCallback((taskId: string) => {
    commit((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== taskId) }));
  }, [commit]);

  const moveTask = useCallback((taskId: string, bucket: TaskBucket) => {
    commit((current) => {
      const todayCount = activeTodayTaskCount(current);
      if (bucket === 'today' && todayCount >= TODAY_LIMIT) {
        announce('Complete or move a Today task first.');
        return current;
      }
      return {
        ...current,
        tasks: current.tasks.map((task) => task.id === taskId
          ? { ...task, bucket, order: insertionOrder(current, bucket) }
          : task),
      };
    });
  }, [announce, commit]);

  const reorderTask = useCallback((taskId: string, direction: 'up' | 'down') => {
    commit((current) => {
      const task = current.tasks.find((item) => item.id === taskId);
      if (!task || task.bucket === 'ideas' || task.completedAt) return current;
      const ordered = current.tasks
        .filter((item) => item.bucket === task.bucket && !item.completedAt)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const index = ordered.findIndex((item) => item.id === taskId);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return current;
      const target = ordered[targetIndex];
      const taskOrder = task.order ?? index;
      const targetOrder = target.order ?? targetIndex;
      return {
        ...current,
        tasks: current.tasks.map((item) => {
          if (item.id === task.id) return { ...item, order: targetOrder };
          if (item.id === target.id) return { ...item, order: taskOrder };
          return item;
        }),
      };
    });
  }, [commit]);

  const completeRecurringInstance = useCallback((instanceId: string) => {
    commit((current) => ({
      ...current,
      recurringInstances: current.recurringInstances.map((instance) =>
        instance.id === instanceId ? { ...instance, completedAt: Date.now() } : instance,
      ),
    }));
  }, [commit]);

  const restoreRecurringInstance = useCallback((instanceId: string) => {
    commit((current) => ({
      ...current,
      recurringInstances: current.recurringInstances.map((instance) =>
        instance.id === instanceId ? { ...instance, completedAt: undefined } : instance,
      ),
    }));
  }, [commit]);

  const clearDaybook = useCallback(() => {
    commit((current) => ({ ...current, daybookClearedAt: Date.now() }));
    announce('Today’s daybook is clear. New completions will still appear.');
  }, [announce, commit]);

  const toggleDaybook = useCallback(() => {
    commit((current) => ({ ...current, daybookMinimized: !current.daybookMinimized }));
  }, [commit]);

  const addRecurringTask = useCallback((title: string, cadence: RecurrenceCadence, categoryId?: string, weekday?: number) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    commit((current) => {
      if (current.recurringTasks.length >= RECURRING_LIMIT) {
        announce('Recurring is full — five routines is the limit.');
        return current;
      }
      const next = {
        ...current,
        recurringTasks: [...current.recurringTasks, {
          id: crypto.randomUUID(),
          title: cleanTitle,
          cadence,
          categoryId,
          weekday,
          enabled: true,
          createdAt: Date.now(),
        }],
      };
      return reconcileRecurringInstances(next);
    });
  }, [announce, commit]);

  const toggleRecurringTask = useCallback((taskId: string) => {
    commit((current) => ({
      ...current,
      recurringTasks: current.recurringTasks.map((task) => task.id === taskId ? { ...task, enabled: !task.enabled } : task),
    }));
  }, [commit]);

  const deleteRecurringTask = useCallback((taskId: string) => {
    commit((current) => ({
      ...current,
      recurringTasks: current.recurringTasks.filter((task) => task.id !== taskId),
      recurringInstances: current.recurringInstances.filter((instance) => instance.recurringTaskId !== taskId),
    }));
  }, [commit]);

  const addCategory = useCallback((name: string, color: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    commit((current) => {
      if (current.categories.length >= CATEGORY_LIMIT) {
        announce('Five categories is enough structure for now.');
        return current;
      }
      return {
        ...current,
        categories: [...current.categories, { id: crypto.randomUUID(), name: cleanName, color }],
      };
    });
  }, [announce, commit]);

  const deleteCategory = useCallback((categoryId: string) => {
    commit((current) => ({
      ...current,
      categories: current.categories.filter((category) => category.id !== categoryId),
      tasks: current.tasks.map((task) => task.categoryId === categoryId ? { ...task, categoryId: undefined } : task),
      recurringTasks: current.recurringTasks.map((task) => task.categoryId === categoryId ? { ...task, categoryId: undefined } : task),
      recurringInstances: current.recurringInstances.map((instance) => instance.categoryId === categoryId ? { ...instance, categoryId: undefined } : instance),
    }));
  }, [commit]);

  const addBlockedSite = useCallback((site: string): boolean => {
    const normalized = normalizeBlockedDomain(site);
    if (!normalized) {
      announce('Enter a valid website, such as reddit.com.');
      return false;
    }
    commit((current) => current.blocklist.includes(normalized)
      ? current
      : { ...current, blocklist: [...current.blocklist, normalized] });
    return true;
  }, [announce, commit]);

  const removeBlockedSite = useCallback((site: string) => {
    commit((current) => ({ ...current, blocklist: current.blocklist.filter((entry) => entry !== site) }));
  }, [commit]);

  const pauseBlocking = useCallback(() => {
    commit((current) => {
      const now = Date.now();
      const today = localDateKey(new Date(now));
      const pausesUsed = current.blockingPauseDate === today ? current.blockingPausesUsed : 0;
      const normalized = current.blockingPauseDate === today
        ? current
        : { ...current, blockingPauseDate: today, blockingPausesUsed: 0 };

      if (current.blockingPausedUntil && current.blockingPausedUntil > now) {
        announce('The 30-minute block pause is already active.');
        return normalized;
      }
      if (pausesUsed >= BLOCKING_PAUSE_LIMIT) {
        announce('All three block pauses have been used today.');
        return normalized;
      }

      const nextUsed = pausesUsed + 1;
      const remaining = BLOCKING_PAUSE_LIMIT - nextUsed;
      announce(`Blocking paused for ${BLOCKING_PAUSE_MINUTES} minutes · ${remaining} left today.`);
      return {
        ...normalized,
        blockingPausedUntil: now + BLOCKING_PAUSE_MINUTES * 60_000,
        blockingPausesUsed: nextUsed,
      };
    });
  }, [announce, commit]);

  const resumeBlocking = useCallback(() => {
    commit((current) => {
      const now = Date.now();
      if (!current.blockingPausedUntil || current.blockingPausedUntil <= now) return current;

      const today = localDateKey(new Date(now));
      const pausesUsed = current.blockingPauseDate === today ? current.blockingPausesUsed : 0;
      const startedAt = current.blockingPausedUntil - BLOCKING_PAUSE_MINUTES * 60_000;
      const shouldRefund = now - startedAt <= BLOCKING_PAUSE_UNDO_MINUTES * 60_000;

      announce(shouldRefund
        ? 'Block pause undone · allowance restored.'
        : 'Blocking resumed.');
      return {
        ...current,
        blockingPausedUntil: null,
        blockingPauseDate: today,
        blockingPausesUsed: shouldRefund ? Math.max(0, pausesUsed - 1) : pausesUsed,
      };
    });
  }, [announce, commit]);

  const toggleTheme = useCallback(() => {
    commit((current) => ({ ...current, theme: current.theme === 'light' ? 'dark' : 'light' }));
  }, [commit]);

  const togglePrivacyMode = useCallback(() => {
    commit((current) => ({ ...current, privacyMode: !current.privacyMode }));
  }, [commit]);

  const setPrivacyWallpaper = useCallback((privacyWallpaper: PrivacyWallpaperId) => {
    commit((current) => ({ ...current, privacyWallpaper }));
  }, [commit]);

  const startPausePomodoro = useCallback(() => {
    commit((current) => {
      const timer = current.pomodoro;
      if (timer.endsAt) {
        const pausedSeconds = Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
        return { ...current, pomodoro: { ...timer, endsAt: null, pausedSeconds } };
      }
      return { ...current, pomodoro: { ...timer, endsAt: Date.now() + timer.pausedSeconds * 1000 } };
    });
  }, [commit]);

  const setFocusMinutes = useCallback((minutes: FocusMinutes) => {
    commit((current) => {
      const timer = current.pomodoro;
      return {
        ...current,
        pomodoro: {
          ...timer,
          focusMinutes: minutes,
          endsAt: timer.mode === 'focus' ? null : timer.endsAt,
          pausedSeconds: timer.mode === 'focus' ? minutes * 60 : timer.pausedSeconds,
        },
      };
    });
  }, [commit]);

  const setBreakMinutes = useCallback((minutes: BreakMinutes) => {
    commit((current) => {
      const timer = current.pomodoro;
      return {
        ...current,
        pomodoro: {
          ...timer,
          breakMinutes: minutes,
          endsAt: timer.mode === 'break' ? null : timer.endsAt,
          pausedSeconds: timer.mode === 'break' ? minutes * 60 : timer.pausedSeconds,
        },
      };
    });
  }, [commit]);

  const completePomodoro = useCallback(() => {
    commit((current) => completePomodoroPhase(current));
  }, [commit]);

  const resetPomodoro = useCallback((mode?: PomodoroMode) => {
    commit((current) => {
      const nextMode = mode ?? current.pomodoro.mode;
      const duration = nextMode === 'focus' ? current.pomodoro.focusMinutes : current.pomodoro.breakMinutes;
      return {
        ...current,
        pomodoro: { ...current.pomodoro, mode: nextMode, endsAt: null, pausedSeconds: duration * 60 },
      };
    });
  }, [commit]);

  const todaysRecurring = useMemo(() => {
    if (!state) return [];
    return getActiveRecurringInstances(state, currentDate);
  }, [currentDate, state]);

  return {
    state,
    notice,
    activeTodayCount,
    todaysRecurring,
    addTask,
    completeTask,
    restoreTask,
    deleteTask,
    moveTask,
    reorderTask,
    completeRecurringInstance,
    restoreRecurringInstance,
    clearDaybook,
    toggleDaybook,
    addRecurringTask,
    toggleRecurringTask,
    deleteRecurringTask,
    addCategory,
    deleteCategory,
    addBlockedSite,
    removeBlockedSite,
    pauseBlocking,
    resumeBlocking,
    toggleTheme,
    togglePrivacyMode,
    setPrivacyWallpaper,
    startPausePomodoro,
    resetPomodoro,
    setFocusMinutes,
    setBreakMinutes,
    completePomodoro,
  };
}
