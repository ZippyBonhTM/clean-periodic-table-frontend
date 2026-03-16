'use client';

import { useCallback, useEffect, useRef } from 'react';

const CANVAS_DOUBLE_PRESS_DELAY_MS = 320;

type UseCanvasSelectionClearTimeoutOptions = {
  onSelectionClearTimeout: () => void;
  selectedAtomId: string | null;
  setEditorNotice: (notice: string) => void;
  setSelectedAtomId: (atomId: string | null) => void;
};

export default function useCanvasSelectionClearTimeout({
  onSelectionClearTimeout,
  selectedAtomId,
  setEditorNotice,
  setSelectedAtomId,
}: UseCanvasSelectionClearTimeoutOptions) {
  const selectedAtomIdRef = useRef<string | null>(null);
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

  useEffect(() => {
    return () => {
      clearPendingCanvasSelectionClearTimeout();
    };
  }, [clearPendingCanvasSelectionClearTimeout]);

  const scheduleCanvasSelectionClear = useCallback(
    (atomIdToClear: string) => {
      pendingCanvasSelectionClearTimeoutRef.current = window.setTimeout(() => {
        pendingCanvasSelectionClearTimeoutRef.current = null;
        onSelectionClearTimeout();

        if (selectedAtomIdRef.current !== atomIdToClear) {
          return;
        }

        setSelectedAtomId(null);
        setEditorNotice('Selection cleared.');
      }, CANVAS_DOUBLE_PRESS_DELAY_MS);
    },
    [onSelectionClearTimeout, setEditorNotice, setSelectedAtomId],
  );

  return {
    clearPendingCanvasSelectionClearTimeout,
    scheduleCanvasSelectionClear,
  };
}
