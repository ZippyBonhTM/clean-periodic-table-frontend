'use client';

import { memo, useDeferredValue, useMemo, useState, useTransition } from 'react';

import ClassicPeriodicView from '@/components/organisms/periodic-table/ClassicPeriodicView';
import CompactPeriodicView from '@/components/organisms/periodic-table/CompactPeriodicView';
import CategoryPeriodicView from '@/components/organisms/periodic-table/CategoryPeriodicView';
import type { ChemicalElement } from '@/shared/types/element';
import { matchesElementQuery, sortElements } from '@/shared/utils/elementPresentation';

type PeriodicViewMode = 'classic' | 'category' | 'compact';

type SortMode = 'number' | 'name' | 'symbol' | 'mass';

type PeriodicTableProps = {
  elements: ChemicalElement[];
};

const VIEW_OPTIONS: Array<{ mode: PeriodicViewMode; label: string }> = [
  { mode: 'classic', label: 'Classic' },
  { mode: 'category', label: 'By Category' },
  { mode: 'compact', label: 'Compact' },
];

const SORT_OPTIONS: Array<{ mode: SortMode; label: string }> = [
  { mode: 'number', label: 'Atomic Number' },
  { mode: 'name', label: 'Name' },
  { mode: 'symbol', label: 'Symbol' },
  { mode: 'mass', label: 'Atomic Mass' },
];

function PeriodicTable({ elements }: PeriodicTableProps) {
  const [viewMode, setViewMode] = useState<PeriodicViewMode>('classic');
  const [sortMode, setSortMode] = useState<SortMode>('number');
  const [query, setQuery] = useState('');
  const [isPendingTransition, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const filteredElements = useMemo(() => {
    return elements.filter((element) => matchesElementQuery(element, deferredQuery));
  }, [deferredQuery, elements]);

  const sortedElements = useMemo(() => {
    return sortElements(filteredElements, sortMode);
  }, [filteredElements, sortMode]);

  const visibleElements = useMemo(() => {
    if (viewMode === 'classic') {
      return filteredElements;
    }

    return sortedElements;
  }, [filteredElements, sortedElements, viewMode]);

  return (
    <section className="space-y-4">
      <div className="surface-panel rounded-2xl border border-[var(--border-subtle)] p-4 md:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
          <div>
            <label
              htmlFor="element-search"
              className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]"
            >
              Search Element
            </label>
            <input
              id="element-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, symbol, number, phase, category..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none transition-colors focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">View</p>
            <div className="flex flex-wrap gap-2">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => {
                    startTransition(() => {
                      setViewMode(option.mode);
                    });
                  }}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                    option.mode === viewMode
                      ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--text-strong)]'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="sort-mode"
              className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]"
            >
              Sort
            </label>
            <select
              id="sort-mode"
              value={sortMode}
              onChange={(event) => {
                startTransition(() => {
                  setSortMode(event.target.value as SortMode);
                });
              }}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none transition-colors focus:border-[var(--accent)] lg:w-52"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.mode} value={option.mode}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Showing {visibleElements.length} of {elements.length} elements.
        </p>
        {query !== deferredQuery || isPendingTransition ? (
          <p className="mt-1 text-xs text-[var(--text-muted)]">Updating view...</p>
        ) : null}
      </div>

      {viewMode === 'classic' ? (
        <ClassicPeriodicView elements={visibleElements} />
      ) : viewMode === 'category' ? (
        <CategoryPeriodicView elements={visibleElements} />
      ) : (
        <CompactPeriodicView elements={visibleElements} />
      )}
    </section>
  );
}

export default memo(PeriodicTable);
