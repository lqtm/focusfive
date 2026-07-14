import { ArrowRight, CheckCircle, ShieldCheck } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';

import { AppHeader } from './components/AppHeader';
import { BlocklistModal } from './components/BlocklistModal';
import { CategoriesModal } from './components/CategoriesModal';
import { Daybook } from './components/Daybook';
import { EmptyState } from './components/EmptyState';
import { IdeaRow } from './components/IdeaRow';
import { ManualTaskList } from './components/ManualTaskList';
import { Pomodoro } from './components/Pomodoro';
import { PrivacyPanel } from './components/PrivacyPanel';
import { RecurringPanel } from './components/RecurringPanel';
import { TaskComposer } from './components/TaskComposer';
import { TaskRow } from './components/TaskRow';
import { UtilityDock } from './components/UtilityDock';
import { formatTodayHeading } from './domain/date';
import { getDaybookEntries } from './domain/daybook';
import { TODAY_LIMIT, type TabId } from './domain/models';
import { useCurrentDate } from './hooks/useCurrentDate';
import { useFiveState } from './hooks/useFiveState';

type OpenModal = 'categories' | 'blocklist' | null;

const pageCopy: Record<TabId, { title: string; description: string }> = {
  today: {
    title: 'TODAY',
    description: 'Up to five priorities.',
  },
  later: {
    title: 'LATER',
    description: 'Tasks outside Today.',
  },
  ideas: {
    title: 'IDEAS',
    description: 'Unsorted notes and possible tasks.',
  },
  recurring: {
    title: 'RECURRING',
    description: 'Up to five repeating tasks.',
  },
};

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const currentDate = useCurrentDate();
  const five = useFiveState(currentDate);
  const state = five.state;

  useEffect(() => {
    if (state?.privacyMode) window.scrollTo({ top: 0, behavior: 'auto' });
  }, [state?.privacyMode]);

  const blockedRedirect = new URLSearchParams(window.location.search).has('blocked');

  const visibleTasks = useMemo(() => {
    if (!state) return { today: [], later: [], ideas: [] };
    return {
      today: state.tasks.filter((task) => task.bucket === 'today' && !task.completedAt).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      later: state.tasks.filter((task) => task.bucket === 'later' && !task.completedAt).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      ideas: state.tasks.filter((task) => task.bucket === 'ideas' && !task.completedAt).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    };
  }, [state]);

  const daybookEntries = useMemo(() => state ? getDaybookEntries(state, currentDate) : [], [currentDate, state]);

  if (!state) {
    return <main className="loading-screen"><span>FIVE</span><p>Preparing your day…</p></main>;
  }

  const counts: Record<TabId, number> = {
    today: visibleTasks.today.length + five.todaysRecurring.length,
    later: visibleTasks.later.length,
    ideas: visibleTasks.ideas.length,
    recurring: state.recurringTasks.length,
  };
  const copy = pageCopy[activeTab];
  const togglePrivacyMode = () => {
    setOpenModal(null);
    five.togglePrivacyMode();
  };

  return (
    <main className="app-shell" data-theme={state.theme} data-privacy={state.privacyMode ? 'true' : 'false'}>
      {state.privacyMode ? (
        <PrivacyPanel
          wallpaperId={state.privacyWallpaper}
          onReveal={togglePrivacyMode}
          onSelectWallpaper={five.setPrivacyWallpaper}
        />
      ) : <>
        <AppHeader
          activeTab={activeTab}
          theme={state.theme}
          counts={counts}
          onTabChange={setActiveTab}
          onToggleTheme={five.toggleTheme}
          onTogglePrivacyMode={togglePrivacyMode}
        />

        <section className="workspace">
        {blockedRedirect && (
          <div className="blocked-banner">
            <ShieldCheck size={19} weight="light" />
            <div><strong>Welcome back.</strong><span>That site can wait until Today is clear.</span></div>
          </div>
        )}

        <header className="page-heading">
          <div className="title-row">
            <h1>{copy.title}{activeTab === 'today' && <><i />{formatTodayHeading(currentDate)}</>}</h1>
          </div>
          <p>{copy.description}</p>
        </header>

        {activeTab === 'today' && (
          <div className="view-panel today-panel">
            <TaskComposer bucket="today" categories={state.categories} onAdd={five.addTask} />

            <div className="section-label">
              <span>Priorities</span>
              <span>{five.activeTodayCount} of {TODAY_LIMIT}</span>
            </div>
            {visibleTasks.today.length ? (
              <ManualTaskList
                tasks={visibleTasks.today}
                categories={state.categories}
                sourceBucket="today"
                onComplete={five.completeTask}
                onMove={five.moveTask}
                onReorder={five.reorderTask}
              />
            ) : (
              <EmptyState title="Today is clear" body="Choose something from Later, or enjoy the space you made." />
            )}

            <div className="routine-due-section">
              <div className="section-label">
                <span>Daily routines</span>
                <span>{five.todaysRecurring.length} today</span>
              </div>
              {five.todaysRecurring.length ? (
                <ul className="task-list routine-due-list">
                  {five.todaysRecurring.map((instance) => (
                    <TaskRow
                      key={instance.id}
                      item={instance}
                      kind="routine"
                      category={state.categories.find((category) => category.id === instance.categoryId)}
                      onComplete={() => five.completeRecurringInstance(instance.id)}
                    />
                  ))}
                </ul>
              ) : (
                <div className="all-done"><CheckCircle size={18} /><span>No routines due right now.</span></div>
              )}
            </div>

            {visibleTasks.later.length > 0 && five.activeTodayCount < TODAY_LIMIT && (
              <button className="later-nudge" onClick={() => setActiveTab('later')}>
                <span>You have room for {TODAY_LIMIT - five.activeTodayCount} more.</span>
                <strong>Choose from Later <ArrowRight size={15} /></strong>
              </button>
            )}

          </div>
        )}

        {activeTab === 'later' && (
          <div className="view-panel">
            <TaskComposer bucket="later" categories={state.categories} onAdd={five.addTask} />
            <div className="section-label"><span>Backlog</span><span>{visibleTasks.later.length} waiting</span></div>
            {visibleTasks.later.length ? (
              <ManualTaskList
                tasks={visibleTasks.later}
                categories={state.categories}
                sourceBucket="later"
                onComplete={five.completeTask}
                onMove={five.moveTask}
                onReorder={five.reorderTask}
              />
            ) : (
              <EmptyState title="Nothing waiting" body="Your Later list is quiet. Keep it that way if you can." />
            )}
          </div>
        )}

        {activeTab === 'ideas' && (
          <div className="view-panel ideas-panel">
            <TaskComposer bucket="ideas" categories={state.categories} onAdd={five.addTask} />
            <div className="section-label"><span>Untriaged</span><span>{visibleTasks.ideas.length} captured</span></div>
            {visibleTasks.ideas.length ? (
              <ul className="idea-list">
                {visibleTasks.ideas.map((idea) => (
                  <IdeaRow
                    key={idea.id}
                    idea={idea}
                    category={state.categories.find((category) => category.id === idea.categoryId)}
                    onMoveToday={() => five.moveTask(idea.id, 'today')}
                    onMoveLater={() => five.moveTask(idea.id, 'later')}
                    onDiscard={() => five.deleteTask(idea.id)}
                  />
                ))}
              </ul>
            ) : (
              <EmptyState title="Nothing rattling around" body="When an idea arrives, catch it here before deciding what it needs from you." />
            )}
          </div>
        )}

        {activeTab === 'recurring' && (
          <RecurringPanel
            tasks={state.recurringTasks}
            categories={state.categories}
            onAdd={five.addRecurringTask}
            onToggle={five.toggleRecurringTask}
            onDelete={five.deleteRecurringTask}
          />
        )}
        </section>

        <Daybook
          entries={daybookEntries}
          openCount={five.activeTodayCount + five.todaysRecurring.length}
          date={currentDate}
          minimized={state.daybookMinimized}
          onRestoreTask={five.restoreTask}
          onRestoreRoutine={five.restoreRecurringInstance}
          onClear={five.clearDaybook}
          onToggleMinimized={five.toggleDaybook}
        />

        <UtilityDock
          blockCount={state.blocklist.length}
          categoryCount={state.categories.length}
          onOpenBlocklist={() => setOpenModal('blocklist')}
          onOpenCategories={() => setOpenModal('categories')}
        />
      </>}
      <Pomodoro
        timer={state.pomodoro}
        onStartPause={five.startPausePomodoro}
        onReset={five.resetPomodoro}
        onComplete={five.completePomodoro}
        onSetFocusMinutes={five.setFocusMinutes}
        onSetBreakMinutes={five.setBreakMinutes}
      />

      {!state.privacyMode && openModal === 'categories' && (
        <CategoriesModal categories={state.categories} onAdd={five.addCategory} onDelete={five.deleteCategory} onClose={() => setOpenModal(null)} />
      )}
      {!state.privacyMode && openModal === 'blocklist' && (
        <BlocklistModal
          sites={state.blocklist}
          pausesUsed={state.blockingPausesUsed}
          pausedUntil={state.blockingPausedUntil}
          onAdd={five.addBlockedSite}
          onRemove={five.removeBlockedSite}
          onPause={five.pauseBlocking}
          onResume={five.resumeBlocking}
          onClose={() => setOpenModal(null)}
        />
      )}

      {five.notice && <div className="toast" role="status" key={five.notice.id}>{five.notice.message}</div>}
    </main>
  );
}
