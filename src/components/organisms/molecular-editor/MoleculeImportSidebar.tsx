'use client';

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
  const debouncedQuery = query.trim();

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

      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
          Related Terms
        </p>
        {debouncedQuery.length === 0 ? (
          <p className="text-sm leading-relaxed text-(--text-muted)">
            Start typing to see matching PubChem terms.
          </p>
        ) : suggestions.length === 0 && !isSuggestionsLoading ? (
          <p className="text-sm leading-relaxed text-(--text-muted)">
            No related terms were found for this query yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => {
              const isActive = activeTerm !== null && suggestion.toLowerCase() === activeTerm.toLowerCase();

              return (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    onSelectSuggestion(suggestion);
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    isActive
                      ? 'border-(--accent) bg-(--accent)/20 text-foreground'
                      : 'border-(--border-subtle) bg-(--surface-overlay-faint) text-(--text-muted) hover:border-(--accent) hover:text-foreground'
                  }`}
                >
                  {suggestion}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
            Import Scope
          </p>
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
                <span className="block text-[11px] font-semibold uppercase tracking-[0.14em]">
                  {option.title}
                </span>
                <span className="mt-1 block text-sm leading-relaxed">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
