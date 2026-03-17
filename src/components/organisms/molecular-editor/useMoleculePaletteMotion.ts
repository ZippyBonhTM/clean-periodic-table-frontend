'use client';

import { useCallback, useRef, useState } from 'react';
import type { MutableRefObject, RefObject } from 'react';

import {
  createEmptyPaletteInteraction,
  type PaletteInteractionState,
} from '@/components/organisms/molecular-editor/moleculePaletteMotion.utils';
import useMoleculePaletteMomentum from '@/components/organisms/molecular-editor/useMoleculePaletteMomentum';
import useMoleculePalettePointerInteractions from '@/components/organisms/molecular-editor/useMoleculePalettePointerInteractions';

type UseMoleculePaletteMotionOptions = {
  centerPaletteElement: (index: number, behavior?: ScrollBehavior) => void;
  centerPaletteIndexRef: MutableRefObject<number>;
  clampPaletteIndex: (index: number) => number;
  filteredElementCount: number;
  paletteViewportRef: RefObject<HTMLDivElement | null>;
  resolveNearestPaletteIndex: () => number;
  resolvePaletteGestureStep: () => number;
  settlePaletteSelection: (index: number, behavior?: ScrollBehavior) => void;
  settlePaletteToCurrentCenter: (behavior?: ScrollBehavior) => void;
  syncCenterPaletteIndex: (index: number) => void;
};

export default function useMoleculePaletteMotion({
  centerPaletteElement,
  centerPaletteIndexRef,
  clampPaletteIndex,
  filteredElementCount,
  paletteViewportRef,
  resolveNearestPaletteIndex,
  resolvePaletteGestureStep,
  settlePaletteSelection,
  settlePaletteToCurrentCenter,
  syncCenterPaletteIndex,
}: UseMoleculePaletteMotionOptions) {
  const [isPaletteMoving, setIsPaletteMoving] = useState(false);
  const [isPalettePointerActive, setIsPalettePointerActive] = useState(false);

  const paletteInteractionRef = useRef<PaletteInteractionState>(createEmptyPaletteInteraction());

  const { cancelPaletteMomentum, schedulePaletteSnap, startPaletteMomentum } = useMoleculePaletteMomentum({
    centerPaletteElement,
    centerPaletteIndexRef,
    clampPaletteIndex,
    filteredElementCount,
    resolveNearestPaletteIndex,
    resolvePaletteGestureStep,
    settlePaletteSelection,
    settlePaletteToCurrentCenter,
    setIsPaletteMoving,
    syncCenterPaletteIndex,
  });

  const resetPaletteInteraction = useCallback(() => {
    paletteInteractionRef.current = createEmptyPaletteInteraction();
  }, []);

  const resetPaletteMotion = useCallback(() => {
    cancelPaletteMomentum();
    resetPaletteInteraction();
    setIsPaletteMoving(false);
    setIsPalettePointerActive(false);
  }, [cancelPaletteMomentum, resetPaletteInteraction]);

  const goToPreviousPaletteElement = useCallback(() => {
    if (filteredElementCount === 0) {
      return;
    }

    const currentIndex = clampPaletteIndex(centerPaletteIndexRef.current);
    const nextIndex = currentIndex === 0 ? filteredElementCount - 1 : currentIndex - 1;

    setIsPaletteMoving(true);
    settlePaletteSelection(nextIndex);
  }, [centerPaletteIndexRef, clampPaletteIndex, filteredElementCount, settlePaletteSelection]);

  const goToNextPaletteElement = useCallback(() => {
    if (filteredElementCount === 0) {
      return;
    }

    const currentIndex = clampPaletteIndex(centerPaletteIndexRef.current);
    const nextIndex = currentIndex === filteredElementCount - 1 ? 0 : currentIndex + 1;

    setIsPaletteMoving(true);
    settlePaletteSelection(nextIndex);
  }, [centerPaletteIndexRef, clampPaletteIndex, filteredElementCount, settlePaletteSelection]);

  const {
    onPalettePointerCancel,
    onPalettePointerDown,
    onPalettePointerMove,
    onPalettePointerUp,
    onPaletteScroll,
  } = useMoleculePalettePointerInteractions({
    cancelPaletteMomentum,
    centerPaletteElement,
    centerPaletteIndexRef,
    clampPaletteIndex,
    isPaletteMoving,
    isPalettePointerActive,
    paletteInteractionRef,
    paletteViewportRef,
    resolveNearestPaletteIndex,
    resolvePaletteGestureStep,
    schedulePaletteSnap,
    setIsPaletteMoving,
    setIsPalettePointerActive,
    settlePaletteSelection,
    settlePaletteToCurrentCenter,
    startPaletteMomentum,
    syncCenterPaletteIndex,
  });

  return {
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
  };
}
