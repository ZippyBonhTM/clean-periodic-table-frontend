'use client';

export function resolveCanvasSelectionClearNotice(pointerType: string) {
  return pointerType === 'touch'
    ? 'Double-tap again to attach the active element, or wait to clear the selection.'
    : 'Double-click again to attach the active element, or wait to clear the selection.';
}

export function resolveCanvasPlacementNotice(pointerType: string) {
  return pointerType === 'touch'
    ? 'Double-tap the canvas to place the active element.'
    : 'Double-click the canvas to place the active element.';
}
