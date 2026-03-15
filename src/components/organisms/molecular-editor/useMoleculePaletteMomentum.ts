'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';

import {
  PALETTE_MOMENTUM_DECAY,
  PALETTE_MOMENTUM_MIN_SPEED,
} from '@/components/organisms/molecular-editor/moleculePaletteMotion.utils';

type UseMoleculePaletteMomentumOptions = {
  centerPaletteElement: (index: number, behavior?: ScrollBehavior) => void;
  centerPaletteIndexRef: MutableRefObject<number>;
  clampPaletteIndex: (index: number) => number;
  filteredElementCount: number;
  resolveNearestPaletteIndex: () => number;
  resolvePaletteGestureStep: () => number;
  settlePaletteSelection: (index: number, behavior?: ScrollBehavior) => void;
  settlePaletteToCurrentCenter: (behavior?: ScrollBehavior) => void;
  setIsPaletteMoving: (moving: boolean) => void;
  syncCenterPaletteIndex: (index: number) => void;
};

export default function useMoleculePaletteMomentum({
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
}: UseMoleculePaletteMomentumOptions) {
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

  const schedulePaletteSnap = useCallback(
    (delayMs = 120, behavior: ScrollBehavior = 'smooth') => {
      if (paletteSnapTimeoutRef.current !== null) {
        window.clearTimeout(paletteSnapTimeoutRef.current);
      }

      paletteSnapTimeoutRef.current = window.setTimeout(() => {
        const nextIndex = resolveNearestPaletteIndex();
        settlePaletteSelection(nextIndex, behavior);
      }, delayMs);
    },
    [resolveNearestPaletteIndex, settlePaletteSelection],
  );

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
      setIsPaletteMoving,
      settlePaletteToCurrentCenter,
      syncCenterPaletteIndex,
    ],
  );

  useEffect(() => {
    return () => {
      cancelPaletteMomentum();
    };
  }, [cancelPaletteMomentum]);

  return {
    cancelPaletteMomentum,
    schedulePaletteSnap,
    startPaletteMomentum,
  };
}
