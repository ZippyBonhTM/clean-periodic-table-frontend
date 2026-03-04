'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useDeferredValue, useMemo, useState, useTransition } from 'react';

import type { ChemicalElement } from '@/shared/types/element';
import { matchesElementQuery, sortElements } from '@/shared/utils/elementPresentation';

type PeriodicViewMode = 'classic' | 'category' | 'compact';

type SortMode = 'number' | 'name' | 'symbol' | 'mass';
type PeriodicTableMode = 'explore' | 'table';

type PeriodicTableProps = {
  elements: ChemicalElement[];
  mode?: PeriodicTableMode;
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

const ClassicPeriodicView = dynamic(
  () => import('@/components/organisms/periodic-table/ClassicPeriodicView'),
);
const CategoryPeriodicView = dynamic(
  () => import('@/components/organisms/periodic-table/CategoryPeriodicView'),
);
const CompactPeriodicView = dynamic(
  () => import('@/components/organisms/periodic-table/CompactPeriodicView'),
);
const ElementDetailsModal = dynamic(
  () => import('@/components/organisms/periodic-table/ElementDetailsModal'),
  { ssr: false },
);

function PeriodicTable({ elements, mode = 'explore' }: PeriodicTableProps) {
  const [viewMode, setViewMode] = useState<PeriodicViewMode>('classic');
  const [sortMode, setSortMode] = useState<SortMode>('number');
  const [query, setQuery] = useState('');
  const [selectedElement, setSelectedElement] = useState<ChemicalElement | null>(null);
  const [isPendingTransition, startTransition] = useTransition();
  const isExploreMode = mode === 'explore';
  const deferredQuery = useDeferredValue(query);

  const openElementModal = useCallback((element: ChemicalElement) => {
    setSelectedElement(element);
  }, []);

  const closeElementModal = useCallback(() => {
    setSelectedElement(null);
  }, []);

  const filteredElements = useMemo(() => {
    if (!isExploreMode) {
      return elements;
    }

    return elements.filter((element) => matchesElementQuery(element, deferredQuery));
  }, [deferredQuery, elements, isExploreMode]);

  const sortedElements = useMemo(() => {
    if (!isExploreMode) {
      return elements;
    }

    return sortElements(filteredElements, sortMode);
  }, [elements, filteredElements, isExploreMode, sortMode]);

  const activeViewMode: PeriodicViewMode = isExploreMode ? viewMode : 'classic';

  const visibleElements = useMemo(() => {
    if (activeViewMode === 'classic') {
      return filteredElements;
    }

    return sortedElements;
  }, [activeViewMode, filteredElements, sortedElements]);

  const onClearQuery = useCallback(() => {
    setQuery('');
  }, []);

  const onLuckySearch = useCallback(() => {
    if (elements.length === 0) {
      return;
    }

    const randomIndex = Math.floor(Math.random() * elements.length);
    const randomElement = elements[randomIndex];

    setQuery(randomElement.name);
    setSelectedElement(randomElement);
  }, [elements]);

  return (
    <section className="space-y-4">
      {isExploreMode ? (
        <div className="surface-panel rounded-2xl border border-[var(--border-subtle)] p-4 md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
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

              <div className="mt-3 flex flex-wrap items-end gap-2">
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
                    className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text-strong)] outline-none transition-colors focus:border-[var(--accent)] sm:w-52"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.mode} value={option.mode}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={onLuckySearch}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
                >
                  Lucky Search
                </button>
                <button
                  type="button"
                  onClick={onClearQuery}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
                >
                  Clear
                </button>
              </div>

              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Showing {visibleElements.length} of {elements.length} elements.
              </p>
              {query !== deferredQuery || isPendingTransition ? (
                <p className="mt-1 text-xs text-[var(--text-muted)]">Updating view...</p>
              ) : null}
            </div>

            <div className="w-fit lg:ml-auto">
              <div className="rounded-xl border border-[var(--border-subtle)] px-3 py-2.5">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">View</p>
                <div className="flex flex-col gap-2">
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
            </div>
          </div>
        </div>
      ) : (
        <div className="surface-panel rounded-2xl border border-[var(--border-subtle)] px-4 py-3 text-xs text-[var(--text-muted)] shadow-sm">
          Dedicated periodic table mode. Click an element to open full details.
        </div>
      )}

      {activeViewMode === 'classic' ? (
        <ClassicPeriodicView elements={visibleElements} onElementOpen={openElementModal} />
      ) : activeViewMode === 'category' ? (
        <CategoryPeriodicView elements={visibleElements} onElementOpen={openElementModal} />
      ) : (
        <CompactPeriodicView elements={visibleElements} onElementOpen={openElementModal} />
      )}

      <ElementDetailsModal
        element={selectedElement}
        isOpen={selectedElement !== null}
        onClose={closeElementModal}
      />
    </section>
  );
}

export default memo(PeriodicTable);
export type { PeriodicTableMode };
