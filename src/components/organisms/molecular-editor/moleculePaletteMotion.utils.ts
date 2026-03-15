'use client';

export const DRAG_THRESHOLD_PX = 6;
export const PALETTE_MOMENTUM_DECAY = 0.9;
export const PALETTE_MOMENTUM_MIN_SPEED = 0.08;
export const PALETTE_MOMENTUM_IDLE_RELEASE_MS = 90;
export const PALETTE_TILE_LONG_PRESS_MS = 260;

export type PaletteInteractionState = {
  pointerId: number;
  startClientX: number;
  startedAt: number;
  lastClientX: number;
  lastTimestamp: number;
  velocity: number;
  moved: boolean;
  pressedIndex: number | null;
};

export function createEmptyPaletteInteraction(): PaletteInteractionState {
  return {
    pointerId: -1,
    startClientX: 0,
    startedAt: 0,
    lastClientX: 0,
    lastTimestamp: 0,
    velocity: 0,
    moved: false,
    pressedIndex: null,
  };
}

export function resolvePressedPaletteIndex(target: EventTarget | null) {
  const pressedIndexAttr =
    target instanceof Element ? target.closest<HTMLElement>('[data-palette-index]')?.dataset.paletteIndex : undefined;
  const pressedIndex = pressedIndexAttr === undefined ? null : Number.parseInt(pressedIndexAttr, 10);

  return Number.isNaN(pressedIndex ?? Number.NaN) ? null : pressedIndex;
}
