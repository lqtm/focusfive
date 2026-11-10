import { useRef, useState } from 'react';

import { formatAge } from '../domain/date';
import type { Task } from '../domain/models';
import { useHotkeys } from '../hooks/useHotkeys';
import { Composer } from './Composer';
import { SwapPicker } from './SwapPicker';
import { TaskEditor, type EditField } from './TaskEditor';
import { TaskHint } from './TaskHint';

interface IdeasViewProps {
  ideas: Task[];
  todaySlots: Task[];
  todayFull: boolean;
  onAdd: (rawTitle: string) => void;
  onMoveToday: (ideaId: string) => void;
  onMoveLater: (ideaId: string) => void;
  onDrop: (ideaId: string) => void;
  onSwapIntoToday: (incomingId: string, outgoingId: string) => void;
  onEditTask: (ideaId: string, title: string, hint: string) => void;
}

export function IdeasView({ ideas, todaySlots, todayFull, onAdd, onMoveToday, onMoveLater, onDrop, onSwapIntoToday, onEditTask }: IdeasViewProps) {
  const composerRef = useRef<HTMLInputElement>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [editing, setEditing] = useState<EditField | null>(null);
  const currentIndex = Math.max(0, ideas.findIndex((idea) => idea.id === currentId));
  const current = ideas[currentIndex];
  const now = Date.now();

  /** After resolving the current idea, show whichever idea takes its place in the list. */
  function advanceAfterResolve() {
    const next = ideas[currentIndex + 1] ?? ideas[currentIndex - 1];
    setCurrentId(next?.id ?? null);
    setEditing(null);
  }

  function sendToday() {
    if (!current) return;
    if (todayFull) {
      setSwapOpen(true);
      return;
    }
    onMoveToday(current.id);
    advanceAfterResolve();
  }

  function sendLater() {
    if (!current) return;
    onMoveLater(current.id);
    advanceAfterResolve();
  }

  function drop() {
    if (!current) return;
    onDrop(current.id);
    advanceAfterResolve();
  }

  function skip() {
    if (ideas.length < 2) return;
    setCurrentId(ideas[(currentIndex + 1) % ideas.length].id);
    setEditing(null);
  }

  useHotkeys((event) => {
    const key = event.key.toLowerCase();
    if (key === 'n') composerRef.current?.focus();
    else if (key === 't') sendToday();
    else if (key === 'l') sendLater();
    else if (key === 'x') drop();
    else if (key === 's') skip();
    else if (key === 'e' && current) setEditing('title');
    else if (key === 'h' && current) setEditing('hint');
    else return false;
    return true;
  });

  return (
    <section className="list-page" aria-labelledby="ideas-title">
      <header className="list-header">
        <h1 id="ideas-title">Ideas</h1>
        <span className="mono list-meta">{ideas.length}</span>
      </header>

      <Composer inputRef={composerRef} placeholder="Capture it before it’s gone" label="Capture an idea" onSubmit={onAdd} />

      {current ? (
        <section className="triage-card" aria-label="Triage">
          <header className="triage-header">
            <span>Triage</span>
            <span className="mono" aria-label="Shortcuts: T for Today, L for Later, X to drop">T · L · X</span>
          </header>
          {editing ? (
            <div className="triage-editor">
              <TaskEditor
                key={current.id}
                title={current.title}
                hint={current.hint}
                focus={editing}
                titleClassName="triage-title"
                onSave={(title, hint) => onEditTask(current.id, title, hint)}
                onClose={() => setEditing(null)}
              />
            </div>
          ) : (
            <>
              <p className="triage-title is-editable" aria-live="polite" title="Click to edit (E)" onClick={() => setEditing('title')}>{current.title}</p>
              {current.hint ? (
                <div className="triage-hint">
                  <TaskHint hint={current.hint} onEdit={() => setEditing('hint')} />
                </div>
              ) : (
                <button type="button" className="text-button triage-add-hint" onClick={() => setEditing('hint')} title="Add hint (H)">
                  Add hint
                </button>
              )}
            </>
          )}
          <div className="triage-actions">
            <button
              type="button"
              className="triage-button filled"
              onClick={sendToday}
              aria-haspopup={todayFull ? 'dialog' : undefined}
              aria-expanded={todayFull ? swapOpen : undefined}
            >Today</button>
            <button type="button" className="triage-button" onClick={sendLater}>Later</button>
            <button type="button" className="triage-button" onClick={drop}>Drop</button>
            <button type="button" className="triage-button skip" onClick={skip} disabled={ideas.length < 2}>Skip</button>
          </div>
          {swapOpen && (
            <SwapPicker
              title="Swap with which?"
              slots={todaySlots}
              onClose={() => setSwapOpen(false)}
              onPick={(outgoingId) => {
                onSwapIntoToday(current.id, outgoingId);
                setSwapOpen(false);
                advanceAfterResolve();
              }}
            />
          )}
        </section>
      ) : (
        <p className="empty-box">Inbox zero. Nothing left to sort.</p>
      )}

      {ideas.length > 0 && (
        <ul className="idea-list">
          {ideas.map((idea) => (
            <li key={idea.id}>
              <button
                type="button"
                className="idea-row"
                aria-pressed={idea.id === current?.id}
                onClick={() => {
                  setCurrentId(idea.id);
                  setEditing(null);
                }}
              >
                <span className="idea-text">
                  <span>{idea.title}</span>
                  <TaskHint hint={idea.hint} />
                </span>
                <span className="mono idea-age" aria-label={`Captured ${formatAge(idea.createdAt, now)} ago`}>{formatAge(idea.createdAt, now)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
