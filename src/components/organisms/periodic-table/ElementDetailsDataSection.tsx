'use client';

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
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">Element Data</p>
        <button
          type="button"
          onClick={onToggleDetailsViewMode}
          className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
        >
          {detailsViewMode === 'cards' ? 'Table View' : 'Card View'}
        </button>
      </div>

      {detailsViewMode === 'cards' ? (
        <div className="element-data-cards-grid grid gap-2">
          {cardRows.map((row) => (
            <article key={row.label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
              <p className="element-data-card__label uppercase tracking-[0.12em] text-[var(--text-muted)]">{row.label}</p>
              <p className="element-data-card__value mt-1 break-words text-[var(--text-strong)]">{row.value}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
          <table className="min-w-full border-collapse text-left">
            <thead>
              <tr className="bg-[var(--surface-2)]">
                <th className="element-data-table__head px-2 py-2 font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] min-[420px]:px-3">
                  Field
                </th>
                <th className="element-data-table__head px-2 py-2 font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] min-[420px]:px-3">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, index) => (
                <tr
                  key={row.label}
                  className={index % 2 === 0 ? 'bg-[var(--surface-2)]/60' : 'bg-transparent'}
                >
                  <td className="element-data-table__field whitespace-nowrap px-2 py-2 align-top font-semibold text-[var(--text-muted)] min-[420px]:px-3">
                    {row.label}
                  </td>
                  <td className="element-data-table__value px-2 py-2 text-[var(--text-strong)] min-[420px]:px-3">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
