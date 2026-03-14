'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import useMoleculePaletteEdgePadding from '@/components/organisms/molecular-editor/useMoleculePaletteEdgePadding';
import useMoleculePaletteMotion from '@/components/organisms/molecular-editor/useMoleculePaletteMotion';
import type { ChemicalElement } from '@/shared/types/element';

type UseMoleculePaletteViewportOptions = {
  filteredElements: ChemicalElement[];
};

export default function useMoleculePaletteViewport({ filteredElements }: UseMoleculePaletteViewportOptions) {
  const [centerPaletteIndex, setCenterPaletteIndex] = useState(0);
  const [expandedPaletteIndex, setExpandedPaletteIndex] = useState(0);

  const paletteViewportRef = useRef<HTMLDivElement | null>(null);
  const paletteItemRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const centerPaletteIndexRef = useRef(0);
  const paletteSettleTimeoutRef = useRef<number | null>(null);

  const resolvedExpandedPaletteIndex = useMemo(
    () => (filteredElements.length === 0 ? 0 : Math.min(expandedPaletteIndex, filteredElements.length - 1)),
    [expandedPaletteIndex, filteredElements.length],
  );
  const resolvedCenterPaletteIndex = useMemo(
    () => (filteredElements.length === 0 ? 0 : Math.min(centerPaletteIndex, filteredElements.length - 1)),
    [centerPaletteIndex, filteredElements.length],
  );

  const syncCenterPaletteIndex = useCallback((index: number) => {
    centerPaletteIndexRef.current = index;
    setCenterPaletteIndex((currentIndex) => (currentIndex === index ? currentIndex : index));
  }, []);

  const clampPaletteIndex = useCallback(
    (index: number) => {
      if (filteredElements.length === 0) {
        return 0;
      }

      return Math.max(0, Math.min(filteredElements.length - 1, index));
    },
    [filteredElements.length],
  );

  const resolvePaletteGestureStep = useCallback(() => {
    const currentButton =
      paletteItemRefs.current[centerPaletteIndexRef.current] ?? paletteItemRefs.current[resolvedExpandedPaletteIndex];
    const baseWidth = currentButton?.clientWidth ?? 40;

    return Math.max(18, Math.min(32, Math.round(baseWidth * 0.58)));
  }, [resolvedExpandedPaletteIndex]);

  const centerPaletteElement = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const viewport = paletteViewportRef.current;
    const elementButton = paletteItemRefs.current[index];

    if (viewport === null || elementButton === null) {
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const buttonRect = elementButton.getBoundingClientRect();
    const buttonCenter = viewport.scrollLeft + (buttonRect.left - viewportRect.left) + buttonRect.width / 2;
    const nextScrollLeft = Math.max(0, buttonCenter - viewport.clientWidth / 2);

    if (behavior === 'auto') {
      viewport.scrollLeft = nextScrollLeft;
      return;
    }

    viewport.scrollTo({
      left: nextScrollLeft,
      behavior,
    });
  }, []);

  const resolveNearestPaletteIndex = useCallback(() => {
    const viewport = paletteViewportRef.current;

    if (viewport === null || filteredElements.length === 0) {
      return 0;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < filteredElements.length; index += 1) {
      const elementButton = paletteItemRefs.current[index];

      if (elementButton === null || elementButton === undefined) {
        continue;
      }

      const buttonRect = elementButton.getBoundingClientRect();
      const buttonCenter = viewport.scrollLeft + (buttonRect.left - viewportRect.left) + buttonRect.width / 2;
      const distance = Math.abs(buttonCenter - center);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    return nearestIndex;
  }, [filteredElements.length]);

  const clearPaletteSettleTimeout = useCallback(() => {
    if (paletteSettleTimeoutRef.current !== null) {
      window.clearTimeout(paletteSettleTimeoutRef.current);
      paletteSettleTimeoutRef.current = null;
    }
  }, []);

  const settlePaletteSelection = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      clearPaletteSettleTimeout();
      syncCenterPaletteIndex(index);
      centerPaletteElement(index, behavior);

      const finalizeSelection = () => {
        paletteSettleTimeoutRef.current = null;
        setExpandedPaletteIndex(index);
      };

      if (behavior === 'auto') {
        finalizeSelection();
        return;
      }

      paletteSettleTimeoutRef.current = window.setTimeout(finalizeSelection, 140);
    },
    [centerPaletteElement, clearPaletteSettleTimeout, syncCenterPaletteIndex],
  );

  const settlePaletteToCurrentCenter = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const nextIndex = clampPaletteIndex(centerPaletteIndexRef.current);
      settlePaletteSelection(nextIndex, behavior);
    },
    [clampPaletteIndex, settlePaletteSelection],
  );

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
  }, [clearPaletteSettleTimeout, resetPaletteMotion, syncCenterPaletteIndex]);

  useEffect(() => {
    centerPaletteIndexRef.current = resolvedCenterPaletteIndex;
  }, [resolvedCenterPaletteIndex]);

  useEffect(() => {
    return () => {
      clearPaletteSettleTimeout();
    };
  }, [clearPaletteSettleTimeout]);

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

  const onPaletteItemRef = useCallback((index: number, node: HTMLButtonElement | null) => {
    paletteItemRefs.current[index] = node;
  }, []);

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
