'use client';

import type { MolecularEditorTextCatalog } from '@/components/organisms/molecular-editor/molecularEditorText';
import type { SavedMolecule } from '@/shared/types/molecule';

type ResolveSavedMoleculeEditorStatusOptions = {
  activeSavedMolecule: SavedMolecule | null;
  formula: string;
  moleculeName: string;
  resolvedActiveSavedMoleculeId: string | null;
  summaryAtomCount: number;
  text: Pick<MolecularEditorTextCatalog, 'common'>;
};

export function resolveSavedMoleculeEditorStatus({
  activeSavedMolecule,
  formula,
  moleculeName,
  resolvedActiveSavedMoleculeId,
  summaryAtomCount,
  text,
}: ResolveSavedMoleculeEditorStatusOptions) {
  const hasCurrentSavedSelection = resolvedActiveSavedMoleculeId !== null;
  const trimmedMoleculeName = moleculeName.trim();
  const currentSaveLabel =
    (trimmedMoleculeName.length > 0 ? trimmedMoleculeName : null) ??
    activeSavedMolecule?.name ??
    activeSavedMolecule?.summary.formula ??
    (summaryAtomCount === 0 ? text.common.unsavedMolecule : formula);

  return {
    currentSaveLabel,
    hasCurrentSavedSelection,
  };
}
