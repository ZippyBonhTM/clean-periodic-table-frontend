'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  importPubChemCompound,
  listPubChemAutocompleteSuggestions,
  listPubChemCompoundResultsByTerm,
  type PubChemCompoundSearchResult,
  type PubChemImportMode,
  type ResolvedImportedPubChemCompound,
} from '@/shared/api/pubchemApi';
import type { ChemicalElement } from '@/shared/types/element';

const SEARCH_DEBOUNCE_MS = 420;

function mapImportErrorMessage(caughtError: unknown): string {
  if (caughtError instanceof Error && caughtError.message.trim().length > 0) {
    return caughtError.message;
  }

  return 'Could not load this molecule from PubChem.';
}

type UseMoleculeImportWorkflowOptions = {
  elements: ChemicalElement[];
  isOpen: boolean;
  onImport: (compound: ResolvedImportedPubChemCompound) => Promise<void> | void;
};

export default function useMoleculeImportWorkflow({
  elements,
  isOpen,
  onImport,
}: UseMoleculeImportWorkflowOptions) {
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

  const onQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSearchError(null);
  }, []);

  const onSelectSuggestion = useCallback((suggestion: string) => {
    setActiveTerm(suggestion);
    setSearchError(null);
    setImportError(null);
  }, []);

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
  const showEmptyState = useMemo(
    () => debouncedQuery.length > 0 && !isSearchBusy && searchError === null && results.length === 0,
    [debouncedQuery.length, isSearchBusy, results.length, searchError],
  );

  return {
    activeTerm,
    debouncedQuery,
    importError,
    importMode,
    importingCid,
    isResultsLoading,
    isSearchBusy,
    isSuggestionsLoading,
    onImportModeChange: setImportMode,
    onImportResult,
    onQueryChange,
    onSelectSuggestion,
    query,
    results,
    searchError,
    searchInputRef,
    showEmptyState,
    suggestions,
  };
}
