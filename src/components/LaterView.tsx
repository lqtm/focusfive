import { ArrowUp, NotePencil } from '@phosphor-icons/react';
import { Reorder, useDragControls } from 'motion/react';
import { useRef, useState, type ReactNode } from 'react';

import type { Category, Task } from '../domain/models';
import { useHotkeys } from '../hooks/useHotkeys';
import { CategoryChip } from './CategoryChip';
import { CheckButton } from './CheckButton';
import { Composer } from './Composer';
import { DragHandle, useDraftOrder } from './Sortable';
import { SwapPicker } from './SwapPicker';
import { TaskEditor, type EditField } from './TaskEditor';
import { TaskHint } from './TaskHint';

const PAGE_SIZE = 8;

interface LaterViewProps {
  tasks: Task[];
  todaySlots: Task[];
  todayFull: boolean;
  categories: Category[];
  onAdd: (rawTitle: string) => void;
  onComplete: (taskId: string) => void;
  onMoveToday: (taskId: string) => void;
  onSwapIntoToday: (incomingId: string, outgoingId: string) => void;
  onReorder: (orderedIds: string[]) => void;
  onEditTask: (taskId: string, title: string, hint: string) => void;
}

interface LaterRowProps {
  task: Task;
  children: ReactNode;
  onMove: (delta: number) => boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function LaterRow({ task, children, onMove, onDragStart, onDragEnd }: LaterRowProps) {
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);
  return (
    <Reorder.Item
      value={task.id}
      className={dragging ? 'plain-row is-dragging' : 'plain-row'}
      layout="position"
      dragListener={false}
      dragControls={controls}
      onDragStart={() => {
        setDragging(true);
        onDragStart();
      }}
      onDragEnd={() => {
        setDragging(false);
        onDragEnd();
      }}
    >
      <DragHandle controls={controls} label={task.title} className="gutter-handle" onMove={onMove} />
      {children}
    </Reorder.Item>
  );
}

export function LaterView({ tasks, todaySlots, todayFull, categories, onAdd, onComplete, onMoveToday, onSwapIntoToday, onReorder, onEditTask }: LaterViewProps) {
  const composerRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [swapTaskId, setSwapTaskId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ taskId: string; field: EditField } | null>(null);
  const order = useDraftOrder(tasks, onReorder);
  const visible = expanded ? order.ordered : order.ordered.slice(0, PAGE_SIZE);
  const hiddenCount = tasks.length - visible.length;

  useHotkeys((event) => {
    if (event.key.toLowerCase() !== 'n') return false;
    composerRef.current?.focus();
    return true;
  });

  return (
    <section className="list-page" aria-labelledby="later-title">
      <header className="list-header">
        <h1 id="later-title">Later</h1>
        <span className="mono list-meta">{tasks.length}</span>
      </header>

      <Composer inputRef={composerRef} placeholder="Add for later — #tag, // hint" label="Add a task for later" onSubmit={onAdd} />

      {todayFull && tasks.length > 0 && (
        <p className="inline-note">Today is full. Moving something up asks which slot to swap out.</p>
      )}

      {tasks.length ? (
        <Reorder.Group
          as="ul"
          axis="y"
          className="plain-list"
          values={visible.map((task) => task.id)}
          onReorder={order.reorder}
        >
          {visible.map((task) => (
            <LaterRow
              key={task.id}
              task={task}
              onMove={(delta) => order.move(task.id, delta)}
              onDragStart={order.startDrag}
              onDragEnd={order.endDrag}
            >
              <CheckButton done={false} title={task.title} onToggle={() => onComplete(task.id)} />
              <div className="plain-body">
                {editing?.taskId === task.id ? (
                  <TaskEditor
                    title={task.title}
                    hint={task.hint}
                    focus={editing.field}
                    titleClassName="plain-title"
                    onSave={(title, hint) => onEditTask(task.id, title, hint)}
                    onClose={() => setEditing((current) => current?.taskId === task.id ? null : current)}
                  />
                ) : (
                  <>
                    <span className="plain-title" onDoubleClick={() => setEditing({ taskId: task.id, field: 'title' })}>{task.title}</span>
                    <TaskHint hint={task.hint} onEdit={() => setEditing({ taskId: task.id, field: 'hint' })} />
                  </>
                )}
              </div>
              <button
                type="button"
                className="icon-button small row-hint-button"
                onClick={() => setEditing({ taskId: task.id, field: 'title' })}
                aria-label={`Edit ${task.title}`}
                title="Edit task and hint"
              >
                <NotePencil size={16} aria-hidden="true" />
              </button>
              <CategoryChip category={categories.find((category) => category.id === task.categoryId)} />
              <button
                type="button"
                className="ghost-button"
                onClick={() => todayFull ? setSwapTaskId(task.id) : onMoveToday(task.id)}
                aria-label={`Move ${task.title} to Today`}
                aria-haspopup={todayFull ? 'dialog' : undefined}
                aria-expanded={todayFull ? swapTaskId === task.id : undefined}
              >
                <ArrowUp size={13} aria-hidden="true" /> Today
              </button>
              {swapTaskId === task.id && (
                <SwapPicker
                  title="Swap with which?"
                  slots={todaySlots}
                  onClose={() => setSwapTaskId(null)}
                  onPick={(outgoingId) => {
                    onSwapIntoToday(task.id, outgoingId);
                    setSwapTaskId(null);
                  }}
                />
              )}
            </LaterRow>
          ))}
        </Reorder.Group>
      ) : (
        <p className="empty-box">Nothing waiting. Keep it that way if you can.</p>
      )}

      {hiddenCount > 0 && (
        <button type="button" className="text-button show-more" onClick={() => setExpanded(true)}>
          Show {hiddenCount} more
        </button>
      )}
    </section>
  );
}
