'use client';

type MoleculeImportRelatedTermsProps = {
  activeTerm: string | null;
  isSuggestionsLoading: boolean;
  onSelectSuggestion: (suggestion: string) => void;
  query: string;
  suggestions: string[];
};

export default function MoleculeImportRelatedTerms({
  activeTerm,
  isSuggestionsLoading,
  onSelectSuggestion,
  query,
  suggestions,
}: MoleculeImportRelatedTermsProps) {
  const debouncedQuery = query.trim();

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">Related Terms</p>
      {debouncedQuery.length === 0 ? (
        <p className="text-sm leading-relaxed text-(--text-muted)">Start typing to see matching PubChem terms.</p>
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
  );
}
