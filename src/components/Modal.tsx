import { X } from '@phosphor-icons/react';
import { useEffect, type PropsWithChildren } from 'react';

interface ModalProps extends PropsWithChildren {
  title: string;
  eyebrow: string;
  onClose: () => void;
}

export function Modal({ title, eyebrow, onClose, children }: ModalProps) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span>{eyebrow}</span>
            <h2 id="modal-title">{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close" data-tooltip="Close" data-tooltip-placement="below"><X size={20} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}
