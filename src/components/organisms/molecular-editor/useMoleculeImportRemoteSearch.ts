'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  listPubChemAutocompleteSuggestions,
  listPubChemCompoundResultsByTerm,
  type PubChemCompoundSearchResult,
} from '@/shared/api/pubchemApi';

import { mapImportErrorMessage } from '@/components/organisms/molecular-editor/moleculeImportWorkflow.utils';

type UseMoleculeImportRemoteSearchOptions = {
  debouncedQuery: string;
  isOpen: boolean;
};

export default function useMoleculeImportRemoteSearch({
  debouncedQuery,
  isOpen,
}: UseMoleculeImportRemoteSearchOptions) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const [results, setResults] = useState<PubChemCompoundSearchResult[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isResultsLoading, setIsResultsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const clearRemoteSearch = useCallback(() => {
    setSuggestions([]);
    setActiveTerm(null);
    setResults([]);
    setSearchError(null);
  }, []);

  useEffect(() => {
    if (!isOpen || debouncedQuery.length === 0) {
      return;
    }

    const controller = new AbortController();
    const loadSuggestions = async () => {
      setIsSuggestionsLoading(true);
      setSearchError(null);

      try {
        const nextSuggestions = await listPubChemAutocompleteSuggestions(debouncedQuery, controller.signal);

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
      } catch (caughtError: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        setSuggestions([]);
        setActiveTerm(debouncedQuery);
        setSearchError(mapImportErrorMessage(caughtError));
      } finally {
        if (!controller.signal.aborted) {
          setIsSuggestionsLoading(false);
        }
      }
    };

    void loadSuggestions();

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, isOpen]);

  useEffect(() => {
    if (!isOpen || activeTerm === null || activeTerm.trim().length === 0) {
      return;
    }

    const controller = new AbortController();
    const loadResults = async () => {
      setIsResultsLoading(true);

      try {
        const nextResults = await listPubChemCompoundResultsByTerm(activeTerm, controller.signal);

        if (controller.signal.aborted) {
          return;
        }

        setResults(nextResults);
      } catch (caughtError: unknown) {
        if (controller.signal.aborted) {
          return;
        }

        setResults([]);
        setSearchError(mapImportErrorMessage(caughtError));
      } finally {
        if (!controller.signal.aborted) {
          setIsResultsLoading(false);
        }
      }
    };

    void loadResults();

    return () => {
      controller.abort();
    };
  }, [activeTerm, isOpen]);

  const onSelectSuggestion = useCallback((suggestion: string) => {
    setActiveTerm(suggestion);
    setSearchError(null);
  }, []);

  return {
    activeTerm,
    clearRemoteSearch,
    isResultsLoading,
    isSuggestionsLoading,
    onSelectSuggestion,
    results,
    searchError,
    setSearchError,
    suggestions,
  };
}
