'use client';

import type { SavedMolecule } from '@/shared/types/molecule';

type ResolveSavedMoleculeEditorStatusOptions = {
  activeSavedMolecule: SavedMolecule | null;
  formula: string;
  moleculeName: string;
  resolvedActiveSavedMoleculeId: string | null;
  summaryAtomCount: number;
};

export function resolveSavedMoleculeEditorStatus({
  activeSavedMolecule,
  formula,
  moleculeName,
  resolvedActiveSavedMoleculeId,
  summaryAtomCount,
}: ResolveSavedMoleculeEditorStatusOptions) {
  const hasCurrentSavedSelection = resolvedActiveSavedMoleculeId !== null;
  const trimmedMoleculeName = moleculeName.trim();
  const currentSaveLabel =
    (trimmedMoleculeName.length > 0 ? trimmedMoleculeName : null) ??
    activeSavedMolecule?.name ??
    activeSavedMolecule?.summary.formula ??
    (summaryAtomCount === 0 ? 'Unsaved molecule' : formula);

  return {
    currentSaveLabel,
    hasCurrentSavedSelection,
  };
}
