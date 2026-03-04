'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';

import Button from '@/components/atoms/Button';
import type { ChemicalElement } from '@/shared/types/element';
import { matchesElementQuery, sortElements } from '@/shared/utils/elementPresentation';

type PeriodicViewMode = 'classic' | 'category' | 'compact';

type SortMode = 'number' | 'name' | 'symbol' | 'mass';
type PeriodicTableMode = 'explore' | 'table';

type PeriodicTableProps = {
  elements: ChemicalElement[];
  mode?: PeriodicTableMode;
};

type FloatingMenuPosition = {
  left: number;
  top: number;
  width: number;
};

const VIEW_OPTIONS: Array<{ mode: PeriodicViewMode; label: string }> = [
  { mode: 'classic', label: 'Classic' },
  { mode: 'category', label: 'Category' },
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

function WideChevron({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      viewBox="0 0 16 10"
      aria-hidden="true"
      className={`h-1.5 w-2.5 transition-transform duration-200 [transform-origin:50%_50%] ${
        isOpen ? 'rotate-180' : 'rotate-0'
      }`}
      fill="none"
    >
      <path
        d="M1.25 2.25L8 8L14.75 2.25"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeriodicTable({ elements, mode = 'explore' }: PeriodicTableProps) {
  const [viewMode, setViewMode] = useState<PeriodicViewMode>('classic');
  const [classicZoomPercent, setClassicZoomPercent] = useState(100);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [viewMenuPosition, setViewMenuPosition] = useState<FloatingMenuPosition | null>(null);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortMenuPosition, setSortMenuPosition] = useState<FloatingMenuPosition | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('number');
  const [query, setQuery] = useState('');
  const [selectedElement, setSelectedElement] = useState<ChemicalElement | null>(null);
  const viewToggleRef = useRef<HTMLButtonElement | null>(null);
  const sortToggleRef = useRef<HTMLButtonElement | null>(null);
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

  const selectedElementIndex = useMemo(() => {
    if (selectedElement === null) {
      return -1;
    }

    return visibleElements.findIndex((element) => element.symbol === selectedElement.symbol);
  }, [selectedElement, visibleElements]);

  const hasPreviousElement = selectedElementIndex > 0;
  const hasNextElement =
    selectedElementIndex >= 0 && selectedElementIndex < visibleElements.length - 1;

  const openPreviousElement = useCallback(() => {
    if (!hasPreviousElement) {
      return;
    }

    const previousElement = visibleElements[selectedElementIndex - 1];

    if (previousElement !== undefined) {
      setSelectedElement(previousElement);
    }
  }, [hasPreviousElement, selectedElementIndex, visibleElements]);

  const openNextElement = useCallback(() => {
    if (!hasNextElement) {
      return;
    }

    const nextElement = visibleElements[selectedElementIndex + 1];

    if (nextElement !== undefined) {
      setSelectedElement(nextElement);
    }
  }, [hasNextElement, selectedElementIndex, visibleElements]);

  const getFloatingMenuPosition = useCallback((anchor: HTMLButtonElement, minWidth: number) => {
    if (typeof window === 'undefined') {
      return null;
    }

    const rect = anchor.getBoundingClientRect();
    const width = Math.max(minWidth, Math.round(rect.width));
    const maxLeft = Math.max(8, window.innerWidth - width - 8);
    const left = Math.max(8, Math.min(Math.round(rect.left), maxLeft));

    return {
      left,
      top: Math.round(rect.bottom + 8),
      width,
    } satisfies FloatingMenuPosition;
  }, []);

  const syncViewMenuPosition = useCallback(() => {
    if (viewToggleRef.current === null) {
      return;
    }

    setViewMenuPosition(getFloatingMenuPosition(viewToggleRef.current, 176));
  }, [getFloatingMenuPosition]);

  const syncSortMenuPosition = useCallback(() => {
    if (sortToggleRef.current === null) {
      return;
    }

    setSortMenuPosition(getFloatingMenuPosition(sortToggleRef.current, 208));
  }, [getFloatingMenuPosition]);

  useEffect(() => {
    if (!isViewMenuOpen) {
      setViewMenuPosition(null);
      return;
    }

    syncViewMenuPosition();

    const onWindowChange = () => {
      syncViewMenuPosition();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsViewMenuOpen(false);
      }
    };

    window.addEventListener('resize', onWindowChange);
    window.addEventListener('scroll', onWindowChange, true);
    window.addEventListener('keydown', onEscape);

    return () => {
      window.removeEventListener('resize', onWindowChange);
      window.removeEventListener('scroll', onWindowChange, true);
      window.removeEventListener('keydown', onEscape);
    };
  }, [isViewMenuOpen, syncViewMenuPosition]);

  useEffect(() => {
    if (!isSortMenuOpen) {
      setSortMenuPosition(null);
      return;
    }

    syncSortMenuPosition();

    const onWindowChange = () => {
      syncSortMenuPosition();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSortMenuOpen(false);
      }
    };

    window.addEventListener('resize', onWindowChange);
    window.addEventListener('scroll', onWindowChange, true);
    window.addEventListener('keydown', onEscape);

    return () => {
      window.removeEventListener('resize', onWindowChange);
      window.removeEventListener('scroll', onWindowChange, true);
      window.removeEventListener('keydown', onEscape);
    };
  }, [isSortMenuOpen, syncSortMenuPosition]);

  const currentSortOption = useMemo(() => {
    return SORT_OPTIONS.find((option) => option.mode === sortMode) ?? SORT_OPTIONS[0];
  }, [sortMode]);

  const compactViewMenuPortal =
    isViewMenuOpen && viewMenuPosition !== null && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[70]"
            onClick={() => setIsViewMenuOpen(false)}
            aria-hidden="true"
          >
            <div
              className="absolute inset-0 bg-transparent"
            />
            <div
              className="absolute origin-top-left rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2 shadow-lg animate-[rise-fade_180ms_ease-out]"
              style={{
                left: viewMenuPosition.left,
                top: viewMenuPosition.top,
                width: viewMenuPosition.width,
              }}
              onClick={(event) => event.stopPropagation()}
              role="menu"
              aria-label="View options"
            >
              <div className="flex flex-col gap-1.5">
                {VIEW_OPTIONS.map((option) => (
                  <Button
                    key={option.mode}
                    type="button"
                    variant={option.mode === viewMode ? 'secondary' : 'ghost'}
                    size="sm"
                    align="left"
                    onClick={() => {
                      startTransition(() => {
                        setViewMode(option.mode);
                      });
                      setIsViewMenuOpen(false);
                    }}
                    className="w-full"
                    role="menuitem"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  const sortMenuPortal =
    isSortMenuOpen && sortMenuPosition !== null && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[71]"
            onClick={() => setIsSortMenuOpen(false)}
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-transparent" />
            <div
              className="absolute origin-top-left rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2 shadow-lg animate-[rise-fade_180ms_ease-out]"
              style={{
                left: sortMenuPosition.left,
                top: sortMenuPosition.top,
                width: sortMenuPosition.width,
              }}
              onClick={(event) => event.stopPropagation()}
              role="menu"
              aria-label="Sort options"
            >
              <div className="flex flex-col gap-1.5">
                {SORT_OPTIONS.map((option) => (
                  <Button
                    key={option.mode}
                    type="button"
                    variant={option.mode === sortMode ? 'secondary' : 'ghost'}
                    size="sm"
                    align="left"
                    onClick={() => {
                      startTransition(() => {
                        setSortMode(option.mode);
                      });
                      setIsSortMenuOpen(false);
                    }}
                    className="w-full"
                    role="menuitem"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <section className="space-y-4">
      {isExploreMode ? (
        <div className="surface-panel rounded-2xl border border-[var(--border-subtle)] overflow-visible [contain:none] p-4 md:p-5">
          <div className="flex flex-col gap-3 min-[518px]:flex-row min-[518px]:items-start">
            <div className="min-w-0 min-[518px]:flex-[1_1_360px]">
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
                <div className="relative">
                  <label
                    htmlFor="sort-mode-toggle"
                    className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]"
                  >
                    Sort
                  </label>
                  <Button
                    id="sort-mode-toggle"
                    type="button"
                    ref={sortToggleRef}
                    variant="ghost"
                    size="md"
                    align="between"
                    onClick={() => {
                      setIsSortMenuOpen((previous) => {
                        const nextState = !previous;

                        if (nextState) {
                          setIsViewMenuOpen(false);
                        }

                        return nextState;
                      });
                    }}
                    aria-expanded={isSortMenuOpen}
                    aria-label="Toggle sort options"
                  >
                    <span>{currentSortOption.label}</span>
                    <WideChevron isOpen={isSortMenuOpen} />
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={onLuckySearch}
                >
                  Lucky Search
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={onClearQuery}
                >
                  Clear
                </Button>

                <div className="relative min-[518px]:hidden">
                  <Button
                    type="button"
                    ref={viewToggleRef}
                    variant="ghost"
                    size="md"
                    align="between"
                    onClick={() => {
                      setIsViewMenuOpen((previous) => {
                        const nextState = !previous;

                        if (nextState) {
                          setIsSortMenuOpen(false);
                        }

                        return nextState;
                      });
                    }}
                    aria-expanded={isViewMenuOpen}
                    aria-label="Toggle view options"
                  >
                    View
                    <WideChevron isOpen={isViewMenuOpen} />
                  </Button>
                </div>
              </div>

              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Showing {visibleElements.length} of {elements.length} elements.
              </p>
              {query !== deferredQuery || isPendingTransition ? (
                <p className="mt-1 text-xs text-[var(--text-muted)]">Updating view...</p>
              ) : null}
            </div>

            <div className="hidden min-[518px]:ml-auto min-[518px]:w-fit min-[518px]:shrink-0 min-[518px]:block">
              <div className="rounded-xl border border-[var(--border-subtle)] px-2.5 py-2">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">View</p>
                <div className="flex flex-col items-start gap-1.5">
                  {VIEW_OPTIONS.map((option) => (
                    <Button
                      key={option.mode}
                      type="button"
                      variant={option.mode === viewMode ? 'secondary' : 'ghost'}
                      size="sm"
                      align="left"
                      onClick={() => {
                        startTransition(() => {
                          setViewMode(option.mode);
                        });
                      }}
                      className="w-full"
                    >
                      {option.label}
                    </Button>
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
      {sortMenuPortal}
      {compactViewMenuPortal}

      {activeViewMode === 'classic' ? (
        <ClassicPeriodicView
          elements={visibleElements}
          onElementOpen={openElementModal}
          zoomPercent={classicZoomPercent}
          onZoomChange={setClassicZoomPercent}
        />
      ) : activeViewMode === 'category' ? (
        <CategoryPeriodicView elements={visibleElements} onElementOpen={openElementModal} />
      ) : (
        <CompactPeriodicView elements={visibleElements} onElementOpen={openElementModal} />
      )}

      <ElementDetailsModal
        element={selectedElement}
        isOpen={selectedElement !== null}
        onClose={closeElementModal}
        hasPreviousElement={hasPreviousElement}
        hasNextElement={hasNextElement}
        onOpenPreviousElement={openPreviousElement}
        onOpenNextElement={openNextElement}
      />
    </section>
  );
}

export default memo(PeriodicTable);
export type { PeriodicTableMode };
