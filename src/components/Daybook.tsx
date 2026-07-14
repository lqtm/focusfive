import { ArrowCounterClockwise, Check, Minus, Notebook, Repeat, X } from '@phosphor-icons/react';

import { formatLongDate, localDateKey } from '../domain/date';
import type { DaybookEntry } from '../domain/daybook';

interface DaybookProps {
  entries: DaybookEntry[];
  openCount: number;
  date: Date;
  minimized: boolean;
  onRestoreTask: (id: string) => void;
  onRestoreRoutine: (id: string) => void;
  onClear: () => void;
  onToggleMinimized: () => void;
}

export function Daybook({ entries, openCount, date, minimized, onRestoreTask, onRestoreRoutine, onClear, onToggleMinimized }: DaybookProps) {
  const total = entries.length + openCount;
  const progress = total ? Math.round((entries.length / total) * 100) : 0;

  return (
    <aside className={minimized ? 'daybook minimized' : 'daybook'} aria-label="Today’s daybook">
      <button
        className="daybook-minimize"
        onClick={onToggleMinimized}
        aria-label={minimized ? 'Expand Daybook' : 'Minimize Daybook'}
        title={minimized ? 'Expand Daybook' : 'Minimize Daybook'}
      >
        {minimized ? <Notebook size={16} weight="light" /> : <Minus size={15} />}
      </button>
      {minimized ? <span className="daybook-minimized-label">Daybook</span> : (
        <>
          <header className="daybook-header">
            <span className="daybook-icon"><Notebook size={15} weight="light" /></span>
            <div>
              <span>Daily note</span>
              <h2>Daybook</h2>
            </div>
            <time dateTime={localDateKey(date)}>{formatLongDate(date)}</time>
          </header>

          <div className="daybook-summary" aria-label={`${entries.length} completed and ${openCount} open`}>
            <div><strong>{entries.length}</strong><span>Done</span></div>
            <div><strong>{openCount}</strong><span>Open</span></div>
            <div className="daybook-progress" aria-hidden="true"><i style={{ width: `${progress}%` }} /></div>
          </div>

          <section className="daybook-log">
            <div className="daybook-label"><span>Crossed off</span><span>{String(entries.length).padStart(2, '0')}</span></div>
            {entries.length ? (
              <ul>
                {entries.map((entry) => (
                  <li key={`${entry.kind}-${entry.id}`}>
                    <Check size={12} weight="bold" aria-hidden="true" />
                    <span title={entry.title}>{entry.title}</span>
                    {entry.kind === 'routine' && <Repeat size={11} aria-label="Routine" />}
                    <button
                      onClick={() => entry.kind === 'routine' ? onRestoreRoutine(entry.id) : onRestoreTask(entry.id)}
                      aria-label={`Restore ${entry.title}`}
                      title="Restore"
                    >
                      <ArrowCounterClockwise size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="daybook-empty">Nothing crossed off on this page yet.</p>
            )}
          </section>

          <footer className="daybook-footer">
            <span>Fresh page tomorrow</span>
            <button onClick={onClear} disabled={!entries.length} aria-label="Clear today’s daybook" title="Clear today">
              <X size={12} /> Clear
            </button>
          </footer>
        </>
      )}
    </aside>
  );
}
