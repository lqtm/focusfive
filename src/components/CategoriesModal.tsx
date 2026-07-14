import { Plus, Trash } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';

import { CATEGORY_LIMIT, type Category } from '../domain/models';
import { Modal } from './Modal';

const CATEGORY_COLORS = ['#d6644a', '#4d7c68', '#7c6faf', '#c0923e', '#467493'];

interface CategoriesModalProps {
  categories: Category[];
  onAdd: (name: string, color: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function CategoriesModal({ categories, onAdd, onDelete, onClose }: CategoriesModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    onAdd(name, color);
    setName('');
    setColor(CATEGORY_COLORS[(categories.length + 1) % CATEGORY_COLORS.length]);
  }

  return (
    <Modal eyebrow="A little structure" title="Categories" onClose={onClose}>
      <p className="modal-intro">Keep categories broad. Five is the limit, so they stay useful instead of becoming another filing system.</p>
      <ul className="category-manager-list">
        {categories.map((category) => (
          <li key={category.id}>
            <i style={{ background: category.color }} />
            <span>{category.name}</span>
            <button onClick={() => onDelete(category.id)} aria-label={`Delete ${category.name}`} data-tooltip="Delete category"><Trash size={16} /></button>
          </li>
        ))}
      </ul>
      <form className="category-form" onSubmit={submit}>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Category name" aria-label="Category name" disabled={categories.length >= CATEGORY_LIMIT} />
        <div className="color-picker" aria-label="Category color">
          {CATEGORY_COLORS.map((swatch) => (
            <button type="button" key={swatch} className={color === swatch ? 'selected' : ''} style={{ background: swatch }} onClick={() => setColor(swatch)} aria-label={`Use color ${swatch}`} />
          ))}
        </div>
        <button type="submit" disabled={categories.length >= CATEGORY_LIMIT}><Plus size={16} /> Add</button>
      </form>
      <span className="modal-capacity">{categories.length} of {CATEGORY_LIMIT} categories</span>
    </Modal>
  );
}
