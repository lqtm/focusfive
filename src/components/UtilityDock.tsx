import { ShieldCheck, Tag } from '@phosphor-icons/react';

interface UtilityDockProps {
  blockCount: number;
  categoryCount: number;
  onOpenBlocklist: () => void;
  onOpenCategories: () => void;
}

export function UtilityDock({ blockCount, categoryCount, onOpenBlocklist, onOpenCategories }: UtilityDockProps) {
  return (
    <aside className="utility-dock" aria-label="Utilities">
      <button onClick={onOpenCategories}><Tag size={16} /><span>Categories</span><b>{categoryCount}</b></button>
      <button onClick={onOpenBlocklist}><ShieldCheck size={16} /><span>Blocklist</span><b>{blockCount}</b></button>
    </aside>
  );
}
