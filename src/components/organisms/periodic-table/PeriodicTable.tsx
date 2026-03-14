'use client';

import dynamic from 'next/dynamic';
import {
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';

import type { ChemicalElement } from '@/shared/types/element';
import { matchesElementQuery, sortElements } from '@/shared/utils/elementPresentation';

import PeriodicTableExploreControls from './PeriodicTableExploreControls';
import PeriodicTableOptionMenu from './PeriodicTableOptionMenu';
import {
  SORT_OPTIONS,
  VIEW_OPTIONS,
  type PeriodicTableMode,
  type PeriodicViewMode,
  type SortMode,
} from './periodicTable.types';
import useFloatingMenuPosition from './useFloatingMenuPosition';
import usePeriodicTableFullscreen from './usePeriodicTableFullscreen';

type PeriodicTableProps = {
  elements: ChemicalElement[];
  mode?: PeriodicTableMode;
};

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
  const [classicZoomPercent, setClassicZoomPercent] = useState(100);
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
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

  const sortMenuPosition = useFloatingMenuPosition({
    anchorRef: sortToggleRef,
    isOpen: isSortMenuOpen,
    minWidth: 208,
    onRequestClose: () => setIsSortMenuOpen(false),
  });

  const viewMenuPosition = useFloatingMenuPosition({
    anchorRef: viewToggleRef,
    isOpen: isViewMenuOpen,
    minWidth: 176,
    onRequestClose: () => setIsViewMenuOpen(false),
  });

  const { fullscreenContainerRef, isFullscreenActive, onToggleTableFullscreen } =
    usePeriodicTableFullscreen({
      activeViewMode,
      classicZoomPercent,
      onClassicZoomChange: setClassicZoomPercent,
    });

  const currentSortOption = useMemo(() => {
    return SORT_OPTIONS.find((option) => option.mode === sortMode) ?? SORT_OPTIONS[0];
  }, [sortMode]);

  return (
    <section className="space-y-4">
      {isExploreMode ? (
        <PeriodicTableExploreControls
          query={query}
          deferredQuery={deferredQuery}
          isPendingTransition={isPendingTransition}
          totalElements={elements.length}
          visibleElementsCount={visibleElements.length}
          viewMode={viewMode}
          isViewMenuOpen={isViewMenuOpen}
          isSortMenuOpen={isSortMenuOpen}
          currentSortLabel={currentSortOption.label}
          onQueryChange={setQuery}
          onToggleSortMenu={() => {
            setIsSortMenuOpen((previous) => {
              const nextState = !previous;

              if (nextState) {
                setIsViewMenuOpen(false);
              }

              return nextState;
            });
          }}
          onLuckySearch={onLuckySearch}
          onClearQuery={onClearQuery}
          onToggleViewMenu={() => {
            setIsViewMenuOpen((previous) => {
              const nextState = !previous;

              if (nextState) {
                setIsSortMenuOpen(false);
              }

              return nextState;
            });
          }}
          onSelectViewMode={(nextViewMode) => {
            startTransition(() => {
              setViewMode(nextViewMode);
            });
            setIsViewMenuOpen(false);
          }}
          sortToggleRef={sortToggleRef}
          viewToggleRef={viewToggleRef}
        />
      ) : (
        <div className="surface-panel rounded-2xl border border-[var(--border-subtle)] px-4 py-3 text-xs text-[var(--text-muted)] shadow-sm">
          Dedicated periodic table mode. Click an element to open full details.
        </div>
      )}

      <PeriodicTableOptionMenu
        isOpen={isSortMenuOpen}
        position={sortMenuPosition}
        ariaLabel="Sort options"
        options={SORT_OPTIONS}
        selectedMode={sortMode}
        onClose={() => setIsSortMenuOpen(false)}
        onSelect={(nextSortMode) => {
          startTransition(() => {
            setSortMode(nextSortMode as SortMode);
          });
          setIsSortMenuOpen(false);
        }}
        zIndexClassName="z-[71]"
      />

      <PeriodicTableOptionMenu
        isOpen={isViewMenuOpen}
        position={viewMenuPosition}
        ariaLabel="View options"
        options={VIEW_OPTIONS}
        selectedMode={viewMode}
        onClose={() => setIsViewMenuOpen(false)}
        onSelect={(nextViewMode) => {
          startTransition(() => {
            setViewMode(nextViewMode as PeriodicViewMode);
          });
          setIsViewMenuOpen(false);
        }}
      />

      <div
        ref={fullscreenContainerRef}
        className={`relative ${isFullscreenActive ? 'h-[100dvh] overflow-auto bg-[var(--background-base)] p-3' : ''}`}
      >
        {isFullscreenActive && activeViewMode !== 'classic' ? (
          <div className="pointer-events-none absolute right-3 top-3 z-40">
            <button
              type="button"
              onClick={onToggleTableFullscreen}
              aria-label="Exit fullscreen table"
              className="pointer-events-auto rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)]/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
            >
              Exit Fullscreen
            </button>
          </div>
        ) : null}

        <div>
          {activeViewMode === 'classic' ? (
            <ClassicPeriodicView
              elements={visibleElements}
              onElementOpen={openElementModal}
              zoomPercent={classicZoomPercent}
              onZoomChange={setClassicZoomPercent}
              isFullscreen={isFullscreenActive}
              onToggleFullscreen={onToggleTableFullscreen}
            />
          ) : activeViewMode === 'category' ? (
            <CategoryPeriodicView elements={visibleElements} onElementOpen={openElementModal} />
          ) : (
            <CompactPeriodicView elements={visibleElements} onElementOpen={openElementModal} />
          )}
        </div>

        <ElementDetailsModal
          element={selectedElement}
          isOpen={selectedElement !== null}
          onClose={closeElementModal}
          hasPreviousElement={hasPreviousElement}
          hasNextElement={hasNextElement}
          onOpenPreviousElement={openPreviousElement}
          onOpenNextElement={openNextElement}
        />
      </div>
    </section>
  );
}

export default memo(PeriodicTable);
export type { PeriodicTableMode };
