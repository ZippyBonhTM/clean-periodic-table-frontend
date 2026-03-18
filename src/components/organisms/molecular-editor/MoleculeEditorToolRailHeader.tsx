'use client';

import { RailToggleIcon } from '@/components/organisms/molecular-editor/moleculeEditorToolRailIcons';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';

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
  const text = useMolecularEditorText();

  return (
    <div
      className={`flex min-h-12 items-center border-b border-(--border-subtle)/70 p-2 ${
        effectiveToolRailCollapsed ? 'justify-center' : 'justify-between gap-2'
      }`}
    >
      {showExpandedToolRailContent ? (
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">{text.toolRail.tools}</p>
      ) : null}
      <button
        type="button"
        onClick={onToggleCollapsed}
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-(--border-subtle) bg-(--surface-2)/70 text-(--text-muted) transition-colors hover:border-(--accent) hover:text-foreground"
        aria-label={effectiveToolRailCollapsed ? text.toolRail.expand : text.toolRail.collapse}
        title={effectiveToolRailCollapsed ? text.toolRail.expand : text.toolRail.collapse}
      >
        <RailToggleIcon collapsed={effectiveToolRailCollapsed} />
      </button>
    </div>
  );
}
