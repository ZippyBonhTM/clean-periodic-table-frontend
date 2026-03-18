'use client';

import { memo } from 'react';

import {
  formatMolecularEditorComponentCount,
  formatMolecularEditorComponentFocusTitle,
  formatMolecularEditorComponentLabel,
} from '@/components/organisms/molecular-editor/molecularEditorText';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
import { buildMolecularFormula, type MoleculeComponent } from '@/shared/utils/moleculeEditor';

type MoleculeComponentFocusRailProps = {
  components: MoleculeComponent[];
  focusedComponentIndex: number;
  isCompact: boolean;
  onFocusComponent: (componentIndex: number) => void;
};

const MoleculeComponentFocusRail = memo(function MoleculeComponentFocusRail({
  components,
  focusedComponentIndex,
  isCompact,
  onFocusComponent,
}: MoleculeComponentFocusRailProps) {
  const text = useMolecularEditorText();
  const railClassName = isCompact ? 'flex flex-wrap items-center gap-1.5' : 'flex flex-wrap items-center gap-2';

  return (
    <div className={railClassName}>
      <span className="rounded-full border border-(--border-subtle) bg-(--surface-overlay-soft) px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
        {formatMolecularEditorComponentCount(text, components.length)}
      </span>
      {components.map((component, index) => {
        const isFocused = index === focusedComponentIndex;
        const componentFormula = buildMolecularFormula(component.model);

        return (
          <button
            key={component.atomIds.join(':')}
            type="button"
            onClick={() => onFocusComponent(index)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              isFocused
                ? 'border-(--accent) bg-(--accent)/18 text-foreground'
                : 'border-(--border-subtle) bg-(--surface-overlay-mid) text-(--text-muted) hover:border-(--accent) hover:text-foreground'
            }`}
            title={formatMolecularEditorComponentFocusTitle(text, index, componentFormula)}
          >
            {formatMolecularEditorComponentLabel(text, index)}
          </button>
        );
      })}
    </div>
  );
});

export default MoleculeComponentFocusRail;
