'use client';

import usePeriodicTableText from '@/components/organisms/periodic-table/usePeriodicTableText';

import ElementDetailsDataCards from './ElementDetailsDataCards';
import ElementDetailsDataTable from './ElementDetailsDataTable';
import type { DetailsViewMode, ElementMetaRow } from './elementDetails.types';

type ElementDetailsDataSectionProps = {
  detailsViewMode: DetailsViewMode;
  dataRows: ElementMetaRow[];
  cardRows: ElementMetaRow[];
  onToggleDetailsViewMode: () => void;
};

export default function ElementDetailsDataSection({
  detailsViewMode,
  dataRows,
  cardRows,
  onToggleDetailsViewMode,
}: ElementDetailsDataSectionProps) {
  const text = usePeriodicTableText();

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">{text.details.dataTitle}</p>
        <button
          type="button"
          onClick={onToggleDetailsViewMode}
          className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
        >
          {detailsViewMode === 'cards' ? text.details.tableView : text.details.cardView}
        </button>
      </div>

      {detailsViewMode === 'cards' ? (
        <ElementDetailsDataCards cardRows={cardRows} />
      ) : (
        <ElementDetailsDataTable dataRows={dataRows} />
      )}
    </section>
  );
}
