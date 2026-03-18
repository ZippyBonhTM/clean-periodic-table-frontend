'use client';

import type { ElementMetaRow } from './elementDetails.types';

type ElementDetailsDataCardsProps = {
  cardRows: ElementMetaRow[];
};

export default function ElementDetailsDataCards({ cardRows }: ElementDetailsDataCardsProps) {
  return (
    <div className="element-data-cards-grid grid gap-2">
      {cardRows.map((row) => (
        <article key={row.key} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
          <p className="element-data-card__label uppercase tracking-[0.12em] text-[var(--text-muted)]">{row.label}</p>
          <p className="element-data-card__value mt-1 break-words text-[var(--text-strong)]">{row.value}</p>
        </article>
      ))}
    </div>
  );
}
