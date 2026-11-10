import { useEffect, useMemo, useRef, useState } from 'react';

import { AppHeader, SubpageHeader } from './components/AppHeader';
import { BackupSection } from './components/BackupSection';
import { DaybookCard } from './components/DaybookCard';
import { FocusMode } from './components/FocusMode';
import { IdeasView } from './components/IdeasView';
import { LaterView } from './components/LaterView';
import { PrivacyPanel } from './components/PrivacyPanel';
import { RoutinesPage } from './components/RoutinesPage';
import { SettingsPage, type SettingsSection } from './components/SettingsPage';
import { TodaySidebar } from './components/TodaySidebar';
import { TodayView } from './components/TodayView';
import { getDaybookEntries } from './domain/daybook';
import { localDateKey } from './domain/date';
import { THEME_CACHE_KEY, TODAY_LIMIT, type TabId, type ViewId } from './domain/models';
import { byOrder, getTodaySlots, resolveNowTask } from './domain/today';
import { useCurrentDate } from './hooks/useCurrentDate';
import { useFiveState } from './hooks/useFiveState';
import { useSitesMissingAccess } from './hooks/useSiteAccess';
import { isInteractiveTarget, useHotkeys } from './hooks/useHotkeys';
import { usePomodoroCompletion } from './hooks/usePomodoroClock';

const VIEW_SHORTCUTS: Record<string, TabId> = { t: 'today', l: 'later', i: 'ideas' };
const SEQUENCE_TIMEOUT = 1500;

export function App() {
  const [view, setView] = useState<ViewId>('today');
  const [settingsSection, setSettingsSection] = useState<SettingsSection>();
  const [focusOpen, setFocusOpen] = useState(false);
  const pendingSequenceRef = useRef(0);
  const currentDate = useCurrentDate();
  const five = useFiveState(currentDate);
  const state = five.state;
  const sitesMissingAccess = useSitesMissingAccess(state?.blocklist ?? []);
  const blockedRedirect = useMemo(() => new URLSearchParams(window.location.search).has('blocked'), []);

  useEffect(() => {
    if (!state?.theme) return;
    document.documentElement.dataset.theme = state.theme;
    localStorage.setItem(THEME_CACHE_KEY, state.theme);
  }, [state?.theme]);

  useEffect(() => {
    if (state?.privacyMode) {
      setFocusOpen(false);
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [state?.privacyMode]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [view]);

  usePomodoroCompletion(state?.pomodoro ?? null, five.completePomodoro);

  const derived = useMemo(() => {
    if (!state) return null;
    const slots = getTodaySlots(state, currentDate);
    const nowTask = resolveNowTask(slots, state.nowTaskId);
    const openSlots = slots.filter((task) => !task.completedAt);
    const nowIndex = openSlots.findIndex((task) => task.id === nowTask?.id);
    return {
      slots,
      nowTask,
      nextTask: openSlots.length > 1 ? openSlots[(nowIndex + 1) % openSlots.length] : undefined,
      later: state.tasks.filter((task) => task.bucket === 'later' && !task.completedAt).sort(byOrder),
      ideas: state.tasks.filter((task) => task.bucket === 'ideas' && !task.completedAt).sort(byOrder),
      daybookEntries: getDaybookEntries(state, currentDate),
    };
  }, [currentDate, state]);

  useHotkeys((event) => {
    if (!state || state.privacyMode) return false;
    const key = event.key.toLowerCase();
    const isSpace = event.key === ' ' && !isInteractiveTarget(event.target);

    if (focusOpen) {
      if (key === 'escape') setFocusOpen(false);
      else if (isSpace) five.startPausePomodoro();
      else return false;
      return true;
    }

    const sequenceStarted = pendingSequenceRef.current;
    pendingSequenceRef.current = 0;
    if (sequenceStarted && Date.now() - sequenceStarted < SEQUENCE_TIMEOUT && VIEW_SHORTCUTS[key]) {
      setView(VIEW_SHORTCUTS[key]);
      return true;
    }
    if (key === 'g') {
      pendingSequenceRef.current = Date.now();
      return true;
    }
    if (isSpace) {
      five.startPausePomodoro();
      return true;
    }
    if (key === 'escape' && (view === 'routines' || view === 'settings')) {
      setView('today');
      return true;
    }
    return false;
  }, true, true);

  if (!state || !derived) {
    return <main className="loading-screen"><span className="wordmark">five</span></main>;
  }

  const { slots, nowTask, nextTask, later, ideas } = derived;
  const todayFull = slots.length >= TODAY_LIMIT;
  const blockingPaused = Boolean(state.blockingPausedUntil && state.blockingPausedUntil > Date.now());
  const blockingPausedMinutes = blockingPaused && state.blockingPausedUntil
    ? Math.max(1, Math.ceil((state.blockingPausedUntil - Date.now()) / 60_000))
    : null;
  const activeBlockedSites = state.blocklist.length - sitesMissingAccess.length;
  const sessions = state.pomodoro.sessionDate === localDateKey(currentDate) ? state.pomodoro.completedSessionUnits : 0;

  const startFocus = () => {
    five.startPomodoro();
    setFocusOpen(true);
  };
  const hideList = () => {
    setFocusOpen(false);
    five.togglePrivacyMode();
  };
  const openSettings = (section?: SettingsSection) => {
    setSettingsSection(section);
    setView('settings');
  };

  if (state.privacyMode) {
    return (
      <main className="app-shell" data-privacy="true">
        <PrivacyPanel
          wallpaperId={state.privacyWallpaper}
          timer={state.pomodoro}
          onReveal={five.togglePrivacyMode}
          onSelectWallpaper={five.setPrivacyWallpaper}
          onStartPauseTimer={five.startPausePomodoro}
        />
      </main>
    );
  }

  if (focusOpen) {
    return (
      <main className="app-shell" data-focus="true">
        <FocusMode
          task={nowTask}
          slot={nowTask ? slots.indexOf(nowTask) + 1 : 0}
          category={state.categories.find((category) => category.id === nowTask?.categoryId)}
          nextTask={nextTask}
          timer={state.pomodoro}
          blockStatus={blockingPaused
            ? 'Blocking paused'
            : `${activeBlockedSites} ${activeBlockedSites === 1 ? 'site' : 'sites'} blocked`}
          onStartPause={five.startPausePomodoro}
          onDone={() => {
            if (!nowTask) return;
            five.completeTask(nowTask.id);
            if (nextTask) five.setNowTask(nextTask.id);
          }}
          onSwitch={() => nextTask && five.setNowTask(nextTask.id)}
          onSkipRest={() => five.resetPomodoro('focus')}
          onExit={() => setFocusOpen(false)}
        />
        {five.notice && <div className="toast" role="status" key={five.notice.id}>{five.notice.message}</div>}
      </main>
    );
  }

  const isSubpage = view === 'routines' || view === 'settings';

  return (
    <main className="app-shell">
      <div className="container">
        {isSubpage ? (
          <SubpageHeader onBack={() => setView('today')} />
        ) : (
          <AppHeader
            activeTab={view as TabId}
            date={currentDate}
            counts={{ today: `${slots.length}/${TODAY_LIMIT}`, later: String(later.length), ideas: String(ideas.length) }}
            onTabChange={setView}
            onHideList={hideList}
            onOpenSettings={() => openSettings()}
          />
        )}

        {view === 'today' && (
          <TodayView
            slots={slots}
            nowTask={nowTask}
            categories={state.categories}
            timer={state.pomodoro}
            blockedRedirect={blockedRedirect}
            onAdd={(title) => five.addTask(title, 'today')}
            onToggleDone={(task) => task.completedAt ? five.restoreTask(task.id) : five.completeTask(task.id)}
            onSetNow={five.setNowTask}
            onStart={startFocus}
            onSendToLater={(taskId) => five.moveTask(taskId, 'later')}
            onEditTask={five.editTask}
            onSendToIdeas={(taskId) => {
              five.moveTask(taskId, 'ideas');
              five.announce('Back in Ideas for triage.');
            }}
            onFreeSlot={five.freeTodaySlot}
            onClearDone={five.clearDoneToday}
            onReorder={five.reorderTasks}
            sidebar={(
              <TodaySidebar
                daybook={(
                  <DaybookCard
                    entries={derived.daybookEntries}
                    note={state.dailyNote.date === localDateKey(currentDate) ? state.dailyNote.text : ''}
                    onNoteChange={five.setDailyNote}
                    onRestore={(entry) => entry.kind === 'routine'
                      ? five.restoreRecurringInstance(entry.id)
                      : five.restoreTask(entry.id)}
                  />
                )}
                routinesDefined={state.recurringTasks.length}
                dueRoutines={five.todaysRecurring}
                blockedSites={activeBlockedSites}
                sitesNeedingAccess={sitesMissingAccess.length}
                blockingPausedMinutes={blockingPausedMinutes}
                sessions={sessions}
                onCompleteRoutine={five.completeRecurringInstance}
                onManageRoutines={() => setView('routines')}
                onOpenBlocklist={() => openSettings('blocklist')}
              />
            )}
          />
        )}

        {view === 'later' && (
          <LaterView
            tasks={later}
            todaySlots={slots}
            todayFull={todayFull}
            categories={state.categories}
            onAdd={(title) => five.addTask(title, 'later')}
            onComplete={five.completeTask}
            onMoveToday={(taskId) => five.moveTask(taskId, 'today')}
            onSwapIntoToday={five.swapIntoToday}
            onReorder={five.reorderTasks}
            onEditTask={five.editTask}
          />
        )}

        {view === 'ideas' && (
          <IdeasView
            ideas={ideas}
            todaySlots={slots}
            todayFull={todayFull}
            onAdd={(title) => five.addTask(title, 'ideas')}
            onMoveToday={(ideaId) => five.moveTask(ideaId, 'today')}
            onMoveLater={(ideaId) => five.moveTask(ideaId, 'later')}
            onDrop={five.deleteTask}
            onSwapIntoToday={five.swapIntoToday}
            onEditTask={five.editTask}
          />
        )}

        {view === 'routines' && (
          <RoutinesPage
            routines={state.recurringTasks}
            onAdd={five.addRecurringTask}
            onToggle={five.toggleRecurringTask}
            onDelete={five.deleteRecurringTask}
          />
        )}

        {view === 'settings' && (
          <SettingsPage
            initialSection={settingsSection}
            theme={state.theme}
            timer={state.pomodoro}
            categories={state.categories}
            sites={state.blocklist}
            sitesMissingAccess={sitesMissingAccess}
            pausesUsed={state.blockingPausesUsed}
            pausedUntil={state.blockingPausedUntil}
            onSetTheme={five.setTheme}
            onSetFocusMinutes={five.setFocusMinutes}
            onSetBreakMinutes={five.setBreakMinutes}
            onAddCategory={five.addCategory}
            onDeleteCategory={five.deleteCategory}
            onAddSite={five.addBlockedSite}
            onRemoveSite={five.removeBlockedSite}
            onAllowSites={five.allowBlockedSites}
            onPauseBlocking={five.pauseBlocking}
            onResumeBlocking={five.resumeBlocking}
            backup={<BackupSection state={state} onRestore={five.restoreBackup} />}
          />
        )}
      </div>

      {five.notice && <div className="toast" role="status" key={five.notice.id}>{five.notice.message}</div>}
    </main>
  );
}
