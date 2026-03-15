'use client';

import MoleculeImportRelatedTerms from '@/components/organisms/molecular-editor/MoleculeImportRelatedTerms';
import MoleculeImportScopeOptions from '@/components/organisms/molecular-editor/MoleculeImportScopeOptions';
import type { PubChemImportMode } from '@/shared/api/pubchemApi';

type MoleculeImportSidebarProps = {
  activeTerm: string | null;
  importMode: PubChemImportMode;
  isSuggestionsLoading: boolean;
  onImportModeChange: (mode: PubChemImportMode) => void;
  onQueryChange: (value: string) => void;
  onSelectSuggestion: (suggestion: string) => void;
  query: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  suggestions: string[];
};

export default function MoleculeImportSidebar({
  activeTerm,
  importMode,
  isSuggestionsLoading,
  onImportModeChange,
  onQueryChange,
  onSelectSuggestion,
  query,
  searchInputRef,
  suggestions,
}: MoleculeImportSidebarProps) {
  return (
    <aside className="space-y-3 rounded-[1.5rem] border border-(--border-subtle) bg-(--surface-overlay-soft) p-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
          Search Source
        </p>
        <h3 className="mt-1 text-lg font-black text-foreground">PubChem</h3>
        <p className="mt-2 text-sm leading-relaxed text-(--text-muted)">
          Search PubChem, preview matches, and import one into the editor.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="molecule-import-search"
          className="text-[11px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)"
        >
          Search
        </label>
        <input
          ref={searchInputRef}
          id="molecule-import-search"
          name="molecule-import-search"
          type="text"
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
          }}
          placeholder="caffeine, aspirin, benzene..."
          className="w-full rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-(--accent)"
        />
      </div>

      <MoleculeImportRelatedTerms
        activeTerm={activeTerm}
        isSuggestionsLoading={isSuggestionsLoading}
        onSelectSuggestion={onSelectSuggestion}
        query={query}
        suggestions={suggestions}
      />

      <MoleculeImportScopeOptions importMode={importMode} onImportModeChange={onImportModeChange} />
    </aside>
  );
}
