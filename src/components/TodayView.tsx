import { ShieldCheck } from '@phosphor-icons/react';
import { Reorder } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { TODAY_LIMIT, type Category, type PomodoroState, type Task } from '../domain/models';
import { isInteractiveTarget, useHotkeys } from '../hooks/useHotkeys';
import { Composer } from './Composer';
import { useDraftOrder } from './Sortable';
import { SwapPicker } from './SwapPicker';
import type { EditField } from './TaskEditor';
import { TodayRow } from './TodayRow';

interface TodayViewProps {
  slots: Task[];
  nowTask?: Task;
  categories: Category[];
  timer: PomodoroState;
  blockedRedirect: boolean;
  sidebar: ReactNode;
  onAdd: (rawTitle: string) => void;
  onToggleDone: (task: Task) => void;
  onSetNow: (taskId: string) => void;
  onStart: () => void;
  onSendToLater: (taskId: string) => void;
  onSendToIdeas: (taskId: string) => void;
  onEditTask: (taskId: string, title: string, hint: string) => void;
  onFreeSlot: (taskId: string) => void;
  onClearDone: () => void;
  onReorder: (orderedIds: string[]) => void;
}

const PREVIOUS_KEYS = new Set(['arrowup', 'k']);
const NEXT_KEYS = new Set(['arrowdown', 'j']);

function slotWord(count: number): string {
  return count === 1 ? 'slot' : 'slots';
}

export function TodayView({
  slots,
  nowTask,
  categories,
  timer,
  blockedRedirect,
  sidebar,
  onAdd,
  onToggleDone,
  onSetNow,
  onStart,
  onSendToLater,
  onSendToIdeas,
  onEditTask,
  onFreeSlot,
  onClearDone,
  onReorder,
}: TodayViewProps) {
  const composerRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editing, setEditing] = useState<{ taskId: string; field: EditField } | null>(null);
  const [focusComposerWhenFree, setFocusComposerWhenFree] = useState(false);
  const doneCount = slots.filter((task) => task.completedAt).length;
  const freeCount = TODAY_LIMIT - slots.length;
  const order = useDraftOrder(slots, onReorder);

  useEffect(() => {
    if (!focusComposerWhenFree || freeCount <= 0) return;
    composerRef.current?.focus();
    setFocusComposerWhenFree(false);
  }, [focusComposerWhenFree, freeCount]);

  useHotkeys((event) => {
    const key = event.key.toLowerCase();
    if (key === 'n') {
      if (freeCount > 0) composerRef.current?.focus();
      else setPickerOpen(true);
      return true;
    }
    if (key === 'l' && nowTask) {
      onSendToLater(nowTask.id);
      return true;
    }
    if ((key === 'e' || key === 'h') && nowTask) {
      setEditing({ taskId: nowTask.id, field: key === 'e' ? 'title' : 'hint' });
      return true;
    }
    if (key === 'i' && nowTask) {
      onSendToIdeas(nowTask.id);
      return true;
    }
    const step = PREVIOUS_KEYS.has(key) ? -1 : NEXT_KEYS.has(key) ? 1 : 0;
    if (step && nowTask) {
      if (event.shiftKey) {
        order.move(nowTask.id, step);
        return true;
      }
      const open = order.ordered.filter((task) => !task.completedAt);
      const target = open[open.findIndex((task) => task.id === nowTask.id) + step];
      if (target) onSetNow(target.id);
      return true;
    }
    if (key === 'enter' && nowTask && !isInteractiveTarget(event.target)) {
      onStart();
      return true;
    }
    const slotNumber = Number(event.key);
    if (Number.isInteger(slotNumber) && slotNumber >= 1 && slotNumber <= TODAY_LIMIT) {
      const task = order.ordered[slotNumber - 1];
      if (task && !task.completedAt) onSetNow(task.id);
      return true;
    }
    return false;
  });

  const footerMessage = doneCount > 0
    ? `${doneCount} done — clearing frees ${doneCount} ${slotWord(doneCount)}.`
    : freeCount === 0
      ? 'All five slots taken. Finish one or send it to Later to add more.'
      : `${freeCount} ${slotWord(freeCount)} free.`;

  return (
    <div className="today-layout">
      <section className="today-main" aria-labelledby="today-title">
        {blockedRedirect && (
          <p className="blocked-note">
            <ShieldCheck size={17} aria-hidden="true" />
            That site is blocked while Today has open work.
          </p>
        )}

        <header className="list-header">
          <h1 id="today-title">Today</h1>
          <span className="mono list-meta">{doneCount} of {TODAY_LIMIT} done</span>
        </header>

        <Reorder.Group as="ol" axis="y" className="slot-list" values={order.orderedIds} onReorder={order.reorder}>
          {order.ordered.map((task, index) => (
            <TodayRow
              key={task.id}
              task={task}
              slot={index + 1}
              isNow={task.id === nowTask?.id}
              category={categories.find((category) => category.id === task.categoryId)}
              timer={timer}
              onToggleDone={() => onToggleDone(task)}
              onFocus={() => onSetNow(task.id)}
              onStart={onStart}
              onSendToLater={() => onSendToLater(task.id)}
              onSendToIdeas={() => onSendToIdeas(task.id)}
              editing={editing?.taskId === task.id ? editing.field : null}
              onEdit={(field) => setEditing({ taskId: task.id, field })}
              onSaveEdit={(title, hint) => onEditTask(task.id, title, hint)}
              onCloseEdit={() => setEditing((current) => current?.taskId === task.id ? null : current)}
              onMove={(delta) => order.move(task.id, delta)}
              onDragStart={order.startDrag}
              onDragEnd={order.endDrag}
            />
          ))}
        </Reorder.Group>
        {freeCount > 0 && (
          <div className="slot-list slot-list-tail">
            <div className="slot-row slot-composer">
              <span className="check-spacer" aria-hidden="true" />
              <span className="mono slot-number" aria-hidden="true">{String(slots.length + 1).padStart(2, '0')}</span>
              <Composer
                inputRef={composerRef}
                variant="inline"
                placeholder="Add a priority — #tag, // hint"
                label="Add a priority to Today"
                onSubmit={onAdd}
              />
            </div>
          </div>
        )}

        <footer className="today-footer">
          <p className="footer-message">
            {footerMessage}
            {doneCount > 0 && (
              <button type="button" className="text-button" onClick={onClearDone}>Clear done</button>
            )}
          </p>
          <p className="mono key-hints" aria-label="Keyboard shortcuts">
            <span><kbd>N</kbd> new</span>
            <span aria-hidden="true">·</span>
            <span><kbd>↑↓</kbd> pick</span>
            <span aria-hidden="true">·</span>
            <span><kbd>⇧↑↓</kbd> move</span>
            <span aria-hidden="true">·</span>
            <span><kbd>↵</kbd> start</span>
            <span aria-hidden="true">·</span>
            <span><kbd>E</kbd> edit</span>
            <span aria-hidden="true">·</span>
            <span><kbd>L</kbd>/<kbd>I</kbd> to Later/Ideas</span>
          </p>
          {pickerOpen && (
            <SwapPicker
              title="Make room — which slot goes?"
              slots={slots}
              onClose={() => setPickerOpen(false)}
              onPick={(taskId) => {
                onFreeSlot(taskId);
                setPickerOpen(false);
                setFocusComposerWhenFree(true);
              }}
            />
          )}
        </footer>
      </section>

      {sidebar}
    </div>
  );
}
