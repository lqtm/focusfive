import { Pause, Play, Trash } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';

import { RECURRING_LIMIT, type RecurrenceCadence, type RecurringTask } from '../domain/models';
import { cadenceLabel, WEEKDAY_SHORT } from '../domain/recurrence';
import { Segmented, type SegmentedOption } from './Segmented';

const CADENCE_OPTIONS: SegmentedOption<RecurrenceCadence>[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
];

const WEEKDAY_OPTIONS: SegmentedOption<number>[] = [1, 2, 3, 4, 5, 6, 0].map((value) => ({ value, label: WEEKDAY_SHORT[value] }));

interface RoutinesPageProps {
  routines: RecurringTask[];
  onAdd: (title: string, cadence: RecurrenceCadence, weekday?: number) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RoutinesPage({ routines, onAdd, onToggle, onDelete }: RoutinesPageProps) {
  const [title, setTitle] = useState('');
  const [cadence, setCadence] = useState<RecurrenceCadence>('daily');
  const [weekday, setWeekday] = useState(() => new Date().getDay());
  const isFull = routines.length >= RECURRING_LIMIT;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || isFull) return;
    onAdd(title, cadence, cadence === 'weekly' ? weekday : undefined);
    setTitle('');
  }

  return (
    <section className="list-page" aria-labelledby="routines-title">
      <header className="list-header">
        <h1 id="routines-title">Routines</h1>
        <span className="mono list-meta">{routines.length} of {RECURRING_LIMIT}</span>
      </header>
      <p className="page-subtext">They show up under Today on the days they’re due. They don’t use a priority slot.</p>

      <form className="routine-add" onSubmit={submit}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={isFull ? 'Five routines is the limit' : 'Add a routine'}
          aria-label="Routine title"
          disabled={isFull}
          autoComplete="off"
        />
        <div className="routine-add-controls">
          <Segmented label="Frequency" value={cadence} options={CADENCE_OPTIONS} onChange={setCadence} disabled={isFull} />
          <button type="submit" className="ink-button" disabled={isFull || !title.trim()}>Add</button>
        </div>
        {cadence === 'weekly' && (
          <Segmented label="Day of the week" value={weekday} options={WEEKDAY_OPTIONS} onChange={setWeekday} disabled={isFull} className="weekday-picker" />
        )}
      </form>

      <ol className="routine-slots">
        {Array.from({ length: RECURRING_LIMIT }, (_, index) => {
          const routine = routines[index];
          const number = <span className="mono slot-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>;
          if (!routine) {
            return <li key={`empty-${index}`} className="routine-slot empty">{number}<span>Empty</span></li>;
          }
          return (
            <li key={routine.id} className={routine.enabled ? 'routine-slot filled' : 'routine-slot filled paused'}>
              {number}
              <span className="routine-title">{routine.title}</span>
              <span className="mono routine-frequency">{routine.enabled ? cadenceLabel(routine) : 'Paused'}</span>
              <span className="routine-actions">
                <button
                  type="button"
                  className="icon-button small"
                  onClick={() => onToggle(routine.id)}
                  aria-label={`${routine.enabled ? 'Pause' : 'Resume'} ${routine.title}`}
                  title={routine.enabled ? 'Pause' : 'Resume'}
                >
                  {routine.enabled ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <button
                  type="button"
                  className="icon-button small"
                  onClick={() => onDelete(routine.id)}
                  aria-label={`Delete ${routine.title}`}
                  title="Delete"
                >
                  <Trash size={15} />
                </button>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
