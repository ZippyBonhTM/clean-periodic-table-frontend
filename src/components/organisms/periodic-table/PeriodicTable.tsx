'use client';

import { memo, useRef, useState, useTransition } from 'react';

import type { ChemicalElement } from '@/shared/types/element';

import PeriodicTableExploreControls from './PeriodicTableExploreControls';
import PeriodicTableOptionMenu from './PeriodicTableOptionMenu';
import PeriodicTableStage from './PeriodicTableStage';
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

      <PeriodicTableStage
        activeViewMode={activeViewMode}
        visibleElements={visibleElements}
        classicZoomPercent={classicZoomPercent}
        isFullscreenActive={isFullscreenActive}
        fullscreenContainerRef={fullscreenContainerRef}
        onClassicZoomChange={setClassicZoomPercent}
        onToggleTableFullscreen={onToggleTableFullscreen}
        onElementOpen={openElementModal}
        selectedElement={selectedElement}
        onCloseElementModal={closeElementModal}
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
