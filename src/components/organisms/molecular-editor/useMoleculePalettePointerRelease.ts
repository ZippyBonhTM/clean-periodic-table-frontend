'use client';

import { useCallback } from 'react';
import type { MutableRefObject, PointerEvent as ReactPointerEvent, RefObject } from 'react';

import {
  createEmptyPaletteInteraction,
  PALETTE_MOMENTUM_IDLE_RELEASE_MS,
  PALETTE_MOMENTUM_MIN_SPEED,
  PALETTE_TILE_LONG_PRESS_MS,
  type PaletteInteractionState,
} from '@/components/organisms/molecular-editor/moleculePaletteMotion.utils';

type UseMoleculePalettePointerReleaseOptions = {
  paletteInteractionRef: MutableRefObject<PaletteInteractionState>;
  paletteViewportRef: RefObject<HTMLDivElement | null>;
  setIsPaletteMoving: (moving: boolean) => void;
  setIsPalettePointerActive: (active: boolean) => void;
  settlePaletteSelection: (index: number, behavior?: ScrollBehavior) => void;
  settlePaletteToCurrentCenter: (behavior?: ScrollBehavior) => void;
  startPaletteMomentum: (initialVelocity: number) => void;
};

export default function useMoleculePalettePointerRelease({
  paletteInteractionRef,
  paletteViewportRef,
  setIsPaletteMoving,
  setIsPalettePointerActive,
  settlePaletteSelection,
  settlePaletteToCurrentCenter,
  startPaletteMomentum,
}: UseMoleculePalettePointerReleaseOptions) {
  const resetPaletteInteraction = useCallback(() => {
    paletteInteractionRef.current = createEmptyPaletteInteraction();
  }, [paletteInteractionRef]);

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
    onPalettePointerUp,
  };
}
