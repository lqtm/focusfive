import { Plus, Trash } from '@phosphor-icons/react';
import { useEffect, useState, type FormEvent } from 'react';

import {
  BLOCKING_PAUSE_LIMIT,
  BLOCKING_PAUSE_MINUTES,
  BLOCKING_PAUSE_UNDO_MINUTES,
} from '../domain/blocklist';
import { Modal } from './Modal';

interface BlocklistModalProps {
  sites: string[];
  pausesUsed: number;
  pausedUntil: number | null;
  onAdd: (site: string) => boolean;
  onRemove: (site: string) => void;
  onPause: () => void;
  onResume: () => void;
  onClose: () => void;
}

export function BlocklistModal({ sites, pausesUsed, pausedUntil, onAdd, onRemove, onPause, onResume, onClose }: BlocklistModalProps) {
  const [site, setSite] = useState('');
  const [now, setNow] = useState(Date.now());
  const pauseActive = Boolean(pausedUntil && pausedUntil > now);
  const remainingPauses = Math.max(0, BLOCKING_PAUSE_LIMIT - pausesUsed);
  const remainingMinutes = pausedUntil ? Math.max(1, Math.ceil((pausedUntil - now) / 60_000)) : 0;
  const pauseStartedAt = pausedUntil ? pausedUntil - BLOCKING_PAUSE_MINUTES * 60_000 : 0;
  const pauseCanBeUndone = pauseActive && now - pauseStartedAt <= BLOCKING_PAUSE_UNDO_MINUTES * 60_000;

  useEffect(() => {
    if (!pausedUntil || pausedUntil <= Date.now()) return;
    const interval = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, [pausedUntil]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!site.trim()) return;
    if (onAdd(site)) setSite('');
  }

  return (
    <Modal eyebrow="Protect your attention" title="Blocklist" onClose={onClose}>
      <p className="modal-intro">These sites stay out of reach while Today or a due routine still has unfinished work.</p>
      <form className="site-form" onSubmit={submit}>
        <input value={site} onChange={(event) => setSite(event.target.value)} placeholder="reddit.com" aria-label="Website domain" />
        <button type="submit"><Plus size={16} /> Add site</button>
      </form>
      <ul className="site-list">
        {sites.map((entry) => (
          <li key={entry}>
            <span>{entry}</span>
            <button onClick={() => onRemove(entry)} aria-label={`Remove ${entry}`} data-tooltip="Remove from blocklist" data-tooltip-placement="left"><Trash size={16} /></button>
          </li>
        ))}
      </ul>
      <div className="pause-row">
        <span className="pause-label">Block pause</span>
        <span className="pause-counter" aria-live="polite">{remainingPauses} / {BLOCKING_PAUSE_LIMIT} left</span>
        <button
          onClick={pauseActive ? onResume : onPause}
          disabled={!pauseActive && remainingPauses === 0}
          aria-label={pauseActive ? 'Resume site blocking' : `Pause site blocking for ${BLOCKING_PAUSE_MINUTES} minutes`}
        >
          {pauseActive
            ? `${pauseCanBeUndone ? 'Undo pause' : 'Resume blocking'} · ${remainingMinutes}m`
            : `Pause ${BLOCKING_PAUSE_MINUTES} min`}
        </button>
      </div>
    </Modal>
  );
}
