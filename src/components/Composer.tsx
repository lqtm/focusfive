import { useState, type FormEvent, type Ref } from 'react';

import { parseTaskInput } from '../domain/tags';

interface ComposerProps {
  placeholder: string;
  label: string;
  onSubmit: (value: string) => void;
  inputRef?: Ref<HTMLInputElement>;
  variant?: 'card' | 'inline';
}

export function Composer({ placeholder, label, onSubmit, inputRef, variant = 'card' }: ComposerProps) {
  const [value, setValue] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!parseTaskInput(value).title) return;
    onSubmit(value);
    setValue('');
  }

  return (
    <form className={`composer ${variant}`} onSubmit={submit}>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') event.currentTarget.blur();
        }}
        placeholder={placeholder}
        aria-label={label}
        enterKeyHint="done"
        autoComplete="off"
      />
    </form>
  );
}
