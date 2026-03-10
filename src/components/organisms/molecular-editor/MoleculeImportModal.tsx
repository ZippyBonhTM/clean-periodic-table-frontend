'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';

import Button from '@/components/atoms/Button';
import FloatingModal from '@/components/molecules/FloatingModal';
import {
  importPubChemCompound,
  listPubChemAutocompleteSuggestions,
  listPubChemCompoundResultsByTerm,
  type PubChemImportMode,
  type PubChemCompoundSearchResult,
  type ResolvedImportedPubChemCompound,
} from '@/shared/api/pubchemApi';
import type { ChemicalElement } from '@/shared/types/element';

type MoleculeImportModalProps = {
  isOpen: boolean;
  elements: ChemicalElement[];
  onClose: () => void;
  onImport: (compound: ResolvedImportedPubChemCompound) => Promise<void> | void;
};

const SEARCH_DEBOUNCE_MS = 420;

function mapImportErrorMessage(caughtError: unknown): string {
  if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
    return caughtError.message;
  }

  return 'Could not load this molecule from PubChem.';
}

function MoleculeImportModal({
  isOpen,
  elements,
  onClose,
  onImport,
}: MoleculeImportModalProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const [results, setResults] = useState<PubChemCompoundSearchResult[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isResultsLoading, setIsResultsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importingCid, setImportingCid] = useState<number | null>(null);
  const [importMode, setImportMode] = useState<PubChemImportMode>('main');

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setDebouncedQuery('');
      setSuggestions([]);
      setActiveTerm(null);
      setResults([]);
      setSearchError(null);
      setImportError(null);
      setImportingCid(null);
      setImportMode('main');
      return;
    }

    const timeoutId = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 30);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, query]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (debouncedQuery.length === 0) {
      setSuggestions([]);
      setActiveTerm(null);
      setResults([]);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    setIsSuggestionsLoading(true);
    setSearchError(null);

    listPubChemAutocompleteSuggestions(debouncedQuery, controller.signal)
      .then((nextSuggestions) => {
        if (controller.signal.aborted) {
          return;
        }

        const resolvedSuggestions = nextSuggestions.length > 0 ? nextSuggestions : [debouncedQuery];

        setSuggestions(resolvedSuggestions);
        setActiveTerm((currentTerm) => {
          if (currentTerm !== null) {
            const currentTermKey = currentTerm.toLowerCase();

            if (resolvedSuggestions.some((suggestion) => suggestion.toLowerCase() === currentTermKey)) {
              return currentTerm;
            }
          }

          return resolvedSuggestions[0] ?? debouncedQuery;
        });
      })
      .catch((caughtError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setSuggestions([]);
        setActiveTerm(debouncedQuery);
        setSearchError(mapImportErrorMessage(caughtError));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsSuggestionsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (activeTerm === null || activeTerm.trim().length === 0) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    setIsResultsLoading(true);
    setImportError(null);

    listPubChemCompoundResultsByTerm(activeTerm, controller.signal)
      .then((nextResults) => {
        if (controller.signal.aborted) {
          return;
        }

        setResults(nextResults);
      })
      .catch((caughtError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setResults([]);
        setSearchError(mapImportErrorMessage(caughtError));
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsResultsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [activeTerm, isOpen]);

  const onImportResult = useCallback(
    async (result: PubChemCompoundSearchResult) => {
      try {
        setImportError(null);
        setImportingCid(result.cid);
        const imported = await importPubChemCompound(result, elements);
        await onImport({
          ...imported,
          molecule: importMode === 'main' ? imported.mainComponentMolecule : imported.molecule,
          importMode,
        });
      } catch (caughtError: unknown) {
        setImportError(mapImportErrorMessage(caughtError));
      } finally {
        setImportingCid((currentCid) => (currentCid === result.cid ? null : currentCid));
      }
    },
    [elements, importMode, onImport],
  );

  const isSearchBusy = isSuggestionsLoading || isResultsLoading;
  const showEmptyState =
    debouncedQuery.length > 0 && !isSearchBusy && searchError === null && results.length === 0;

  return (
    <FloatingModal
      isOpen={isOpen}
      title="Import Molecule from PubChem"
      onClose={onClose}
      panelClassName="max-w-5xl self-start mt-1 sm:mt-3"
      bodyClassName="pr-1 pb-1"
    >
      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
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
                setQuery(event.target.value);
                setSearchError(null);
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
                        setActiveTerm(suggestion);
                        setSearchError(null);
                        setImportError(null);
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
              {(
                [
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
                }>
              ).map((option) => {
                const isActive = importMode === option.mode;

                return (
                  <button
                    key={option.mode}
                    type="button"
                    onClick={() => setImportMode(option.mode)}
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

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-(--border-subtle) bg-(--surface-overlay-subtle) px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted)">
                Search Results
              </p>
              <p className="mt-1 text-sm leading-relaxed text-(--text-muted)">
                {activeTerm === null
                  ? 'Pick a term to resolve real compounds from PubChem.'
                  : `Showing compounds for "${activeTerm}".`}
              </p>
            </div>
            {isSearchBusy ? (
              <span className="inline-flex rounded-full border border-(--border-subtle) bg-(--surface-overlay-faint) px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
                Searching...
              </span>
            ) : null}
          </div>

          {searchError !== null ? (
            <div className="rounded-[1.4rem] border border-rose-500/35 bg-rose-500/8 px-4 py-3 text-sm leading-relaxed text-rose-100">
              {searchError}
            </div>
          ) : null}

          {importError !== null ? (
            <div className="rounded-[1.4rem] border border-rose-500/35 bg-rose-500/8 px-4 py-3 text-sm leading-relaxed text-rose-100">
              {importError}
            </div>
          ) : null}

          {debouncedQuery.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-(--border-subtle) bg-(--surface-overlay-faint) px-4 py-8 text-center text-sm leading-relaxed text-(--text-muted)">
              Search by common name or IUPAC fragment to start browsing public compounds.
            </div>
          ) : showEmptyState ? (
            <div className="rounded-[1.5rem] border border-dashed border-(--border-subtle) bg-(--surface-overlay-faint) px-4 py-8 text-center text-sm leading-relaxed text-(--text-muted)">
              No importable compounds were found for this term yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {results.map((result) => {
                const isImporting = importingCid === result.cid;

                return (
                  <article
                    key={result.cid}
                    className="rounded-[1.5rem] border border-(--border-subtle) bg-(--surface-overlay-soft) p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className="min-w-0 flex-1 text-lg font-black leading-tight text-foreground"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {result.title}
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          className="shrink-0"
                          disabled={isImporting}
                          onClick={() => {
                            void onImportResult(result);
                          }}
                        >
                          {isImporting ? (
                            'Importing...'
                          ) : (
                            <>
                              <span className="sm:hidden">Import</span>
                              <span className="hidden sm:inline">Import into Editor</span>
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-(--border-subtle) bg-(--surface-overlay-faint) px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)">
                            CID {result.cid}
                          </span>
                          <p className="text-sm font-semibold text-foreground/90">
                            {result.molecularFormula ?? 'Formula unavailable'}
                          </p>
                        </div>

                        <p className="text-sm leading-relaxed text-(--text-muted)">
                          {result.iupacName ?? 'No IUPAC name returned for this record.'}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </FloatingModal>
  );
}

export default memo(MoleculeImportModal);
