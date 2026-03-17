'use client';

import { useCallback } from 'react';
import type { MutableRefObject, PointerEvent as ReactPointerEvent, RefObject } from 'react';

import {
  createEmptyPaletteInteraction,
  DRAG_THRESHOLD_PX,
  PALETTE_MOMENTUM_IDLE_RELEASE_MS,
  PALETTE_MOMENTUM_MIN_SPEED,
  PALETTE_TILE_LONG_PRESS_MS,
  resolvePressedPaletteIndex,
  type PaletteInteractionState,
} from '@/components/organisms/molecular-editor/moleculePaletteMotion.utils';

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
  const resetPaletteInteraction = useCallback(() => {
    paletteInteractionRef.current = createEmptyPaletteInteraction();
  }, [paletteInteractionRef]);

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

  const onPalettePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = paletteViewportRef.current;
      const interaction = paletteInteractionRef.current;

      if (viewport === null || interaction.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - interaction.startClientX;
      const distance = Math.abs(deltaX);

      if (distance < DRAG_THRESHOLD_PX && !interaction.moved) {
        return;
      }

      event.preventDefault();
      setIsPaletteMoving(true);
      const now = performance.now();
      const deltaTime = Math.max(8, now - interaction.lastTimestamp);
      const instantaneousVelocity = -(event.clientX - interaction.lastClientX) / Math.max(0.5, deltaTime / 16);
      const gestureStep = resolvePaletteGestureStep();
      const stepCount = Math.floor(Math.abs(deltaX) / gestureStep);

      if (stepCount === 0) {
        paletteInteractionRef.current = {
          ...interaction,
          lastClientX: event.clientX,
          lastTimestamp: now,
          velocity: interaction.velocity * 0.7 + instantaneousVelocity * 0.3,
        };
        return;
      }

      const stepDirection = deltaX > 0 ? -1 : 1;
      const previousIndex = centerPaletteIndexRef.current;
      const nextIndex = clampPaletteIndex(previousIndex + stepDirection * stepCount);
      const didAdvance = nextIndex !== previousIndex;

      if (didAdvance) {
        syncCenterPaletteIndex(nextIndex);
        centerPaletteElement(nextIndex, 'auto');
      }

      paletteInteractionRef.current = {
        ...interaction,
        startClientX: interaction.startClientX + Math.sign(deltaX) * gestureStep * stepCount,
        lastClientX: event.clientX,
        lastTimestamp: now,
        velocity: interaction.velocity * 0.64 + instantaneousVelocity * 0.36,
        moved: didAdvance || interaction.moved,
      };
    },
    [
      centerPaletteElement,
      centerPaletteIndexRef,
      clampPaletteIndex,
      paletteInteractionRef,
      paletteViewportRef,
      resolvePaletteGestureStep,
      setIsPaletteMoving,
      syncCenterPaletteIndex,
    ],
  );

  const onPalettePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = paletteViewportRef.current;
      const interaction = paletteInteractionRef.current;

      if (viewport === null || interaction.pointerId !== event.pointerId) {
        return;
      }

      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }

      setIsPalettePointerActive(false);
      const releaseTimestamp = performance.now();
      const timeSinceLastMove = releaseTimestamp - interaction.lastTimestamp;
      const shouldCarryMomentum = timeSinceLastMove <= PALETTE_MOMENTUM_IDLE_RELEASE_MS;
      const pressedTileIndex = interaction.pressedIndex;
      const wasShortTilePress =
        pressedTileIndex !== null && releaseTimestamp - interaction.startedAt < PALETTE_TILE_LONG_PRESS_MS;
      resetPaletteInteraction();

      if (interaction.moved) {
        const releaseVelocity = shouldCarryMomentum ? interaction.velocity : 0;

        if (Math.abs(releaseVelocity) < PALETTE_MOMENTUM_MIN_SPEED) {
          settlePaletteToCurrentCenter('auto');
        } else {
          startPaletteMomentum(releaseVelocity);
        }

        return;
      }

      setIsPaletteMoving(false);

      if (pressedTileIndex !== null && wasShortTilePress) {
        settlePaletteSelection(pressedTileIndex, 'smooth');
        return;
      }

      settlePaletteToCurrentCenter('auto');
    },
    [
      paletteInteractionRef,
      paletteViewportRef,
      resetPaletteInteraction,
      setIsPaletteMoving,
      setIsPalettePointerActive,
      settlePaletteSelection,
      settlePaletteToCurrentCenter,
      startPaletteMomentum,
    ],
  );

  const onPalettePointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = paletteViewportRef.current;

      if (viewport !== null && viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }

      setIsPalettePointerActive(false);
      resetPaletteInteraction();
      setIsPaletteMoving(false);
      settlePaletteToCurrentCenter('auto');
    },
    [
      paletteViewportRef,
      resetPaletteInteraction,
      setIsPaletteMoving,
      setIsPalettePointerActive,
      settlePaletteToCurrentCenter,
    ],
  );

  return {
    onPalettePointerCancel,
    onPalettePointerDown,
    onPalettePointerMove,
    onPalettePointerUp,
    onPaletteScroll,
  };
}
