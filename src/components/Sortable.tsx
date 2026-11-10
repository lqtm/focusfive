import { DotsSixVertical } from '@phosphor-icons/react';
import type { DragControls } from 'motion/react';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

interface Identified {
  id: string;
}

function swap(ids: string[], index: number, delta: number): string[] | null {
  const target = index + delta;
  if (index < 0 || target < 0 || target >= ids.length) return null;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Local ordering for a drag-reorderable list. Drags reorder a draft that is only persisted on release,
 * and the draft is held until the persisted order catches up so rows never snap back for a frame.
 */
export function useDraftOrder<T extends Identified>(items: T[], onCommit: (orderedIds: string[]) => void) {
  const [draft, setDraft] = useState<string[] | null>(null);
  const [dragging, setDragging] = useState(false);
  const draftRef = useRef<string[] | null>(null);
  const ids = items.map((item) => item.id);
  const persistedKey = ids.join('|');

  useEffect(() => {
    if (!draft || dragging) return;
    if (draft.join('|') === persistedKey) {
      setDraft(null);
      return;
    }
    const fallback = window.setTimeout(() => setDraft(null), 1500);
    return () => window.clearTimeout(fallback);
  }, [draft, dragging, persistedKey]);

  const position = new Map((draft ?? ids).map((id, index) => [id, index]));
  const ordered = draft
    ? [...items].sort((a, b) => (position.get(a.id) ?? Infinity) - (position.get(b.id) ?? Infinity))
    : items;
  const orderedIds = ordered.map((item) => item.id);

  /** Accepts the reordered visible prefix of the list; anything not shown keeps its place after it. */
  const reorder = (nextVisible: string[]) => {
    const shown = new Set(nextVisible);
    const next = [...nextVisible, ...orderedIds.filter((id) => !shown.has(id))];
    draftRef.current = next;
    setDraft(next);
  };

  const startDrag = () => setDragging(true);

  const endDrag = () => {
    setDragging(false);
    const next = draftRef.current;
    draftRef.current = null;
    if (next && next.join('|') !== persistedKey) onCommit(next);
    else setDraft(null);
  };

  const move = (id: string, delta: number): boolean => {
    const next = swap(orderedIds, orderedIds.indexOf(id), delta);
    if (!next) return false;
    onCommit(next);
    return true;
  };

  return { ordered, orderedIds, reorder, startDrag, endDrag, move, dragging };
}

interface DragHandleProps {
  controls: DragControls;
  label: string;
  className?: string;
  children?: ReactNode;
  onMove: (delta: number) => boolean;
}

/** Pointer drag starts the reorder; ArrowUp/ArrowDown move the row one place while the handle has focus. */
export function DragHandle({ controls, label, className, children, onMove }: DragHandleProps) {
  const onKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const delta = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (!delta) return;
    event.preventDefault();
    event.stopPropagation();
    onMove(delta);
  }, [onMove]);

  return (
    <button
      type="button"
      className={['drag-handle', className].filter(Boolean).join(' ')}
      aria-label={`${label}. Drag, or use the arrow keys, to reorder.`}
      title="Drag to reorder"
      onPointerDown={(event) => {
        event.preventDefault();
        controls.start(event);
      }}
      onKeyDown={onKeyDown}
    >
      {children}
      <DotsSixVertical className="drag-grip" size={16} weight="bold" aria-hidden="true" />
    </button>
  );
}
