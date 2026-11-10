import { ArrowLeft, EyeSlash, GearSix } from '@phosphor-icons/react';

import { formatHeaderDate, localDateKey } from '../domain/date';
import type { TabId } from '../domain/models';

interface AppHeaderProps {
  activeTab: TabId | null;
  date: Date;
  counts: Record<TabId, string>;
  onTabChange: (tab: TabId) => void;
  onHideList: () => void;
  onOpenSettings: () => void;
}

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'later', label: 'Later' },
  { id: 'ideas', label: 'Ideas' },
];

export function AppHeader({ activeTab, date, counts, onTabChange, onHideList, onOpenSettings }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="wordmark">five</span>
        <time className="mono" dateTime={localDateKey(date)}>{formatHeaderDate(date)}</time>
      </div>

      <nav className="segmented-nav" aria-label="Lists">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? 'nav-item active' : 'nav-item'}
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span>{tab.label}</span>
            <span className="mono nav-count">{counts[tab.id]}</span>
          </button>
        ))}
      </nav>

      <div className="header-actions">
        <button type="button" className="icon-button" onClick={onHideList} aria-label="Hide list" title="Hide list">
          <EyeSlash size={19} />
        </button>
        <button type="button" className="icon-button" onClick={onOpenSettings} aria-label="Settings" title="Settings">
          <GearSix size={19} />
        </button>
      </div>
    </header>
  );
}

export function SubpageHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="app-header subpage-header">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Today
      </button>
      <span className="wordmark">five</span>
    </header>
  );
}
