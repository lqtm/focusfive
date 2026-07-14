import { ArrowElbowDownLeft, Plus } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';

import { type Category, type TaskBucket } from '../domain/models';
import { Select } from './Select';

interface TaskComposerProps {
  bucket: TaskBucket;
  categories: Category[];
  onAdd: (title: string, bucket: TaskBucket, categoryId?: string) => void;
}

export function TaskComposer({ bucket, categories, onAdd }: TaskComposerProps) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onAdd(title, bucket, categoryId || undefined);
    setTitle('');
  }

  return (
    <form className="task-composer" onSubmit={submit}>
      <div className="composer-main">
        <Plus size={18} weight="light" aria-hidden="true" />
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={bucket === 'today' ? 'What matters now?' : bucket === 'ideas' ? 'Capture a thought before it disappears…' : 'Add something for later…'}
          aria-label="Task title"
        />
        <button type="submit" className="composer-submit" aria-label="Add task" data-tooltip="Add task">
          <ArrowElbowDownLeft size={21} weight="light" />
        </button>
      </div>
      <div className="composer-meta">
        <div className="composer-meta-control">
          <span>Category</span>
          <Select
            value={categoryId}
            options={[{ value: '', label: 'None' }, ...categories.map((category) => ({ value: category.id, label: category.name }))]}
            onChange={setCategoryId}
            ariaLabel="Task category"
            className="category-select"
          />
        </div>
      </div>
    </form>
  );
}
