import { useRef, type KeyboardEvent } from 'react';

export interface SegmentedOption<Value extends string | number> {
  value: Value;
  label: string;
}

interface SegmentedProps<Value extends string | number> {
  label: string;
  value: Value;
  options: SegmentedOption<Value>[];
  onChange: (value: Value) => void;
  disabled?: boolean;
  className?: string;
}

export function Segmented<Value extends string | number>({ label, value, options, onChange, disabled = false, className = '' }: SegmentedProps<Value>) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(event.key in keys) && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? options.length - 1
        : (index + keys[event.key] + options.length) % options.length;
    onChange(options[nextIndex].value);
    buttonRefs.current[nextIndex]?.focus();
  }

  return (
    <div className={`segmented ${className}`.trim()} role="radiogroup" aria-label={label} aria-disabled={disabled || undefined}>
      {options.map((option, index) => {
        const selected = index === selectedIndex;
        return (
          <button
            key={String(option.value)}
            ref={(node) => { buttonRefs.current[index] = node; }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={disabled}
            className={selected ? 'segment selected' : 'segment'}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
