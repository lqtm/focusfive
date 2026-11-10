import { useEffect, useId, useRef, type KeyboardEvent } from 'react';

import type { Task } from '../domain/models';

interface SwapPickerProps {
  title: string;
  slots: Task[];
  onPick: (taskId: string) => void;
  onClose: () => void;
  className?: string;
}

/** Popover listing the Today slots; picking one frees it for an incoming task. */
export function SwapPicker({ title, slots, onPick, onClose, className = '' }: SwapPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    buttonRefs.current[0]?.focus();
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
    };
  }, [onClose]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
      const slotNumber = Number(event.key);
      if (slotNumber >= 1 && slotNumber <= slots.length) {
        event.preventDefault();
        onPick(slots[slotNumber - 1].id);
      }
      return;
    }
    event.preventDefault();
    const current = buttonRefs.current.findIndex((button) => button === document.activeElement);
    const direction = event.key === 'ArrowDown' ? 1 : -1;
    buttonRefs.current[(current + direction + slots.length) % slots.length]?.focus();
  }

  return (
    <div
      ref={rootRef}
      className={`swap-picker ${className}`.trim()}
      role="dialog"
      aria-labelledby={titleId}
      onKeyDown={handleKeyDown}
    >
      <p id={titleId} className="swap-title">{title}</p>
      <ul>
        {slots.map((task, index) => (
          <li key={task.id}>
            <button
              ref={(node) => { buttonRefs.current[index] = node; }}
              type="button"
              className={task.completedAt ? 'swap-option done' : 'swap-option'}
              onClick={() => onPick(task.id)}
            >
              <span className="mono slot-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="swap-option-title">{task.title}</span>
              <span className="mono swap-option-meta">{task.completedAt ? 'clear' : 'to Later'}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
