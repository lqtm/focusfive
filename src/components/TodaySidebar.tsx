import type { ReactNode } from 'react';

import type { RecurringInstance } from '../domain/models';
import { CheckButton } from './CheckButton';

interface TodaySidebarProps {
  daybook: ReactNode;
  routinesDefined: number;
  dueRoutines: RecurringInstance[];
  blockedSites: number;
  sitesNeedingAccess: number;
  blockingPausedMinutes: number | null;
  sessions: number;
  onCompleteRoutine: (instanceId: string) => void;
  onManageRoutines: () => void;
  onOpenBlocklist: () => void;
}

export function TodaySidebar({
  daybook,
  routinesDefined,
  dueRoutines,
  blockedSites,
  sitesNeedingAccess,
  blockingPausedMinutes,
  sessions,
  onCompleteRoutine,
  onManageRoutines,
  onOpenBlocklist,
}: TodaySidebarProps) {
  const routineSummary = routinesDefined === 0
    ? 'None set'
    : dueRoutines.length ? `${dueRoutines.length} due` : 'Nothing due';
  const blockSummary = blockingPausedMinutes
    ? `paused · ${blockingPausedMinutes}m`
    : sitesNeedingAccess
      ? `${sitesNeedingAccess} need${sitesNeedingAccess === 1 ? 's' : ''} your OK`
      : `${blockedSites} ${blockedSites === 1 ? 'site' : 'sites'}`;

  return (
    <aside className="today-side" aria-label="Daybook and status">
      {daybook}

      <ul className="status-list">
        <li className="status-row routines-row">
          <div className="status-line">
            <span>Routines</span>
            <span className="status-value">
              <span className="mono">{routineSummary}</span>
              <span aria-hidden="true">·</span>
              <button type="button" className="text-button" onClick={onManageRoutines}>Manage</button>
            </span>
          </div>
          {dueRoutines.length > 0 && (
            <ul className="routine-due-list" aria-label="Routines due today">
              {dueRoutines.map((instance) => (
                <li key={instance.id}>
                  <CheckButton size="small" done={false} title={instance.title} onToggle={() => onCompleteRoutine(instance.id)} />
                  <span>{instance.title}</span>
                </li>
              ))}
            </ul>
          )}
        </li>
        <li className="status-row">
          <button type="button" className="status-line status-link" onClick={onOpenBlocklist}>
            <span>Blocked during focus</span>
            <span className="mono status-value">{blockSummary}</span>
          </button>
        </li>
        <li className="status-row">
          <div className="status-line">
            <span>Focus today</span>
            <span className="mono status-value">{sessions} {sessions === 1 ? 'session' : 'sessions'}</span>
          </div>
        </li>
      </ul>
    </aside>
  );
}
