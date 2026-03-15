'use client';

import type { PubChemImportMode } from '@/shared/api/pubchemApi';

const IMPORT_MODE_OPTIONS = [
  {
    mode: 'main' as const,
    title: 'Main component',
    description: 'Keeps the dominant connected component and omits detached salts or companion fragments.',
  },
  {
    mode: 'all' as const,
    title: 'All components',
    description: 'Keeps every disconnected component in the same canvas as one multi-component work.',
  },
] satisfies Array<{
  mode: PubChemImportMode;
  title: string;
  description: string;
}>;

type MoleculeImportScopeOptionsProps = {
  importMode: PubChemImportMode;
  onImportModeChange: (mode: PubChemImportMode) => void;
};

export default function MoleculeImportScopeOptions({
  importMode,
  onImportModeChange,
}: MoleculeImportScopeOptionsProps) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Import Scope</p>
        <p className="mt-1 text-sm leading-relaxed text-(--text-muted)">
          Choose between the main component or the full imported record.
        </p>
      </div>
      <div className="grid gap-2">
        {IMPORT_MODE_OPTIONS.map((option) => {
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
