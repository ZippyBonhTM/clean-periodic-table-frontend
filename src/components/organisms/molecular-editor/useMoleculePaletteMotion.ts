'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject, PointerEvent as ReactPointerEvent, RefObject } from 'react';

const DRAG_THRESHOLD_PX = 6;
const PALETTE_MOMENTUM_DECAY = 0.9;
const PALETTE_MOMENTUM_MIN_SPEED = 0.08;
const PALETTE_MOMENTUM_IDLE_RELEASE_MS = 90;
const PALETTE_TILE_LONG_PRESS_MS = 260;

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

  const paletteInteractionRef = useRef({
    pointerId: -1,
    startClientX: 0,
    startedAt: 0,
    lastClientX: 0,
    lastTimestamp: 0,
    velocity: 0,
    moved: false,
    pressedIndex: null as number | null,
  });
  const paletteMomentumFrameRef = useRef<number | null>(null);
  const paletteSnapTimeoutRef = useRef<number | null>(null);

  const cancelPaletteMomentum = useCallback(() => {
    if (paletteMomentumFrameRef.current !== null) {
      cancelAnimationFrame(paletteMomentumFrameRef.current);
      paletteMomentumFrameRef.current = null;
    }

    if (paletteSnapTimeoutRef.current !== null) {
      window.clearTimeout(paletteSnapTimeoutRef.current);
      paletteSnapTimeoutRef.current = null;
    }

  }, []);

  const resetPaletteInteraction = useCallback(() => {
    paletteInteractionRef.current = {
      pointerId: -1,
      startClientX: 0,
      startedAt: 0,
      lastClientX: 0,
      lastTimestamp: 0,
      velocity: 0,
      moved: false,
      pressedIndex: null,
    };
  }, []);

  const resetPaletteMotion = useCallback(() => {
    cancelPaletteMomentum();
    resetPaletteInteraction();
    setIsPaletteMoving(false);
    setIsPalettePointerActive(false);
  }, [cancelPaletteMomentum, resetPaletteInteraction]);

  const startPaletteMomentum = useCallback(
    (initialVelocity: number) => {
      if (filteredElementCount === 0) {
        setIsPaletteMoving(false);
        return;
      }

      let velocity = initialVelocity;
      let carry = 0;

      if (Math.abs(velocity) < PALETTE_MOMENTUM_MIN_SPEED) {
        settlePaletteToCurrentCenter('auto');
        return;
      }

      cancelPaletteMomentum();
      let lastTimestamp = performance.now();
      const gestureStep = resolvePaletteGestureStep();

      const step = (timestamp: number) => {
        const deltaTime = Math.min(32, Math.max(8, timestamp - lastTimestamp));
        lastTimestamp = timestamp;
        carry += velocity * (deltaTime / 16);
        velocity *= Math.pow(PALETTE_MOMENTUM_DECAY, deltaTime / 16);

        const stepCount = Math.floor(Math.abs(carry) / gestureStep);

        if (stepCount > 0) {
          const stepDirection = carry < 0 ? -1 : 1;
          const nextIndex = clampPaletteIndex(centerPaletteIndexRef.current + stepDirection * stepCount);

          if (nextIndex !== centerPaletteIndexRef.current) {
            syncCenterPaletteIndex(nextIndex);
            centerPaletteElement(nextIndex, 'auto');
          }

          carry -= Math.sign(carry) * stepCount * gestureStep;
        }

        if (Math.abs(velocity) < PALETTE_MOMENTUM_MIN_SPEED) {
          cancelPaletteMomentum();
          settlePaletteToCurrentCenter('auto');
          return;
        }

        paletteMomentumFrameRef.current = requestAnimationFrame(step);
      };

      paletteMomentumFrameRef.current = requestAnimationFrame(step);
    },
    [
      cancelPaletteMomentum,
      centerPaletteElement,
      centerPaletteIndexRef,
      clampPaletteIndex,
      filteredElementCount,
      resolvePaletteGestureStep,
      settlePaletteToCurrentCenter,
      syncCenterPaletteIndex,
    ],
  );

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

  const snapPaletteToNearest = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const nextIndex = resolveNearestPaletteIndex();
      settlePaletteSelection(nextIndex, behavior);
    },
    [resolveNearestPaletteIndex, settlePaletteSelection],
  );

  const onPaletteScroll = useCallback(() => {
    if (isPalettePointerActive || isPaletteMoving) {
      return;
    }

    const nextIndex = resolveNearestPaletteIndex();
    syncCenterPaletteIndex(nextIndex);

    if (paletteSnapTimeoutRef.current !== null) {
      window.clearTimeout(paletteSnapTimeoutRef.current);
    }

    paletteSnapTimeoutRef.current = window.setTimeout(() => {
      snapPaletteToNearest();
    }, 120);
  }, [isPaletteMoving, isPalettePointerActive, resolveNearestPaletteIndex, snapPaletteToNearest, syncCenterPaletteIndex]);

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
      const pressedIndexAttr =
        event.target instanceof Element ? event.target.closest<HTMLElement>('[data-palette-index]')?.dataset.paletteIndex : undefined;
      const pressedIndex = pressedIndexAttr === undefined ? null : Number.parseInt(pressedIndexAttr, 10);
      paletteInteractionRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startedAt: performance.now(),
        lastClientX: event.clientX,
        lastTimestamp: performance.now(),
        velocity: 0,
        moved: false,
        pressedIndex: Number.isNaN(pressedIndex ?? Number.NaN) ? null : pressedIndex,
      };
    },
    [cancelPaletteMomentum, paletteViewportRef],
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
    [centerPaletteElement, centerPaletteIndexRef, clampPaletteIndex, paletteViewportRef, resolvePaletteGestureStep, syncCenterPaletteIndex],
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
    [paletteViewportRef, resetPaletteInteraction, settlePaletteSelection, settlePaletteToCurrentCenter, startPaletteMomentum],
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
    [paletteViewportRef, resetPaletteInteraction, settlePaletteToCurrentCenter],
  );

  useEffect(() => {
    return () => {
      cancelPaletteMomentum();
    };
  }, [cancelPaletteMomentum]);

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
