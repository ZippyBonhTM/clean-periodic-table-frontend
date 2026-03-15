'use client';

import { useCallback } from 'react';

import {
  cloneMoleculeModel,
  normalizeSavedMoleculeRecord,
  type SavedEditorDraft,
} from '@/components/organisms/molecular-editor/moleculeEditorSession';
import type { SavedMolecule } from '@/shared/types/molecule';
import { syncMoleculeIdCounter } from '@/shared/utils/moleculeEditor';

type UseApplySavedMoleculeToEditorOptions = {
  applyEditorSnapshot: (snapshot: SavedEditorDraft, notice: string) => void;
  clearHistory: () => void;
  setActiveSavedMoleculeId: (moleculeId: string | null) => void;
  setMoleculeEducationalDescription: (value: string) => void;
  setMoleculeName: (value: string) => void;
  setNomenclatureFallback: (value: string | null) => void;
};

export default function useApplySavedMoleculeToEditor({
  applyEditorSnapshot,
  clearHistory,
  setActiveSavedMoleculeId,
  setMoleculeEducationalDescription,
  setMoleculeName,
  setNomenclatureFallback,
}: UseApplySavedMoleculeToEditorOptions) {
  return useCallback(
    (savedMolecule: SavedMolecule, notice: string) => {
      const normalizedSavedMolecule = normalizeSavedMoleculeRecord(savedMolecule);

      syncMoleculeIdCounter(normalizedSavedMolecule.molecule);
      applyEditorSnapshot(
        {
          molecule: cloneMoleculeModel(normalizedSavedMolecule.molecule),
          selectedAtomId: normalizedSavedMolecule.editorState.selectedAtomId,
          nomenclatureFallback: null,
          activeView: normalizedSavedMolecule.editorState.activeView,
          bondOrder: normalizedSavedMolecule.editorState.bondOrder,
          canvasViewport: {
            offsetX: normalizedSavedMolecule.editorState.canvasViewport.offsetX,
            offsetY: normalizedSavedMolecule.editorState.canvasViewport.offsetY,
            scale: normalizedSavedMolecule.editorState.canvasViewport.scale,
          },
        },
        notice,
      );
      clearHistory();
      setActiveSavedMoleculeId(normalizedSavedMolecule.id);
      setNomenclatureFallback(null);
      setMoleculeName(normalizedSavedMolecule.name ?? '');
      setMoleculeEducationalDescription(normalizedSavedMolecule.educationalDescription ?? '');
    },
    [
      applyEditorSnapshot,
      clearHistory,
      setActiveSavedMoleculeId,
      setMoleculeEducationalDescription,
      setMoleculeName,
      setNomenclatureFallback,
    ],
  );
}
