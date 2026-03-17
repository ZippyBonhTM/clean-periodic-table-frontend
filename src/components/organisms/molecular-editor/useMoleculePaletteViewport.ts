'use client';

import { useCallback, useEffect } from 'react';

import useMoleculePaletteEdgePadding from '@/components/organisms/molecular-editor/useMoleculePaletteEdgePadding';
import useMoleculePaletteMotion from '@/components/organisms/molecular-editor/useMoleculePaletteMotion';
import useMoleculePaletteViewportState from '@/components/organisms/molecular-editor/useMoleculePaletteViewportState';
import type { ChemicalElement } from '@/shared/types/element';

type UseMoleculePaletteViewportOptions = {
  filteredElements: ChemicalElement[];
};

export default function useMoleculePaletteViewport({ filteredElements }: UseMoleculePaletteViewportOptions) {
  const {
    centerPaletteElement,
    centerPaletteIndexRef,
    clampPaletteIndex,
    clearPaletteSettleTimeout,
    onPaletteItemRef,
    paletteItemRefs,
    paletteViewportRef,
    resolveNearestPaletteIndex,
    resolvePaletteGestureStep,
    resolvedCenterPaletteIndex,
    resolvedExpandedPaletteIndex,
    setExpandedPaletteIndex,
    settlePaletteSelection,
    settlePaletteToCurrentCenter,
    syncCenterPaletteIndex,
  } = useMoleculePaletteViewportState({ filteredElements });

  const {
    goToNextPaletteElement,
    goToPreviousPaletteElement,
    isPaletteMoving,
    isPalettePointerActive,
    onPalettePointerCancel,
    onPalettePointerDown,
    onPalettePointerMove,
    onPalettePointerUp,
    onPaletteScroll,
    resetPaletteMotion,
  } = useMoleculePaletteMotion({
    centerPaletteElement,
    centerPaletteIndexRef,
    clampPaletteIndex,
    filteredElementCount: filteredElements.length,
    paletteViewportRef,
    resolveNearestPaletteIndex,
    resolvePaletteGestureStep,
    settlePaletteSelection,
    settlePaletteToCurrentCenter,
    syncCenterPaletteIndex,
  });

  const paletteEdgePadding = useMoleculePaletteEdgePadding({
    filteredElementCount: filteredElements.length,
    paletteItemRefs,
    paletteViewportRef,
    resolvedExpandedPaletteIndex,
  });

  const resetPaletteSearchViewport = useCallback(() => {
    clearPaletteSettleTimeout();
    setExpandedPaletteIndex(0);
    syncCenterPaletteIndex(0);
    resetPaletteMotion();
  }, [clearPaletteSettleTimeout, resetPaletteMotion, setExpandedPaletteIndex, syncCenterPaletteIndex]);

  useEffect(() => {
    if (isPaletteMoving) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      syncCenterPaletteIndex(resolvedExpandedPaletteIndex);
      centerPaletteElement(resolvedExpandedPaletteIndex, 'auto');
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [centerPaletteElement, filteredElements, isPaletteMoving, paletteEdgePadding, resolvedExpandedPaletteIndex, syncCenterPaletteIndex]);

  useEffect(() => {
    if (!isPaletteMoving && !isPalettePointerActive) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      centerPaletteElement(resolvedCenterPaletteIndex, 'auto');
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [centerPaletteElement, isPaletteMoving, isPalettePointerActive, resolvedCenterPaletteIndex]);

  return {
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
  };
}
