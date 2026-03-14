'use client';

import dynamic from 'next/dynamic';
import { memo, useRef, useState, useTransition } from 'react';

import type { ChemicalElement } from '@/shared/types/element';

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
import usePeriodicTableElements from './usePeriodicTableElements';
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
  const viewToggleRef = useRef<HTMLButtonElement | null>(null);
  const sortToggleRef = useRef<HTMLButtonElement | null>(null);
  const [isPendingTransition, startTransition] = useTransition();
  const isExploreMode = mode === 'explore';
  const activeViewMode: PeriodicViewMode = isExploreMode ? viewMode : 'classic';

  const {
    sortMode,
    setSortMode,
    query,
    setQuery,
    deferredQuery,
    visibleElements,
    selectedElement,
    currentSortOption,
    onClearQuery,
    onLuckySearch,
    openElementModal,
    closeElementModal,
    hasPreviousElement,
    hasNextElement,
    openPreviousElement,
    openNextElement,
  } = usePeriodicTableElements({
    elements,
    isExploreMode,
    activeViewMode,
  });

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
