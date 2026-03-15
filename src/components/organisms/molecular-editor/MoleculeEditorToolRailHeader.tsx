'use client';

import { RailToggleIcon } from '@/components/organisms/molecular-editor/moleculeEditorToolRailIcons';

type MoleculeEditorToolRailHeaderProps = {
  effectiveToolRailCollapsed: boolean;
  onToggleCollapsed: () => void;
  showExpandedToolRailContent: boolean;
};

export default function MoleculeEditorToolRailHeader({
  effectiveToolRailCollapsed,
  onToggleCollapsed,
  showExpandedToolRailContent,
}: MoleculeEditorToolRailHeaderProps) {
  return (
    <div
      className={`flex min-h-12 items-center border-b border-(--border-subtle)/70 p-2 ${
        effectiveToolRailCollapsed ? 'justify-center' : 'justify-between gap-2'
      }`}
    >
      {showExpandedToolRailContent ? (
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Tools</p>
      ) : null}
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-(--border-subtle) bg-(--surface-2)/70 text-(--text-muted) transition-colors hover:border-(--accent) hover:text-foreground"
        aria-label={effectiveToolRailCollapsed ? 'Expand tool rail' : 'Collapse tool rail'}
        title={effectiveToolRailCollapsed ? 'Expand tool rail' : 'Collapse tool rail'}
      >
        <RailToggleIcon collapsed={effectiveToolRailCollapsed} />
      </button>
    </div>
  );
}
