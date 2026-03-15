'use client';

import { memo } from 'react';

import FloatingModal from '@/components/molecules/FloatingModal';
import MoleculeImportResultsPanel from '@/components/organisms/molecular-editor/MoleculeImportResultsPanel';
import MoleculeImportSidebar from '@/components/organisms/molecular-editor/MoleculeImportSidebar';
import useMoleculeImportWorkflow from '@/components/organisms/molecular-editor/useMoleculeImportWorkflow';
import { type ResolvedImportedPubChemCompound } from '@/shared/api/pubchemApi';
import type { ChemicalElement } from '@/shared/types/element';

type MoleculeImportModalProps = {
  isOpen: boolean;
  elements: ChemicalElement[];
  onClose: () => void;
  onImport: (compound: ResolvedImportedPubChemCompound) => Promise<void> | void;
};

function MoleculeImportModal({
  isOpen,
  elements,
  onClose,
  onImport,
}: MoleculeImportModalProps) {
  const {
    activeTerm,
    debouncedQuery,
    importError,
    importMode,
    importingCid,
    isSearchBusy,
    isSuggestionsLoading,
    onImportModeChange,
    onImportResult,
    onQueryChange,
    onSelectSuggestion,
    query,
    results,
    searchError,
    searchInputRef,
    showEmptyState,
    suggestions,
  } = useMoleculeImportWorkflow({
    elements,
    isOpen,
    onImport,
  });

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
          onImportModeChange={onImportModeChange}
          onQueryChange={onQueryChange}
          onSelectSuggestion={onSelectSuggestion}
          query={query}
          searchInputRef={searchInputRef}
          suggestions={suggestions}
        />

        <MoleculeImportResultsPanel
          activeTerm={activeTerm}
          debouncedQuery={debouncedQuery}
          importError={importError}
          importingCid={importingCid}
          isSearchBusy={isSearchBusy}
          onImportResult={onImportResult}
          results={results}
          searchError={searchError}
          showEmptyState={showEmptyState}
        />
      </div>
    </FloatingModal>
  );
}

export default memo(MoleculeImportModal);
