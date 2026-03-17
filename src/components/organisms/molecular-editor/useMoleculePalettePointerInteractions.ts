'use client';

import { useCallback } from 'react';
import type { MutableRefObject, PointerEvent as ReactPointerEvent, RefObject } from 'react';

import {
  resolvePressedPaletteIndex,
  type PaletteInteractionState,
} from '@/components/organisms/molecular-editor/moleculePaletteMotion.utils';
import useMoleculePalettePointerMove from '@/components/organisms/molecular-editor/useMoleculePalettePointerMove';
import useMoleculePalettePointerRelease from '@/components/organisms/molecular-editor/useMoleculePalettePointerRelease';

type UseMoleculePalettePointerInteractionsOptions = {
  cancelPaletteMomentum: () => void;
  centerPaletteElement: (index: number, behavior?: ScrollBehavior) => void;
  centerPaletteIndexRef: MutableRefObject<number>;
  clampPaletteIndex: (index: number) => number;
  isPaletteMoving: boolean;
  isPalettePointerActive: boolean;
  paletteInteractionRef: MutableRefObject<PaletteInteractionState>;
  paletteViewportRef: RefObject<HTMLDivElement | null>;
  resolveNearestPaletteIndex: () => number;
  resolvePaletteGestureStep: () => number;
  schedulePaletteSnap: (delayMs?: number, behavior?: ScrollBehavior) => void;
  setIsPaletteMoving: (moving: boolean) => void;
  setIsPalettePointerActive: (active: boolean) => void;
  settlePaletteSelection: (index: number, behavior?: ScrollBehavior) => void;
  settlePaletteToCurrentCenter: (behavior?: ScrollBehavior) => void;
  startPaletteMomentum: (initialVelocity: number) => void;
  syncCenterPaletteIndex: (index: number) => void;
};

export default function useMoleculePalettePointerInteractions({
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
}: UseMoleculePalettePointerInteractionsOptions) {
  const onPaletteScroll = useCallback(() => {
    if (isPalettePointerActive || isPaletteMoving) {
      return;
    }

    const nextIndex = resolveNearestPaletteIndex();
    syncCenterPaletteIndex(nextIndex);
    schedulePaletteSnap();
  }, [
    isPaletteMoving,
    isPalettePointerActive,
    resolveNearestPaletteIndex,
    schedulePaletteSnap,
    syncCenterPaletteIndex,
  ]);

  const onPalettePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      const viewport = paletteViewportRef.current;

      if (viewport === null) {
        return;
      }

      event.preventDefault();
      cancelPaletteMomentum();
      setIsPaletteMoving(true);
      setIsPalettePointerActive(true);
      viewport.setPointerCapture(event.pointerId);
      paletteInteractionRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startedAt: performance.now(),
        lastClientX: event.clientX,
        lastTimestamp: performance.now(),
        velocity: 0,
        moved: false,
        pressedIndex: resolvePressedPaletteIndex(event.target),
      };
    },
    [cancelPaletteMomentum, paletteInteractionRef, paletteViewportRef, setIsPaletteMoving, setIsPalettePointerActive],
  );

  const { onPalettePointerMove } = useMoleculePalettePointerMove({
    centerPaletteElement,
    centerPaletteIndexRef,
    clampPaletteIndex,
    paletteInteractionRef,
    paletteViewportRef,
    resolvePaletteGestureStep,
    setIsPaletteMoving,
    syncCenterPaletteIndex,
  });

  const { onPalettePointerCancel, onPalettePointerUp } = useMoleculePalettePointerRelease({
    paletteInteractionRef,
    paletteViewportRef,
    setIsPaletteMoving,
    setIsPalettePointerActive,
    settlePaletteSelection,
    settlePaletteToCurrentCenter,
    startPaletteMomentum,
  });

  return {
    onPalettePointerCancel,
    onPalettePointerDown,
    onPalettePointerMove,
    onPalettePointerUp,
    onPaletteScroll,
  };
}
