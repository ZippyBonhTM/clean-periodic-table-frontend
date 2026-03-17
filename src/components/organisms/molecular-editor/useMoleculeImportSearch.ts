'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SEARCH_DEBOUNCE_MS } from '@/components/organisms/molecular-editor/moleculeImportWorkflow.utils';
import useMoleculeImportRemoteSearch from '@/components/organisms/molecular-editor/useMoleculeImportRemoteSearch';

type UseMoleculeImportSearchOptions = {
  isOpen: boolean;
};

export default function useMoleculeImportSearch({
  isOpen,
}: UseMoleculeImportSearchOptions) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const {
    activeTerm,
    clearRemoteSearch,
    isResultsLoading,
    isSuggestionsLoading,
    onSelectSuggestion,
    results,
    searchError,
    setSearchError,
    suggestions,
  } = useMoleculeImportRemoteSearch({
    debouncedQuery,
    isOpen,
  });

  useEffect(() => {
    if (!isOpen) {
      const frame = window.requestAnimationFrame(() => {
        setQuery('');
        setDebouncedQuery('');
        clearRemoteSearch();
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
  }, [clearRemoteSearch, isOpen]);

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

  const onQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      setSearchError(null);

      if (value.trim().length === 0) {
        setDebouncedQuery('');
        clearRemoteSearch();
      }
    },
    [clearRemoteSearch, setSearchError],
  );

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
