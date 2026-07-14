import { ArrowRight, ArrowUpRight, X } from '@phosphor-icons/react';

import type { Category, Task } from '../domain/models';

interface IdeaRowProps {
  idea: Task;
  category?: Category;
  onMoveToday: () => void;
  onMoveLater: () => void;
  onDiscard: () => void;
}

export function IdeaRow({ idea, category, onMoveToday, onMoveLater, onDiscard }: IdeaRowProps) {
  return (
    <li className="idea-row">
      <div className="idea-copy">
        <span className="task-title">{idea.title}</span>
      </div>
      <div className="idea-trailing">
        {category && <span className="category-label"><i style={{ background: category.color }} />{category.name}</span>}
        <div className="idea-actions" aria-label={`Triage ${idea.title}`}>
          <button onClick={onMoveToday}>Today <ArrowUpRight size={14} /></button>
          <button onClick={onMoveLater}>Later <ArrowRight size={14} /></button>
          <button className="idea-discard" onClick={onDiscard} aria-label={`Discard ${idea.title}`} data-tooltip="Discard idea"><X size={15} /></button>
        </div>
      </div>
    </li>
  );
}
