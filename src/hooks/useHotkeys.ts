import { useEffect, useRef } from 'react';

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT';
}

export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return isTypingTarget(target) || Boolean(target.closest('button, a, [role="button"], [role="radio"], [role="option"]'));
}

/**
 * Bind single-key shortcuts while mounted. Return `true` from the handler to mark the key as handled.
 * Capture-phase handlers run before bubble-phase ones and can claim a key first.
 */
export function useHotkeys(handler: (event: KeyboardEvent) => boolean | void, enabled = true, capture = false): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const listener = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
      if (isTypingTarget(event.target)) return;
      if (handlerRef.current(event) === true) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('keydown', listener, capture);
    return () => window.removeEventListener('keydown', listener, capture);
  }, [capture, enabled]);
}
