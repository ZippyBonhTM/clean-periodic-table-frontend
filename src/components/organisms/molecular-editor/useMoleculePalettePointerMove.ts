'use client';

import { useCallback } from 'react';
import type { MutableRefObject, PointerEvent as ReactPointerEvent, RefObject } from 'react';

import {
  DRAG_THRESHOLD_PX,
  type PaletteInteractionState,
} from '@/components/organisms/molecular-editor/moleculePaletteMotion.utils';

type UseMoleculePalettePointerMoveOptions = {
  centerPaletteElement: (index: number, behavior?: ScrollBehavior) => void;
  centerPaletteIndexRef: MutableRefObject<number>;
  clampPaletteIndex: (index: number) => number;
  paletteInteractionRef: MutableRefObject<PaletteInteractionState>;
  paletteViewportRef: RefObject<HTMLDivElement | null>;
  resolvePaletteGestureStep: () => number;
  setIsPaletteMoving: (moving: boolean) => void;
  syncCenterPaletteIndex: (index: number) => void;
};

export default function useMoleculePalettePointerMove({
  centerPaletteElement,
  centerPaletteIndexRef,
  clampPaletteIndex,
  paletteInteractionRef,
  paletteViewportRef,
  resolvePaletteGestureStep,
  setIsPaletteMoving,
  syncCenterPaletteIndex,
}: UseMoleculePalettePointerMoveOptions) {
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

  return {
    onPalettePointerMove,
  };
}
