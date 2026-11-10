import { ArrowCounterClockwise, ArrowsClockwise } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

import type { DaybookEntry } from '../domain/daybook';

interface DaybookCardProps {
  entries: DaybookEntry[];
  note: string;
  onNoteChange: (text: string) => void;
  onRestore: (entry: DaybookEntry) => void;
}

const NOTE_SAVE_DELAY = 400;
const VISIBLE_ENTRIES = 5;
const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const TIME_FORMATTER = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

function hourOf(timestamp: number): number {
  const date = new Date(timestamp);
  return date.getHours() + date.getMinutes() / 60;
}

function useMinuteClock(): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(interval);
  }, []);
  return now;
}

/** A hairline track of the waking day with a tick per completion and a marker for now. */
function DayStrip({ entries }: { entries: DaybookEntry[] }) {
  const now = useMinuteClock();
  const hours = entries.map((entry) => hourOf(entry.completedAt));
  const nowHour = hourOf(now);
  const start = Math.floor(Math.min(DAY_START_HOUR, ...hours));
  const end = Math.ceil(Math.min(24, Math.max(DAY_END_HOUR, nowHour + 0.5, ...hours)));
  const position = (hour: number) => `${((hour - start) / (end - start)) * 100}%`;

  return (
    <div className="day-strip" aria-hidden="true">
      <div className="day-track">
        <i className="day-elapsed" style={{ width: position(Math.min(nowHour, end)) }} />
        {entries.map((entry, index) => (
          <i key={`${entry.kind}-${entry.id}`} className="day-tick" style={{ left: position(hours[index]) }} />
        ))}
        <i className="day-now" style={{ left: position(Math.min(nowHour, end)) }} />
      </div>
      <div className="day-scale mono">
        <span>{String(start).padStart(2, '0')}</span>
        <span>{String(end % 24).padStart(2, '0')}</span>
      </div>
    </div>
  );
}

export function DaybookCard({ entries, note, onNoteChange, onRestore }: DaybookCardProps) {
  const [draft, setDraft] = useState(note);
  const [expanded, setExpanded] = useState(false);
  const editingRef = useRef(false);
  const saveTimeoutRef = useRef<number | undefined>(undefined);
  const newestFirst = [...entries].reverse();
  const visible = expanded ? newestFirst : newestFirst.slice(0, VISIBLE_ENTRIES);
  const earlierCount = newestFirst.length - VISIBLE_ENTRIES;

  useEffect(() => {
    if (!editingRef.current) setDraft(note);
  }, [note]);

  useEffect(() => () => window.clearTimeout(saveTimeoutRef.current), []);

  function scheduleSave(text: string) {
    window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => onNoteChange(text), NOTE_SAVE_DELAY);
  }

  function flush() {
    editingRef.current = false;
    window.clearTimeout(saveTimeoutRef.current);
    if (draft !== note) onNoteChange(draft);
  }

  return (
    <section className="daybook-card" aria-labelledby="daybook-title">
      <header className="daybook-header">
        <h2 id="daybook-title">Daybook</h2>
        <span className="mono daybook-count">{entries.length ? `${entries.length} done` : 'nothing yet'}</span>
      </header>

      <DayStrip entries={entries} />

      {entries.length ? (
        <ol className="crossed-list" aria-label="Crossed off today">
          {visible.map((entry) => (
            <li key={`${entry.kind}-${entry.id}`}>
              <time className="mono crossed-time" dateTime={new Date(entry.completedAt).toISOString()}>
                {TIME_FORMATTER.format(entry.completedAt)}
              </time>
              <span className="crossed-title">
                <s>{entry.title}</s>
                {entry.kind === 'routine' && <ArrowsClockwise className="crossed-routine" size={12} aria-label="Routine" />}
              </span>
              <button
                type="button"
                className="restore-button"
                onClick={() => onRestore(entry)}
                aria-label={`Restore ${entry.title}`}
                title="Restore"
              >
                <ArrowCounterClockwise size={14} />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className="daybook-empty">Tick something off and it lands here.</p>
      )}

      {earlierCount > 0 && (
        <button type="button" className="text-button daybook-more" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          {expanded ? 'Show less' : `${earlierCount} earlier`}
        </button>
      )}

      <textarea
        className="daybook-note"
        value={draft}
        onFocus={() => { editingRef.current = true; }}
        onBlur={flush}
        onChange={(event) => {
          setDraft(event.target.value);
          scheduleSave(event.target.value);
        }}
        placeholder="A line about today…"
        title="Clears at midnight"
        aria-label="Daily note"
        rows={1}
      />
    </section>
  );
}
