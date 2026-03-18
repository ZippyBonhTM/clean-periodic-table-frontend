'use client';

import MoleculeImportResultCard from '@/components/molecules/chemistry/MoleculeImportResultCard';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
import { type PubChemCompoundSearchResult } from '@/shared/api/pubchemApi';

type MoleculeImportResultsPanelProps = {
  activeTerm: string | null;
  debouncedQuery: string;
  importError: string | null;
  importingCid: number | null;
  isSearchBusy: boolean;
  onImportResult: (compound: PubChemCompoundSearchResult) => Promise<void> | void;
  results: PubChemCompoundSearchResult[];
  searchError: string | null;
  showEmptyState: boolean;
};

export default function MoleculeImportResultsPanel({
  activeTerm,
  debouncedQuery,
  importError,
  importingCid,
  isSearchBusy,
  onImportResult,
  results,
  searchError,
  showEmptyState,
}: MoleculeImportResultsPanelProps) {
  const text = useMolecularEditorText();

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-(--border-subtle) bg-(--surface-overlay-subtle) px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted)">{text.importModal.results}</p>
          <p className="mt-1 text-sm leading-relaxed text-(--text-muted)">
            {activeTerm === null
              ? text.importModal.resultsIdle
              : `${text.importModal.resultsForPrefix} "${activeTerm}".`}
          </p>
        </div>
        {isSearchBusy ? (
          <span className="inline-flex rounded-full border border-(--border-subtle) bg-(--surface-overlay-faint) px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-muted)">
            {text.importModal.searching}
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
          {text.importModal.searchPrompt}
        </div>
      ) : showEmptyState ? (
        <div className="rounded-[1.5rem] border border-dashed border-(--border-subtle) bg-(--surface-overlay-faint) px-4 py-8 text-center text-sm leading-relaxed text-(--text-muted)">
          {text.importModal.noResults}
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
  );
}
