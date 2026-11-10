interface TaskHintProps {
  hint?: string;
  /** Omit to render the hint read-only. */
  onEdit?: () => void;
}

export function TaskHint({ hint, onEdit }: TaskHintProps) {
  if (!hint) return null;
  if (!onEdit) return <span className="task-hint">{hint}</span>;
  return (
    <button type="button" className="task-hint" tabIndex={-1} onClick={onEdit} title="Edit hint">
      {hint}
    </button>
  );
}
