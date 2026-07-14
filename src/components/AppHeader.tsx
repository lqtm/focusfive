import { EyeSlash, Moon, Sun } from '@phosphor-icons/react';

import type { TabId, ThemeMode } from '../domain/models';

interface AppHeaderProps {
  activeTab: TabId;
  theme: ThemeMode;
  counts: Record<TabId, number>;
  onTabChange: (tab: TabId) => void;
  onToggleTheme: () => void;
  onTogglePrivacyMode: () => void;
}

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'later', label: 'Later' },
  { id: 'ideas', label: 'Ideas' },
  { id: 'recurring', label: 'Recurring' },
];

export function AppHeader({ activeTab, theme, counts, onTabChange, onToggleTheme, onTogglePrivacyMode }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-row">
        <div className="brand" aria-label="Five">
          <span className="brand-mark">V</span>
          <span>FIVE</span>
          <small>A CALMER FOCUS LIST</small>
        </div>
        <div className="header-actions">
          <button
            className="icon-button privacy-button"
            onClick={onTogglePrivacyMode}
            aria-label="Hide my list for presenting"
            data-tooltip="Presentation mode"
          >
            <EyeSlash size={18} weight="regular" />
          </button>
          <button className="icon-button theme-button" onClick={onToggleTheme} aria-label={`Use ${theme === 'light' ? 'dark' : 'light'} theme`} data-tooltip={`Use ${theme === 'light' ? 'dark' : 'light'} theme`}>
            {theme === 'light' ? <Moon size={18} weight="regular" /> : <Sun size={19} weight="regular" />}
          </button>
        </div>
      </div>

      <nav className="tab-bar" aria-label="Task views">
        {tabs.map((tab) => (
          <button
            className={activeTab === tab.id ? 'tab active' : 'tab'}
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span>{tab.label}</span>
            <span className="tab-count">{String(counts[tab.id]).padStart(2, '0')}</span>
          </button>
        ))}
        <span className="tab-rule" />
      </nav>
    </header>
  );
}
