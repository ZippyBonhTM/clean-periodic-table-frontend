'use client';

import { useCallback, useState } from 'react';

type UseEditorHistoryOptions<Snapshot> = {
  limit: number;
  cloneSnapshot: (snapshot: Snapshot) => Snapshot;
  buildCurrentSnapshot: () => Snapshot;
  applySnapshot: (snapshot: Snapshot, notice: string) => void;
};

function useEditorHistory<Snapshot>({
  limit,
  cloneSnapshot,
  buildCurrentSnapshot,
  applySnapshot,
}: UseEditorHistoryOptions<Snapshot>) {
  const [historyPast, setHistoryPast] = useState<Snapshot[]>([]);
  const [historyFuture, setHistoryFuture] = useState<Snapshot[]>([]);

  const pushHistorySnapshot = useCallback(
    (snapshot: Snapshot) => {
      const nextSnapshot = cloneSnapshot(snapshot);
      setHistoryPast((currentPast) => [...currentPast.slice(-(limit - 1)), nextSnapshot]);
      setHistoryFuture([]);
    },
    [cloneSnapshot, limit],
  );

  const clearHistory = useCallback(() => {
    setHistoryPast([]);
    setHistoryFuture([]);
  }, []);

  const onUndo = useCallback(() => {
    if (historyPast.length === 0) {
      return;
    }

    const previousSnapshot = historyPast[historyPast.length - 1];
    const currentSnapshot = cloneSnapshot(buildCurrentSnapshot());

    setHistoryPast((currentPast) => currentPast.slice(0, -1));
    setHistoryFuture((currentFuture) => [...currentFuture.slice(-(limit - 1)), currentSnapshot]);
    applySnapshot(previousSnapshot, 'Undo applied.');
  }, [applySnapshot, buildCurrentSnapshot, cloneSnapshot, historyPast, limit]);

  const onRedo = useCallback(() => {
    if (historyFuture.length === 0) {
      return;
    }

    const nextSnapshot = historyFuture[historyFuture.length - 1];
    const currentSnapshot = cloneSnapshot(buildCurrentSnapshot());

    setHistoryFuture((currentFuture) => currentFuture.slice(0, -1));
    setHistoryPast((currentPast) => [...currentPast.slice(-(limit - 1)), currentSnapshot]);
    applySnapshot(nextSnapshot, 'Redo applied.');
  }, [applySnapshot, buildCurrentSnapshot, cloneSnapshot, historyFuture, limit]);

  return {
    canUndo: historyPast.length > 0,
    canRedo: historyFuture.length > 0,
    clearHistory,
    historyPast,
    historyFuture,
    onRedo,
    onUndo,
    pushHistorySnapshot,
  };
}

export default useEditorHistory;
