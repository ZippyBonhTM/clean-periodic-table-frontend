'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';

import FloatingModal from '@/components/molecules/FloatingModal';
import MoleculeImportResultCard from '@/components/molecules/chemistry/MoleculeImportResultCard';
import MoleculeImportSidebar from '@/components/organisms/molecular-editor/MoleculeImportSidebar';
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
        <MoleculeImportSidebar
          activeTerm={activeTerm}
          importMode={importMode}
          isSuggestionsLoading={isSuggestionsLoading}
          onImportModeChange={setImportMode}
          onQueryChange={(value) => {
            setQuery(value);
            setSearchError(null);
          }}
          onSelectSuggestion={(suggestion) => {
            setActiveTerm(suggestion);
            setSearchError(null);
            setImportError(null);
          }}
          query={query}
          searchInputRef={searchInputRef}
          suggestions={suggestions}
        />

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
                  <MoleculeImportResultCard
                    key={result.cid}
                    result={result}
                    isImporting={isImporting}
                    onImport={(selectedResult) => {
                      void onImportResult(selectedResult);
                    }}
                  />
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
