import { useRef, useState } from 'react';

import { downloadBackup, parseBackup, summarizeState, type BackupSummary } from '../data/backup';
import type { AppState } from '../domain/models';

interface BackupSectionProps {
  state: AppState;
  onRestore: (state: AppState) => void;
}

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function describe(summary: BackupSummary): string {
  return `${summary.today} Today · ${summary.later} Later · ${summary.ideas} ideas · ${summary.done} done · ${summary.routines} ${summary.routines === 1 ? 'routine' : 'routines'}`;
}

export function BackupSection({ state, onRestore }: BackupSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ state: AppState; summary: BackupSummary; fileName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function readFile(file: File) {
    setError(null);
    setPending(null);
    const result = parseBackup(await file.text());
    if (result.ok) setPending({ state: result.state, summary: result.summary, fileName: file.name });
    else setError(result.error);
  }

  return (
    <section className="settings-section" id="backup" aria-labelledby="settings-backup">
      <h2 id="settings-backup">Backup</h2>
      <p className="settings-help">Everything Five keeps lives in this browser. Export a backup before you switch computers or browsers.</p>
      <div className="backup-actions">
        <button type="button" className="outline-button" onClick={() => downloadBackup(state)}>Export backup</button>
        <button type="button" className="outline-button" onClick={() => fileRef.current?.click()}>Restore from file…</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="Backup file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void readFile(file);
          }}
        />
      </div>

      {error && <p className="settings-help backup-error" role="alert">{error}</p>}

      {pending && (
        <div className="backup-confirm" role="alertdialog" aria-labelledby="backup-confirm-title" aria-describedby="backup-confirm-body">
          <p id="backup-confirm-title" className="backup-confirm-title">Replace everything with this backup?</p>
          <div id="backup-confirm-body">
            <p className="mono backup-file">
              {pending.fileName}
              {pending.summary.exportedAt ? ` · exported ${DATE_FORMATTER.format(pending.summary.exportedAt)}` : ''}
            </p>
            <dl className="backup-compare">
              <dt>Backup</dt>
              <dd>{describe(pending.summary)}</dd>
              <dt>Now</dt>
              <dd>{describe(summarizeState(state))}</dd>
            </dl>
            <p className="settings-help">A copy of your current data downloads first.</p>
          </div>
          <div className="backup-actions">
            <button
              type="button"
              className="ink-button"
              onClick={() => {
                downloadBackup(state);
                onRestore(pending.state);
                setPending(null);
              }}
            >
              Replace
            </button>
            <button type="button" className="outline-button" onClick={() => setPending(null)}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
