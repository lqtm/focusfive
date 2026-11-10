import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { releaseSiteAccess, requestSiteAccess } from '../data/siteAccess';
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
import { CATEGORY_COLORS, normalizeHint, parseTaskInput } from '../domain/tags';
import { getTodaySlots, occupiesTodaySlot } from '../domain/today';
import {
  CATEGORY_LIMIT,
  RECURRING_LIMIT,
  TODAY_LIMIT,
  type AppNotice,
  type AppState,
  type BreakMinutes,
  type Category,
  type FocusMinutes,
  type PomodoroMode,
  type PrivacyWallpaperId,
  type RecurrenceCadence,
  type TaskBucket,
  type ThemeMode,
} from '../domain/models';

function insertionOrder(state: AppState, bucket: TaskBucket): number {
  const peers = bucket === 'today'
    ? getTodaySlots(state)
    : state.tasks.filter((task) => task.bucket === bucket && !task.completedAt);
  const orders = peers.map((task) => task.order ?? 0);
  if (!orders.length) return 0;
  return bucket === 'today' ? Math.max(...orders) + 1 : Math.min(...orders) - 1;
}

function todayIsFull(state: AppState): boolean {
  return getTodaySlots(state).length >= TODAY_LIMIT;
}

/** Match `tag` to an existing category or create it; null when the category limit leaves no room. */
function resolveCategory(categories: Category[], tag: string): { categories: Category[]; categoryId: string } | null {
  const existing = categories.find((category) => category.name.toLowerCase() === tag.toLowerCase());
  if (existing) return { categories, categoryId: existing.id };
  if (categories.length >= CATEGORY_LIMIT) return null;
  const created: Category = {
    id: crypto.randomUUID(),
    name: tag,
    color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
  };
  return { categories: [...categories, created], categoryId: created.id };
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
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

  const addTask = useCallback((rawTitle: string, requestedBucket: TaskBucket) => {
    if (!rawTitle.trim()) return;

    commit((current) => {
      const parsed = parseTaskInput(rawTitle);
      let title = parsed.title;
      let hint = parsed.hint;
      let categories = current.categories;
      let categoryId: string | undefined;

      if (parsed.tag) {
        const resolved = resolveCategory(categories, parsed.tag);
        if (resolved) {
          ({ categories, categoryId } = resolved);
        } else {
          title = parsed.titleWithTag;
          hint = parsed.hintWithTag;
          announce(`Five categories is the limit, so #${parsed.tag} stayed in the text.`);
        }
      }
      if (!title) return current;

      const bucket = requestedBucket === 'today' && todayIsFull(current) ? 'later' : requestedBucket;
      if (bucket !== requestedBucket) announce('Today already has five — sent to Later.');
      return {
        ...current,
        categories,
        tasks: [{
          id: crypto.randomUUID(),
          title,
          ...(hint ? { hint } : {}),
          bucket,
          categoryId,
          createdAt: Date.now(),
          order: insertionOrder(current, bucket),
        }, ...current.tasks],
      };
    });
  }, [announce, commit]);

  /** Rename a task and set its hint. The title accepts the composer syntax: `#tag` recategorizes, `// hint` replaces the hint. */
  const editTask = useCallback((taskId: string, rawTitle: string, rawHint: string) => {
    commit((current) => {
      const task = current.tasks.find((item) => item.id === taskId);
      if (!task) return current;

      const parsed = parseTaskInput(rawTitle);
      const typedHint = parsed.hintWithTag !== undefined;
      let title = parsed.title;
      let hint = typedHint ? parsed.hint : normalizeHint(rawHint);
      let categories = current.categories;
      let categoryId = task.categoryId;

      if (parsed.tag) {
        const resolved = resolveCategory(categories, parsed.tag);
        if (resolved) {
          ({ categories, categoryId } = resolved);
        } else {
          title = parsed.titleWithTag;
          if (typedHint) hint = parsed.hintWithTag;
          announce(`Five categories is the limit, so #${parsed.tag} stayed in the text.`);
        }
      }
      if (!title) title = task.title;
      if (title === task.title && hint === task.hint && categoryId === task.categoryId) return current;

      return {
        ...current,
        categories,
        tasks: current.tasks.map((item) => {
          if (item.id !== taskId) return item;
          const { hint: _previous, ...rest } = item;
          return { ...rest, title, categoryId, ...(hint ? { hint } : {}) };
        }),
      };
    });
  }, [announce, commit]);

  const completeTask = useCallback((taskId: string) => {
    commit((current) => ({
      ...current,
      tasks: current.tasks.map((task) => task.id === taskId ? { ...task, completedAt: Date.now(), clearedAt: undefined } : task),
    }));
  }, [commit]);

  const restoreTask = useCallback((taskId: string) => {
    commit((current) => {
      const task = current.tasks.find((item) => item.id === taskId);
      if (!task) return current;
      if (occupiesTodaySlot(task, localDateKey())) {
        return {
          ...current,
          tasks: current.tasks.map((item) => item.id === taskId ? { ...item, completedAt: undefined } : item),
        };
      }
      const bucket = task.bucket === 'today' && todayIsFull(current) ? 'later' : task.bucket;
      if (bucket !== task.bucket) announce('Today is full — restored to Later instead.');
      return {
        ...current,
        tasks: current.tasks.map((item) => item.id === taskId
          ? { ...item, bucket, order: insertionOrder(current, bucket), completedAt: undefined, clearedAt: undefined }
          : item),
      };
    });
  }, [announce, commit]);

  const deleteTask = useCallback((taskId: string) => {
    commit((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== taskId) }));
  }, [commit]);

  const moveTask = useCallback((taskId: string, bucket: TaskBucket) => {
    commit((current) => {
      if (bucket === 'today' && todayIsFull(current)) {
        announce('Today is full. Pick a slot to swap out first.');
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

  /** Free a Today slot: open tasks go to Later, done tasks are cleared. */
  const freeTodaySlot = useCallback((taskId: string) => {
    commit((current) => {
      const task = current.tasks.find((item) => item.id === taskId);
      if (!task || !occupiesTodaySlot(task, localDateKey())) return current;
      const laterOrder = insertionOrder(current, 'later');
      return {
        ...current,
        tasks: current.tasks.map((item) => {
          if (item.id !== taskId) return item;
          return item.completedAt ? { ...item, clearedAt: Date.now() } : { ...item, bucket: 'later', order: laterOrder };
        }),
      };
    });
  }, [commit]);

  /** Bring a Later task or Idea into Today by taking the chosen slot's position. */
  const swapIntoToday = useCallback((incomingId: string, outgoingId: string) => {
    commit((current) => {
      const incoming = current.tasks.find((task) => task.id === incomingId);
      const outgoing = current.tasks.find((task) => task.id === outgoingId);
      if (!incoming || !outgoing || !occupiesTodaySlot(outgoing, localDateKey())) return current;
      const laterOrder = insertionOrder(current, 'later');
      announce(outgoing.completedAt ? 'Swapped into the cleared slot.' : `Swapped — “${outgoing.title}” moved to Later.`);
      return {
        ...current,
        nowTaskId: current.nowTaskId === outgoing.id ? incoming.id : current.nowTaskId,
        tasks: current.tasks.map((task) => {
          if (task.id === incoming.id) {
            return { ...task, bucket: 'today', order: outgoing.order, completedAt: undefined, clearedAt: undefined };
          }
          if (task.id === outgoing.id) {
            return outgoing.completedAt ? { ...task, clearedAt: Date.now() } : { ...task, bucket: 'later', order: laterOrder };
          }
          return task;
        }),
      };
    });
  }, [announce, commit]);

  const clearDoneToday = useCallback(() => {
    commit((current) => {
      const today = localDateKey();
      const done = current.tasks.filter((task) => task.completedAt && occupiesTodaySlot(task, today));
      if (!done.length) return current;
      const doneIds = new Set(done.map((task) => task.id));
      announce(`Cleared ${plural(done.length, 'slot')}.`);
      return {
        ...current,
        tasks: current.tasks.map((task) => doneIds.has(task.id) ? { ...task, clearedAt: Date.now() } : task),
      };
    });
  }, [announce, commit]);

  /** Persist the given sequence of task ids as their explicit order. */
  const reorderTasks = useCallback((orderedIds: string[]) => {
    commit((current) => {
      const positions = new Map(orderedIds.map((id, index) => [id, index]));
      if (current.tasks.every((task) => !positions.has(task.id) || task.order === positions.get(task.id))) return current;
      return {
        ...current,
        tasks: current.tasks.map((task) => positions.has(task.id) ? { ...task, order: positions.get(task.id) } : task),
      };
    });
  }, [commit]);

  const setNowTask = useCallback((taskId: string) => {
    commit((current) => current.nowTaskId === taskId ? current : { ...current, nowTaskId: taskId });
  }, [commit]);

  const restoreBackup = useCallback((restored: AppState) => {
    commit(() => restored);
    announce('Backup restored.');
  }, [announce, commit]);

  const setDailyNote = useCallback((text: string) => {
    commit((current) => ({ ...current, dailyNote: { date: localDateKey(), text } }));
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

  const addRecurringTask = useCallback((title: string, cadence: RecurrenceCadence, weekday?: number) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    commit((current) => {
      if (current.recurringTasks.length >= RECURRING_LIMIT) {
        announce('Five routines is the limit.');
        return current;
      }
      const next = {
        ...current,
        recurringTasks: [...current.recurringTasks, {
          id: crypto.randomUUID(),
          title: cleanTitle,
          cadence,
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

  const addCategory = useCallback((name: string) => {
    const cleanName = name.trim().replace(/^#/, '');
    if (!cleanName) return;
    commit((current) => {
      if (current.categories.length >= CATEGORY_LIMIT) {
        announce('Five categories is the limit.');
        return current;
      }
      if (current.categories.some((category) => category.name.toLowerCase() === cleanName.toLowerCase())) return current;
      return {
        ...current,
        categories: [...current.categories, {
          id: crypto.randomUUID(),
          name: cleanName,
          color: CATEGORY_COLORS[current.categories.length % CATEGORY_COLORS.length],
        }],
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

  /** Call from the submit handler itself so Chrome sees the user gesture behind the access request. */
  const addBlockedSite = useCallback((site: string): Promise<boolean> => {
    const normalized = normalizeBlockedDomain(site);
    if (!normalized) {
      announce('Enter a valid website, such as reddit.com.');
      return Promise.resolve(false);
    }
    return requestSiteAccess([normalized]).then((granted) => {
      if (!granted) {
        announce(`Five can only block ${normalized} with your OK, so it was not added.`);
        return false;
      }
      commit((current) => current.blocklist.includes(normalized)
        ? current
        : { ...current, blocklist: [...current.blocklist, normalized] });
      return true;
    });
  }, [announce, commit]);

  const removeBlockedSite = useCallback((site: string) => {
    commit((current) => ({ ...current, blocklist: current.blocklist.filter((entry) => entry !== site) }));
    releaseSiteAccess(site);
  }, [commit]);

  const allowBlockedSites = useCallback((sites: string[]) => {
    void requestSiteAccess(sites).then((granted) => {
      if (!granted) announce('Those sites stay unblocked until you allow them.');
    });
  }, [announce]);

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

  const setTheme = useCallback((theme: ThemeMode) => {
    commit((current) => current.theme === theme ? current : { ...current, theme });
  }, [commit]);

  const togglePrivacyMode = useCallback(() => {
    commit((current) => ({ ...current, privacyMode: !current.privacyMode }));
  }, [commit]);

  const setPrivacyWallpaper = useCallback((privacyWallpaper: PrivacyWallpaperId) => {
    commit((current) => ({ ...current, privacyWallpaper }));
  }, [commit]);

  const startPomodoro = useCallback(() => {
    commit((current) => {
      const timer = current.pomodoro;
      if (timer.endsAt) return current;
      return { ...current, pomodoro: { ...timer, endsAt: Date.now() + timer.pausedSeconds * 1000 } };
    });
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
    announce,
    todaysRecurring,
    addTask,
    completeTask,
    restoreTask,
    deleteTask,
    moveTask,
    freeTodaySlot,
    swapIntoToday,
    clearDoneToday,
    reorderTasks,
    editTask,
    setNowTask,
    setDailyNote,
    restoreBackup,
    completeRecurringInstance,
    restoreRecurringInstance,
    addRecurringTask,
    toggleRecurringTask,
    deleteRecurringTask,
    addCategory,
    deleteCategory,
    addBlockedSite,
    removeBlockedSite,
    allowBlockedSites,
    pauseBlocking,
    resumeBlocking,
    setTheme,
    togglePrivacyMode,
    setPrivacyWallpaper,
    startPomodoro,
    startPausePomodoro,
    resetPomodoro,
    setFocusMinutes,
    setBreakMinutes,
    completePomodoro,
  };
}

export type FiveStore = ReturnType<typeof useFiveState>;
