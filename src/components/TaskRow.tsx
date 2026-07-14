import { ArrowDown, ArrowUp, CaretDown, CaretUp, Check, Repeat } from '@phosphor-icons/react';

import type { Category, RecurringInstance, Task } from '../domain/models';

interface TaskRowProps {
  item: Task | RecurringInstance;
  category?: Category;
  kind?: 'task' | 'routine';
  sourceBucket?: 'today' | 'later';
  onComplete: () => void;
  onMove?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export function TaskRow({ item, category, kind = 'task', sourceBucket, onComplete, onMove, onMoveUp, onMoveDown, canMoveUp = false, canMoveDown = false }: TaskRowProps) {
  const hasActions = Boolean(onMove || onMoveUp || onMoveDown);

  return (
    <li className="task-row">
      <button className="task-check" onClick={onComplete} aria-label={`Complete ${item.title}`} title="Mark complete">
        <Check size={15} weight="bold" />
      </button>
      <div className="task-copy">
        <span className="task-title">{item.title}</span>
        {kind === 'routine' && <span className="task-meta"><span className="routine-label"><Repeat size={12} /> Routine</span></span>}
      </div>
      {(category || hasActions) && (
        <div className={hasActions ? 'task-trailing has-actions' : 'task-trailing'}>
          {category && <span className="category-label"><i style={{ background: category.color }} />{category.name}</span>}
          {hasActions && (
            <div className="task-actions">
              {(onMoveUp || onMoveDown) && (
                <span className="task-order" aria-label={`Reorder ${item.title}`}>
                  <button onClick={onMoveUp} disabled={!canMoveUp} aria-label={`Move ${item.title} up`} title="Move up"><CaretUp size={13} weight="bold" /></button>
                  <button onClick={onMoveDown} disabled={!canMoveDown} aria-label={`Move ${item.title} down`} title="Move down"><CaretDown size={13} weight="bold" /></button>
                </span>
              )}
              {onMove && (
                <button className="task-move" onClick={onMove} aria-label={sourceBucket === 'later' ? 'Move to Today' : 'Move to Later'} title={sourceBucket === 'later' ? 'Move to Today' : 'Move to Later'}>
                  {sourceBucket === 'later' ? <ArrowUp size={17} /> : <ArrowDown size={17} />}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
