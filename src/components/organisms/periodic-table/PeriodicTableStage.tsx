'use client';

import dynamic from 'next/dynamic';

import type { ChemicalElement } from '@/shared/types/element';

import type { PeriodicViewMode } from './periodicTable.types';
import usePeriodicTableText from './usePeriodicTableText';

type PeriodicTableStageProps = {
  activeViewMode: PeriodicViewMode;
  visibleElements: ChemicalElement[];
  classicZoomPercent: number;
  isFullscreenActive: boolean;
  fullscreenContainerRef: React.RefObject<HTMLDivElement | null>;
  onClassicZoomChange: (nextZoomPercent: number) => void;
  onToggleTableFullscreen: () => void | Promise<void>;
  onElementOpen: (element: ChemicalElement) => void;
  selectedElement: ChemicalElement | null;
  onCloseElementModal: () => void;
  hasPreviousElement: boolean;
  hasNextElement: boolean;
  onOpenPreviousElement: () => void;
  onOpenNextElement: () => void;
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

export default function PeriodicTableStage({
  activeViewMode,
  visibleElements,
  classicZoomPercent,
  isFullscreenActive,
  fullscreenContainerRef,
  onClassicZoomChange,
  onToggleTableFullscreen,
  onElementOpen,
  selectedElement,
  onCloseElementModal,
  hasPreviousElement,
  hasNextElement,
  onOpenPreviousElement,
  onOpenNextElement,
}: PeriodicTableStageProps) {
  const text = usePeriodicTableText();

  return (
    <div
      ref={fullscreenContainerRef}
      className={`relative ${isFullscreenActive ? 'h-[100dvh] overflow-auto bg-[var(--background-base)] p-3' : ''}`}
    >
      {isFullscreenActive && activeViewMode !== 'classic' ? (
        <div className="pointer-events-none absolute right-3 top-3 z-40">
          <button
            type="button"
            onClick={onToggleTableFullscreen}
            aria-label={text.fullscreen.exitTable}
            className="pointer-events-auto rounded-md border border-[var(--border-subtle)] bg-[var(--surface-1)]/95 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)] shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)]"
          >
            {text.fullscreen.exit}
          </button>
        </div>
      ) : null}

      <div>
        {activeViewMode === 'classic' ? (
          <ClassicPeriodicView
            elements={visibleElements}
            onElementOpen={onElementOpen}
            zoomPercent={classicZoomPercent}
            onZoomChange={onClassicZoomChange}
            isFullscreen={isFullscreenActive}
            onToggleFullscreen={onToggleTableFullscreen}
          />
        ) : activeViewMode === 'category' ? (
          <CategoryPeriodicView elements={visibleElements} onElementOpen={onElementOpen} />
        ) : (
          <CompactPeriodicView elements={visibleElements} onElementOpen={onElementOpen} />
        )}
      </div>

      <ElementDetailsModal
        element={selectedElement}
        isOpen={selectedElement !== null}
        onClose={onCloseElementModal}
        hasPreviousElement={hasPreviousElement}
        hasNextElement={hasNextElement}
        onOpenPreviousElement={onOpenPreviousElement}
        onOpenNextElement={onOpenNextElement}
      />
    </div>
  );
}
