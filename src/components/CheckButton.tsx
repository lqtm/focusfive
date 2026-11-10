import { Check } from '@phosphor-icons/react';

interface CheckButtonProps {
  done: boolean;
  title: string;
  onToggle: () => void;
  size?: 'default' | 'small';
}

export function CheckButton({ done, title, onToggle, size = 'default' }: CheckButtonProps) {
  return (
    <button
      type="button"
      className={['check-button', done ? 'done' : '', size === 'small' ? 'small' : ''].filter(Boolean).join(' ')}
      onClick={onToggle}
      aria-label={`${done ? 'Mark not done' : 'Mark done'}: ${title}`}
    >
      <span className="check-ring" aria-hidden="true">
        <Check size={size === 'small' ? 11 : 13} weight="bold" />
      </span>
    </button>
  );
}
