'use client';

import { useCallback, useRef } from 'react';

import {
  resolveCanvasPlacementNotice,
  resolveCanvasSelectionClearNotice,
} from '@/components/organisms/molecular-editor/moleculeCanvasPlacementMessages';
import useCanvasSelectionClearTimeout from '@/components/organisms/molecular-editor/useCanvasSelectionClearTimeout';

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
  const pendingCanvasPlacementRef = useRef<{
    timestamp: number;
    clientX: number;
    clientY: number;
    pointerType: string;
  } | null>(null);
  const {
    clearPendingCanvasSelectionClearTimeout,
    scheduleCanvasSelectionClear,
  } = useCanvasSelectionClearTimeout({
    onSelectionClearTimeout: () => {
      pendingCanvasPlacementRef.current = null;
    },
    selectedAtomId,
    setEditorNotice,
    setSelectedAtomId,
  });

  const clearPendingCanvasPlacement = useCallback(() => {
    pendingCanvasPlacementRef.current = null;
    clearPendingCanvasSelectionClearTimeout();
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
        scheduleCanvasSelectionClear(selectedAtomId);
        setEditorNotice(resolveCanvasSelectionClearNotice(pointerType));
        return;
      }

      setEditorNotice(resolveCanvasPlacementNotice(pointerType));
    },
    [
      clearPendingCanvasPlacement,
      clearPendingCanvasSelectionClearTimeout,
      onCanvasPlacement,
      scheduleCanvasSelectionClear,
      selectedAtomId,
      setEditorNotice,
    ],
  );

  return {
    clearPendingCanvasPlacement,
    clearPendingCanvasSelectionClearTimeout,
    pendingCanvasPlacementRef,
    queueCanvasPlacement,
  };
}
