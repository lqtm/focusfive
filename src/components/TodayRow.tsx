import { ArrowDown, Lightbulb, NotePencil } from '@phosphor-icons/react';
import { Reorder, useDragControls } from 'motion/react';
import { useState } from 'react';

import type { Category, PomodoroState, Task } from '../domain/models';
import { CategoryChip } from './CategoryChip';
import { CheckButton } from './CheckButton';
import { NowTimerButton } from './NowTimerButton';
import { DragHandle } from './Sortable';
import { TaskEditor, type EditField } from './TaskEditor';
import { TaskHint } from './TaskHint';

interface TodayRowProps {
  task: Task;
  slot: number;
  isNow: boolean;
  category?: Category;
  timer: PomodoroState;
  onToggleDone: () => void;
  onFocus: () => void;
  onStart: () => void;
  onSendToLater: () => void;
  onSendToIdeas: () => void;
  editing: EditField | null;
  onEdit: (field: EditField) => void;
  onSaveEdit: (title: string, hint: string) => void;
  onCloseEdit: () => void;
  onMove: (delta: number) => boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export function TodayRow({
  task,
  slot,
  isNow,
  category,
  timer,
  onToggleDone,
  onFocus,
  onStart,
  onSendToLater,
  onSendToIdeas,
  editing,
  onEdit,
  onSaveEdit,
  onCloseEdit,
  onMove,
  onDragStart,
  onDragEnd,
}: TodayRowProps) {
  const controls = useDragControls();
  const [dragging, setDragging] = useState(false);
  const done = Boolean(task.completedAt);
  const className = ['slot-row', isNow ? 'is-now' : '', done ? 'is-done' : '', dragging ? 'is-dragging' : ''].filter(Boolean).join(' ');

  return (
    <Reorder.Item
      value={task.id}
      className={className}
      aria-current={isNow ? 'step' : undefined}
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
      <CheckButton done={done} title={task.title} onToggle={onToggleDone} />
      <DragHandle controls={controls} label={`Slot ${slot}, ${task.title}`} className="slot-handle" onMove={onMove}>
        <span className="mono slot-number" aria-hidden="true">{String(slot).padStart(2, '0')}</span>
      </DragHandle>
      <div className="slot-body">
        {editing && !done ? (
          <TaskEditor
            title={task.title}
            hint={task.hint}
            focus={editing}
            titleClassName="slot-title"
            onSave={onSaveEdit}
            onClose={onCloseEdit}
          />
        ) : (
          <>
            {isNow || done ? (
              <span className="slot-title" onDoubleClick={done ? undefined : () => onEdit('title')}>{task.title}</span>
            ) : (
              <button
                type="button"
                className="slot-title slot-title-button"
                tabIndex={-1}
                onClick={onFocus}
                onDoubleClick={() => onEdit('title')}
                title="Make this Now · double-click to edit"
              >
                {task.title}
              </button>
            )}
            <TaskHint hint={task.hint} onEdit={done ? undefined : () => onEdit('hint')} />
          </>
        )}
        {isNow && (
          <span className="now-meta">
            <i className="accent-dot" aria-hidden="true" />
            Now{category ? ` · ${category.name}` : ''}
          </span>
        )}
      </div>
      <div className="slot-actions">
        {!done && (
          <span className="row-moves">
            <button type="button" className="icon-button small" onClick={() => onEdit('title')} aria-label={`Edit ${task.title}`} title="Edit task and hint (E)">
              <NotePencil size={16} aria-hidden="true" />
            </button>
            <button type="button" className="icon-button small" onClick={onSendToLater} aria-label={`Send ${task.title} to Later`} title="Send to Later (L)">
              <ArrowDown size={16} aria-hidden="true" />
            </button>
            <button type="button" className="icon-button small" onClick={onSendToIdeas} aria-label={`Send ${task.title} back to Ideas`} title="Back to Ideas for triage (I)">
              <Lightbulb size={16} aria-hidden="true" />
            </button>
          </span>
        )}
        {isNow ? (
          <NowTimerButton timer={timer} onStart={onStart} />
        ) : !done && (
          <>
            <CategoryChip category={category} />
            <button type="button" className="ghost-button" onClick={onFocus} aria-label={`Focus on ${task.title}`}>Focus</button>
          </>
        )}
      </div>
    </Reorder.Item>
  );
}
