'use client';

import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
import type { PubChemImportMode } from '@/shared/api/pubchemApi';

type MoleculeImportScopeOptionsProps = {
  importMode: PubChemImportMode;
  onImportModeChange: (mode: PubChemImportMode) => void;
};

export default function MoleculeImportScopeOptions({
  importMode,
  onImportModeChange,
}: MoleculeImportScopeOptionsProps) {
  const text = useMolecularEditorText();
  const importModeOptions = [
    {
      mode: 'main' as const,
      title: text.importModal.mainComponent,
      description: text.importModal.mainComponentDescription,
    },
    {
      mode: 'all' as const,
      title: text.importModal.allComponents,
      description: text.importModal.allComponentsDescription,
    },
  ] satisfies Array<{
    mode: PubChemImportMode;
    title: string;
    description: string;
  }>;

  return (
    <div className="space-y-2">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">{text.importModal.importScope}</p>
        <p className="mt-1 text-sm leading-relaxed text-(--text-muted)">
          {text.importModal.importScopeDescription}
        </p>
      </div>
      <div className="grid gap-2">
        {importModeOptions.map((option) => {
          const isActive = importMode === option.mode;

          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => onImportModeChange(option.mode)}
              className={`rounded-[1.15rem] border px-3 py-2.5 text-left transition-colors ${
                isActive
                  ? 'border-(--accent) bg-(--accent)/16 text-foreground'
                  : 'border-(--border-subtle) bg-(--surface-overlay-faint) text-(--text-muted) hover:border-(--accent) hover:text-foreground'
              }`}
              aria-pressed={isActive}
            >
              <span className="block text-[11px] font-semibold uppercase tracking-[0.14em]">{option.title}</span>
              <span className="mt-1 block text-sm leading-relaxed">{option.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
