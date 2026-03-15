'use client';

import { memo } from 'react';

import FloatingModal from '@/components/molecules/FloatingModal';
import MoleculeImportResultCard from '@/components/molecules/chemistry/MoleculeImportResultCard';
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
