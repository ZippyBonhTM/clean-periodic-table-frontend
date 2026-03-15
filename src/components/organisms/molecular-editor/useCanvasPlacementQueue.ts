'use client';

import { useCallback, useEffect, useRef } from 'react';

const CANVAS_DOUBLE_PRESS_DELAY_MS = 320;
const CANVAS_DOUBLE_PRESS_DISTANCE_PX = 18;

type UseCanvasPlacementQueueOptions = {
  onCanvasPlacement: (point: { x: number; y: number }) => void;
  selectedAtomId: string | null;
  setEditorNotice: (notice: string) => void;
  setSelectedAtomId: (atomId: string | null) => void;
};

export default function useCanvasPlacementQueue({
  onCanvasPlacement,
  selectedAtomId,
  setEditorNotice,
  setSelectedAtomId,
}: UseCanvasPlacementQueueOptions) {
  const selectedAtomIdRef = useRef<string | null>(null);
  const pendingCanvasPlacementRef = useRef<{
    timestamp: number;
    clientX: number;
    clientY: number;
    pointerType: string;
  } | null>(null);
  const pendingCanvasSelectionClearTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    selectedAtomIdRef.current = selectedAtomId;
  }, [selectedAtomId]);

  const clearPendingCanvasSelectionClearTimeout = useCallback(() => {
    if (pendingCanvasSelectionClearTimeoutRef.current !== null) {
      window.clearTimeout(pendingCanvasSelectionClearTimeoutRef.current);
      pendingCanvasSelectionClearTimeoutRef.current = null;
    }
  }, []);

  const clearPendingCanvasPlacement = useCallback(() => {
    pendingCanvasPlacementRef.current = null;
    clearPendingCanvasSelectionClearTimeout();
  }, [clearPendingCanvasSelectionClearTimeout]);

  useEffect(() => {
    return () => {
      clearPendingCanvasSelectionClearTimeout();
    };
  }, [clearPendingCanvasSelectionClearTimeout]);

  const queueCanvasPlacement = useCallback(
    (point: { x: number; y: number }, pointerType: string, clientX: number, clientY: number) => {
      const now = performance.now();
      const pendingPlacement = pendingCanvasPlacementRef.current;
      const isRepeatedPlacement =
        pendingPlacement !== null &&
        pendingPlacement.pointerType === pointerType &&
        now - pendingPlacement.timestamp <= CANVAS_DOUBLE_PRESS_DELAY_MS &&
        Math.hypot(clientX - pendingPlacement.clientX, clientY - pendingPlacement.clientY) <=
          CANVAS_DOUBLE_PRESS_DISTANCE_PX;

      if (isRepeatedPlacement) {
        clearPendingCanvasPlacement();
        onCanvasPlacement(point);
        return;
      }

      clearPendingCanvasSelectionClearTimeout();
      pendingCanvasPlacementRef.current = {
        timestamp: now,
        clientX,
        clientY,
        pointerType,
      };

      if (selectedAtomId !== null) {
        const atomIdToClear = selectedAtomId;

        pendingCanvasSelectionClearTimeoutRef.current = window.setTimeout(() => {
          pendingCanvasSelectionClearTimeoutRef.current = null;
          pendingCanvasPlacementRef.current = null;

          if (selectedAtomIdRef.current !== atomIdToClear) {
            return;
          }

          setSelectedAtomId(null);
          setEditorNotice('Selection cleared.');
        }, CANVAS_DOUBLE_PRESS_DELAY_MS);

        setEditorNotice(
          pointerType === 'touch'
            ? 'Double-tap again to attach the active element, or wait to clear the selection.'
            : 'Double-click again to attach the active element, or wait to clear the selection.',
        );
        return;
      }

      setEditorNotice(
        pointerType === 'touch'
          ? 'Double-tap the canvas to place the active element.'
          : 'Double-click the canvas to place the active element.',
      );
    },
    [
      clearPendingCanvasPlacement,
      clearPendingCanvasSelectionClearTimeout,
      onCanvasPlacement,
      selectedAtomId,
      setEditorNotice,
      setSelectedAtomId,
    ],
  );

  return {
    clearPendingCanvasPlacement,
    clearPendingCanvasSelectionClearTimeout,
    pendingCanvasPlacementRef,
    queueCanvasPlacement,
  };
}
