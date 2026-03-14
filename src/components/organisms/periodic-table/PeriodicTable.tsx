'use client';

import dynamic from 'next/dynamic';
import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
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
  type FloatingMenuPosition,
  type PeriodicTableMode,
  type PeriodicViewMode,
  type SortMode,
} from './periodicTable.types';

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
  const [viewMenuPosition, setViewMenuPosition] = useState<FloatingMenuPosition | null>(null);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [sortMenuPosition, setSortMenuPosition] = useState<FloatingMenuPosition | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('number');
  const [query, setQuery] = useState('');
  const [selectedElement, setSelectedElement] = useState<ChemicalElement | null>(null);
  const [isTableFullscreen, setIsTableFullscreen] = useState(false);
  const [isSimulatedFullscreen, setIsSimulatedFullscreen] = useState(false);
  const viewToggleRef = useRef<HTMLButtonElement | null>(null);
  const sortToggleRef = useRef<HTMLButtonElement | null>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement | null>(null);
  const previousZoomRef = useRef<number | null>(null);
  const viewMenuFrameRef = useRef<number | null>(null);
  const sortMenuFrameRef = useRef<number | null>(null);
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
  const isFullscreenActive = isTableFullscreen || isSimulatedFullscreen;

  const getClassicFitZoomPercent = useCallback(() => {
    const viewportWidth = Math.max(window.innerWidth - 48, 320);
    const viewportHeight = Math.max(window.innerHeight - 180, 280);

    const classicBaseWidth = 1804;
    const classicBaseHeight = 998;
    const fitScale = Math.min(viewportWidth / classicBaseWidth, viewportHeight / classicBaseHeight);
    const clampedScale = Math.max(0.25, Math.min(1.75, fitScale));
    const snappedPercent = Math.round((clampedScale * 100) / 5) * 5;

    return Math.max(25, Math.min(175, snappedPercent));
  }, []);

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

  const onToggleTableFullscreen = useCallback(async () => {
    if (isSimulatedFullscreen) {
      setIsSimulatedFullscreen(false);

      if (previousZoomRef.current !== null) {
        setClassicZoomPercent(previousZoomRef.current);
        previousZoomRef.current = null;
      }

      return;
    }

    if (typeof document === 'undefined') {
      return;
    }

    const containerElement = fullscreenContainerRef.current;
    if (containerElement === null) {
      return;
    }

    const hasNativeFullscreenSupport =
      document.fullscreenEnabled !== false &&
      typeof containerElement.requestFullscreen === 'function' &&
      typeof document.exitFullscreen === 'function';
    const isLikelyMobile =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    if (document.fullscreenElement === containerElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore exit failures and keep current state.
      }
      return;
    }

    if (!hasNativeFullscreenSupport || isLikelyMobile) {
      previousZoomRef.current = classicZoomPercent;
      setIsSimulatedFullscreen(true);

      if (activeViewMode === 'classic') {
        setClassicZoomPercent(getClassicFitZoomPercent());
      }

      return;
    }

    previousZoomRef.current = classicZoomPercent;
    try {
      await containerElement.requestFullscreen();
    } catch {
      setIsSimulatedFullscreen(true);

      if (activeViewMode === 'classic') {
        setClassicZoomPercent(getClassicFitZoomPercent());
      }
    }
  }, [
    activeViewMode,
    classicZoomPercent,
    getClassicFitZoomPercent,
    isSimulatedFullscreen,
  ]);

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

  const scheduleViewMenuPositionSync = useCallback(() => {
    if (viewMenuFrameRef.current !== null) {
      return;
    }

    viewMenuFrameRef.current = window.requestAnimationFrame(() => {
      viewMenuFrameRef.current = null;
      syncViewMenuPosition();
    });
  }, [syncViewMenuPosition]);

  const syncSortMenuPosition = useCallback(() => {
    if (sortToggleRef.current === null) {
      return;
    }

    setSortMenuPosition(getFloatingMenuPosition(sortToggleRef.current, 208));
  }, [getFloatingMenuPosition]);

  const scheduleSortMenuPositionSync = useCallback(() => {
    if (sortMenuFrameRef.current !== null) {
      return;
    }

    sortMenuFrameRef.current = window.requestAnimationFrame(() => {
      sortMenuFrameRef.current = null;
      syncSortMenuPosition();
    });
  }, [syncSortMenuPosition]);

  useEffect(() => {
    if (!isViewMenuOpen) {
      return;
    }

    scheduleViewMenuPositionSync();

    const onWindowChange = () => {
      scheduleViewMenuPositionSync();
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
      if (viewMenuFrameRef.current !== null) {
        window.cancelAnimationFrame(viewMenuFrameRef.current);
        viewMenuFrameRef.current = null;
      }
      window.removeEventListener('resize', onWindowChange);
      window.removeEventListener('scroll', onWindowChange, true);
      window.removeEventListener('keydown', onEscape);
    };
  }, [isViewMenuOpen, scheduleViewMenuPositionSync]);

  useEffect(() => {
    if (!isSortMenuOpen) {
      return;
    }

    scheduleSortMenuPositionSync();

    const onWindowChange = () => {
      scheduleSortMenuPositionSync();
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
      if (sortMenuFrameRef.current !== null) {
        window.cancelAnimationFrame(sortMenuFrameRef.current);
        sortMenuFrameRef.current = null;
      }
      window.removeEventListener('resize', onWindowChange);
      window.removeEventListener('scroll', onWindowChange, true);
      window.removeEventListener('keydown', onEscape);
    };
  }, [isSortMenuOpen, scheduleSortMenuPositionSync]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const onFullscreenChange = () => {
      const containerElement = fullscreenContainerRef.current;
      const isActive = document.fullscreenElement === containerElement;

      setIsTableFullscreen(isActive);
      if (isActive) {
        setIsSimulatedFullscreen(false);
      }

      if (isActive && activeViewMode === 'classic') {
        setClassicZoomPercent(getClassicFitZoomPercent());
      }

      if (!isActive && !isSimulatedFullscreen && previousZoomRef.current !== null) {
        setClassicZoomPercent(previousZoomRef.current);
        previousZoomRef.current = null;
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [activeViewMode, getClassicFitZoomPercent, isSimulatedFullscreen]);

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
