'use client';

import { memo } from 'react';

import Button from '@/components/atoms/Button';
import type { PubChemCompoundSearchResult } from '@/shared/api/pubchemApi';

type MoleculeImportResultCardProps = {
  isImporting: boolean;
  onImport: (result: PubChemCompoundSearchResult) => void;
  result: PubChemCompoundSearchResult;
};

const MoleculeImportResultCard = memo(function MoleculeImportResultCard({
  isImporting,
  onImport,
  result,
}: MoleculeImportResultCardProps) {
  return (
    <article className="rounded-[1.5rem] border border-(--border-subtle) bg-(--surface-overlay-soft) p-4 shadow-sm">
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
              onImport(result);
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
});

export default MoleculeImportResultCard;
