import { CircleDashed } from '@phosphor-icons/react';

interface EmptyStateProps {
  title: string;
  body: string;
}

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <CircleDashed size={24} weight="light" aria-hidden="true" />
      <h3>{title}</h3>
      <p>{body}</p>
    </div>
  );
}
