import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { HINT_MAX_LENGTH } from '../domain/tags';

export type EditField = 'title' | 'hint';

interface TaskEditorProps {
  title: string;
  hint?: string;
  focus: EditField;
  /** Sizes the title input like the title it replaces. */
  titleClassName?: string;
  onSave: (title: string, hint: string) => void;
  onClose: () => void;
}

export function TaskEditor({ title: initialTitle, hint: initialHint, focus, titleClassName = '', onSave, onClose }: TaskEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [hint, setHint] = useState(initialHint ?? '');
  const settledRef = useRef(false);
  const fieldRefs = useRef<Record<EditField, HTMLInputElement | HTMLTextAreaElement | null>>({ title: null, hint: null });

  useEffect(() => {
    const field = fieldRefs.current[focus];
    if (!field) return;
    field.focus();
    field.setSelectionRange(field.value.length, field.value.length);
  }, [focus]);

  const finish = (save: boolean) => {
    if (settledRef.current) return;
    settledRef.current = true;
    if (save) onSave(title, hint);
    onClose();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      finish(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      finish(false);
    }
  };

  return (
    <div
      className="task-editor"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) finish(true);
      }}
    >
      <textarea
        ref={(node) => { fieldRefs.current.title = node; }}
        className={`task-title-input ${titleClassName}`.trim()}
        rows={1}
        value={title}
        placeholder="Task"
        aria-label="Task title"
        autoComplete="off"
        onChange={(event) => setTitle(event.target.value.replace(/\s*\n\s*/g, ' '))}
        onKeyDown={handleKeyDown}
      />
      <input
        ref={(node) => { fieldRefs.current.hint = node; }}
        className="task-hint-input"
        value={hint}
        maxLength={HINT_MAX_LENGTH}
        placeholder="Hint — what this is really about"
        aria-label="Hint"
        autoComplete="off"
        onChange={(event) => setHint(event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
