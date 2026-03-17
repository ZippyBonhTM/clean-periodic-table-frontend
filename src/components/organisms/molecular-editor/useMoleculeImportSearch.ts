'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  listPubChemAutocompleteSuggestions,
  listPubChemCompoundResultsByTerm,
  type PubChemCompoundSearchResult,
} from '@/shared/api/pubchemApi';

import {
  mapImportErrorMessage,
  SEARCH_DEBOUNCE_MS,
} from '@/components/organisms/molecular-editor/moleculeImportWorkflow.utils';

type UseMoleculeImportSearchOptions = {
  isOpen: boolean;
};

export default function useMoleculeImportSearch({
  isOpen,
}: UseMoleculeImportSearchOptions) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeTerm, setActiveTerm] = useState<string | null>(null);
  const [results, setResults] = useState<PubChemCompoundSearchResult[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [isResultsLoading, setIsResultsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      const frame = window.requestAnimationFrame(() => {
        setQuery('');
        setDebouncedQuery('');
        setSuggestions([]);
        setActiveTerm(null);
        setResults([]);
        setSearchError(null);
      });

      return () => {
        window.cancelAnimationFrame(frame);
      };
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
    if (!isOpen) {
      return;
    }

    if (activeTerm === null || activeTerm.trim().length === 0) {
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

  const onQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSearchError(null);

    if (value.trim().length === 0) {
      setDebouncedQuery('');
      setSuggestions([]);
      setActiveTerm(null);
      setResults([]);
    }
  }, []);

  const onSelectSuggestion = useCallback((suggestion: string) => {
    setActiveTerm(suggestion);
    setSearchError(null);
  }, []);

  const isSearchBusy = isSuggestionsLoading || isResultsLoading;
  const showEmptyState = useMemo(
    () => debouncedQuery.length > 0 && !isSearchBusy && searchError === null && results.length === 0,
    [debouncedQuery.length, isSearchBusy, results.length, searchError],
  );

  return {
    activeTerm,
    debouncedQuery,
    isResultsLoading,
    isSearchBusy,
    isSuggestionsLoading,
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
