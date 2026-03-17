'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  importPubChemCompound,
  type PubChemImportMode,
  type ResolvedImportedPubChemCompound,
} from '@/shared/api/pubchemApi';
import type { ChemicalElement } from '@/shared/types/element';

import { mapImportErrorMessage } from '@/components/organisms/molecular-editor/moleculeImportWorkflow.utils';
import useMoleculeImportSearch from '@/components/organisms/molecular-editor/useMoleculeImportSearch';

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
  const [importError, setImportError] = useState<string | null>(null);
  const [importingCid, setImportingCid] = useState<number | null>(null);
  const [importMode, setImportMode] = useState<PubChemImportMode>('main');

  const {
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
  } = useMoleculeImportSearch({
    isOpen,
  });

  useEffect(() => {
    if (!isOpen) {
      const frame = window.requestAnimationFrame(() => {
        setImportError(null);
        setImportingCid(null);
        setImportMode('main');
      });

      return () => {
        window.cancelAnimationFrame(frame);
      };
    }
  }, [isOpen]);

  const onImportResult = useCallback(
    async (result: (typeof results)[number]) => {
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

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      setImportError(null);
      onSelectSuggestion(suggestion);
    },
    [onSelectSuggestion],
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
    onSelectSuggestion: handleSelectSuggestion,
    query,
    results,
    searchError,
    searchInputRef,
    showEmptyState,
    suggestions,
  };
}
