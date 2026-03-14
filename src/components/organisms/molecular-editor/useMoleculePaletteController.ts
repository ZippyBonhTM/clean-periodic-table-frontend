'use client';

import { useCallback } from 'react';

import type { ChemicalElement } from '@/shared/types/element';

import useMoleculePaletteSearch from '@/components/organisms/molecular-editor/useMoleculePaletteSearch';
import useMoleculePaletteViewport from '@/components/organisms/molecular-editor/useMoleculePaletteViewport';

type UseMoleculePaletteControllerOptions = {
  elements: ChemicalElement[];
};

export default function useMoleculePaletteController({ elements }: UseMoleculePaletteControllerOptions) {
  const {
    filteredElements,
    hasActivePaletteFilter,
    isPaletteSearchOpen,
    onClearPaletteSearch: clearPaletteQuery,
    onClosePaletteSearch,
    onPaletteSearchChange: setPaletteQuery,
    onTogglePaletteSearch,
    paletteQuery,
    paletteSearchRailRef,
    searchInputRef,
  } = useMoleculePaletteSearch({ elements });

  const {
    goToNextPaletteElement,
    goToPreviousPaletteElement,
    isPaletteMoving,
    isPalettePointerActive,
    onPaletteItemRef,
    onPalettePointerCancel,
    onPalettePointerDown,
    onPalettePointerMove,
    onPalettePointerUp,
    onPaletteScroll,
    paletteEdgePadding,
    paletteViewportRef,
    resetPaletteSearchViewport,
    resolvedCenterPaletteIndex,
    resolvedExpandedPaletteIndex,
  } = useMoleculePaletteViewport({ filteredElements });

  const activeElement = filteredElements[resolvedExpandedPaletteIndex] ?? null;

  const onPaletteSearchChange = useCallback(
    (nextQuery: string) => {
      setPaletteQuery(nextQuery);
      resetPaletteSearchViewport();
    },
    [resetPaletteSearchViewport, setPaletteQuery],
  );

  const onClearPaletteSearch = useCallback(() => {
    clearPaletteQuery();
    resetPaletteSearchViewport();
  }, [clearPaletteQuery, resetPaletteSearchViewport]);

  return {
    activeElement,
    filteredElements,
    goToNextPaletteElement,
    goToPreviousPaletteElement,
    hasActivePaletteFilter,
    isPaletteMoving,
    isPalettePointerActive,
    isPaletteSearchOpen,
    onClearPaletteSearch,
    onClosePaletteSearch,
    onPaletteItemRef,
    onPalettePointerCancel,
    onPalettePointerDown,
    onPalettePointerMove,
    onPalettePointerUp,
    onPaletteScroll,
    onPaletteSearchChange,
    onTogglePaletteSearch,
    paletteEdgePadding,
    paletteQuery,
    paletteSearchRailRef,
    paletteViewportRef,
    resolvedCenterPaletteIndex,
    resolvedExpandedPaletteIndex,
    searchInputRef,
  };
}
