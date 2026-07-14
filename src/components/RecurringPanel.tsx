import { Pause, Play, Plus, Trash } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';

import { RECURRING_LIMIT, type Category, type RecurrenceCadence, type RecurringTask } from '../domain/models';
import { cadenceLabel } from '../domain/recurrence';
import { EmptyState } from './EmptyState';
import { Select, type SelectOption } from './Select';

const CADENCE_OPTIONS: SelectOption<RecurrenceCadence>[] = [
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
];

const WEEKDAY_OPTIONS: SelectOption<number>[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
].map((label, value) => ({ label, value }));

interface RecurringPanelProps {
  tasks: RecurringTask[];
  categories: Category[];
  onAdd: (title: string, cadence: RecurrenceCadence, categoryId?: string, weekday?: number) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function RecurringPanel({ tasks, categories, onAdd, onToggle, onDelete }: RecurringPanelProps) {
  const [title, setTitle] = useState('');
  const [cadence, setCadence] = useState<RecurrenceCadence>('daily');
  const [categoryId, setCategoryId] = useState('');
  const [weekday, setWeekday] = useState(new Date().getDay());
  const isFull = tasks.length >= RECURRING_LIMIT;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onAdd(title, cadence, categoryId || undefined, cadence === 'weekly' ? weekday : undefined);
    setTitle('');
  }

  return (
    <div className="recurring-panel">
      <form className="routine-composer" onSubmit={submit}>
        <div className="routine-input">
          <Plus size={18} />
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={isFull ? 'Five routines is the limit' : 'Add a repeating task…'} aria-label="Recurring task title" disabled={isFull} />
        </div>
        <div className="routine-controls">
          <Select value={cadence} options={CADENCE_OPTIONS} onChange={setCadence} ariaLabel="Repeat schedule" className="cadence-select" disabled={isFull} />
          {cadence === 'weekly' && (
            <Select value={weekday} options={WEEKDAY_OPTIONS} onChange={setWeekday} ariaLabel="Weekday" className="weekday-select" disabled={isFull} />
          )}
          <Select
            value={categoryId}
            options={[{ value: '', label: 'No category' }, ...categories.map((category) => ({ value: category.id, label: category.name }))]}
            onChange={setCategoryId}
            ariaLabel="Routine category"
            className="category-select"
            disabled={isFull}
          />
          <button type="submit" disabled={isFull}>{isFull ? 'Limit reached' : 'Add routine'}</button>
        </div>
      </form>

      <div className="section-label"><span>Your routines</span><span>{tasks.length} of {RECURRING_LIMIT}</span></div>
      {tasks.length === 0 ? (
        <EmptyState title="No routines yet" body="Add up to five gentle defaults for the days you need them." />
      ) : (
        <ul className="routine-list">
          {tasks.map((task, index) => {
            const category = categories.find((item) => item.id === task.categoryId);
            return (
              <li className={task.enabled ? 'routine-row' : 'routine-row disabled'} key={task.id}>
                <span className="routine-index">{String(index + 1).padStart(2, '0')}</span>
                <div className="routine-copy">
                  <strong>{task.title}</strong>
                  <span>{cadenceLabel(task)}{category ? ` · ${category.name}` : ''}</span>
                </div>
                <button onClick={() => onToggle(task.id)} aria-label={task.enabled ? 'Pause routine' : 'Resume routine'} data-tooltip={task.enabled ? 'Pause routine' : 'Resume routine'}>
                  {task.enabled ? <Pause size={17} /> : <Play size={17} />}
                </button>
                <button onClick={() => onDelete(task.id)} aria-label="Delete routine" data-tooltip="Delete routine"><Trash size={17} /></button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
