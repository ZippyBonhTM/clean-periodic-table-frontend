'use client';

import { useMemo } from 'react';

import type { SavedMolecule } from '@/shared/types/molecule';

type UseResolvedSavedMoleculeSelectionOptions = {
  activeSavedMoleculeId: string | null;
  normalizedSavedMolecules: SavedMolecule[];
};

export default function useResolvedSavedMoleculeSelection({
  activeSavedMoleculeId,
  normalizedSavedMolecules,
}: UseResolvedSavedMoleculeSelectionOptions) {
  const resolvedActiveSavedMoleculeId = useMemo(() => {
    if (activeSavedMoleculeId === null) {
      return null;
    }

    return normalizedSavedMolecules.some((entry) => entry.id === activeSavedMoleculeId)
      ? activeSavedMoleculeId
      : null;
  }, [activeSavedMoleculeId, normalizedSavedMolecules]);

  const activeSavedMolecule = useMemo(
    () => normalizedSavedMolecules.find((entry) => entry.id === resolvedActiveSavedMoleculeId) ?? null,
    [normalizedSavedMolecules, resolvedActiveSavedMoleculeId],
  );

  return {
    activeSavedMolecule,
    resolvedActiveSavedMoleculeId,
  };
}
