import { CaretDown, Check } from '@phosphor-icons/react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export interface SelectOption<Value extends string | number> {
  value: Value;
  label: string;
}

interface SelectProps<Value extends string | number> {
  value: Value;
  options: SelectOption<Value>[];
  onChange: (value: Value) => void;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
}

export function Select<Value extends string | number>({ value, options, onChange, ariaLabel, className = '', disabled = false }: SelectProps<Value>) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuId = useId();
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selectedOption = options[selectedIndex];

  useEffect(() => {
    if (options.length && !options.some((option) => option.value === value)) onChange(options[0].value);
  }, [onChange, options, value]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress);
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[highlightedIndex]?.focus();
  }, [highlightedIndex, open]);

  function openMenu(initialIndex = selectedIndex) {
    if (disabled || !options.length) return;
    setHighlightedIndex(initialIndex);
    setOpen(true);
  }

  function closeAndFocusTrigger() {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function chooseOption(option: SelectOption<Value>) {
    onChange(option.value);
    closeAndFocusTrigger();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(open ? highlightedIndex : selectedIndex);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeAndFocusTrigger();
    }
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setHighlightedIndex((index + direction + options.length) % options.length);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setHighlightedIndex(event.key === 'Home' ? 0 : options.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeAndFocusTrigger();
    }
  }

  const rootClassName = ['custom-select', open ? 'open' : '', disabled ? 'is-disabled' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={rootClassName}
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="custom-select-trigger"
        onClick={() => open ? closeAndFocusTrigger() : openMenu()}
        onKeyDown={handleTriggerKeyDown}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
      >
        <span>{selectedOption?.label ?? ''}</span>
        <CaretDown size={13} weight="bold" aria-hidden="true" />
      </button>

      {open && (
        <div className="custom-select-menu" id={menuId} role="listbox" aria-label={ariaLabel}>
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <button
                key={String(option.value)}
                ref={(node) => { optionRefs.current[index] = node; }}
                type="button"
                role="option"
                className={selected ? 'custom-select-option selected' : 'custom-select-option'}
                aria-selected={selected}
                tabIndex={index === highlightedIndex ? 0 : -1}
                onFocus={() => setHighlightedIndex(index)}
                onClick={() => chooseOption(option)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
              >
                <span>{option.label}</span>
                {selected && <Check size={15} weight="bold" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
