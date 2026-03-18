'use client';

import usePeriodicTableText from '@/components/organisms/periodic-table/usePeriodicTableText';

import type { ElementMetaRow } from './elementDetails.types';

type ElementDetailsDataTableProps = {
  dataRows: ElementMetaRow[];
};

export default function ElementDetailsDataTable({ dataRows }: ElementDetailsDataTableProps) {
  const text = usePeriodicTableText();

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
      <table className="min-w-full border-collapse text-left">
        <thead>
          <tr className="bg-[var(--surface-2)]">
            <th className="element-data-table__head px-2 py-2 font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] min-[420px]:px-3">
              {text.details.field}
            </th>
            <th className="element-data-table__head px-2 py-2 font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] min-[420px]:px-3">
              {text.details.value}
            </th>
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, index) => (
            <tr key={row.key} className={index % 2 === 0 ? 'bg-[var(--surface-2)]/60' : 'bg-transparent'}>
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
  );
}
