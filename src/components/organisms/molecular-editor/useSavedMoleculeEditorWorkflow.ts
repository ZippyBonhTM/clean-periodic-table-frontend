'use client';

import { useCallback } from 'react';

import {
  cloneMoleculeModel,
  normalizeSavedMoleculeRecord,
  type SavedEditorDraft,
} from '@/components/organisms/molecular-editor/moleculeEditorSession';
import useSavedMoleculeWorkflow from '@/components/organisms/molecular-editor/useSavedMoleculeWorkflow';
import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';
import { syncMoleculeIdCounter } from '@/shared/utils/moleculeEditor';

type ShowGalleryFeedback = (
  tone: 'info' | 'success' | 'error',
  message: string,
  options?: {
    persist?: boolean;
  },
) => void;

type UseSavedMoleculeEditorWorkflowOptions = {
  activeSavedMoleculeId: string | null;
  applyEditorSnapshot: (snapshot: SavedEditorDraft, notice: string) => void;
  buildSaveMoleculeInput: () => SaveMoleculeInput;
  clearHistory: () => void;
  closeImportModal: () => void;
  collapseFloatingSaveShortcut: () => void;
  formula: string;
  isSavedMoleculesLoading: boolean;
  moleculeName: string;
  normalizedSavedMolecules: SavedMolecule[];
  onCreateSavedMolecule: (input: SaveMoleculeInput) => Promise<SavedMolecule>;
  onDeleteSavedMolecule: (moleculeId: string) => Promise<void>;
  onUpdateSavedMolecule: (moleculeId: string, input: SaveMoleculeInput) => Promise<SavedMolecule>;
  pageMode: 'editor' | 'gallery';
  setActiveSavedMoleculeId: (moleculeId: string | null) => void;
  setMoleculeEducationalDescription: (value: string) => void;
  setMoleculeName: (value: string) => void;
  setNomenclatureFallback: (value: string | null) => void;
  showGalleryFeedback: ShowGalleryFeedback;
  summaryAtomCount: number;
};

export default function useSavedMoleculeEditorWorkflow({
  activeSavedMoleculeId,
  applyEditorSnapshot,
  buildSaveMoleculeInput,
  clearHistory,
  closeImportModal,
  collapseFloatingSaveShortcut,
  formula,
  isSavedMoleculesLoading,
  moleculeName,
  normalizedSavedMolecules,
  onCreateSavedMolecule,
  onDeleteSavedMolecule,
  onUpdateSavedMolecule,
  pageMode,
  setActiveSavedMoleculeId,
  setMoleculeEducationalDescription,
  setMoleculeName,
  setNomenclatureFallback,
  showGalleryFeedback,
  summaryAtomCount,
}: UseSavedMoleculeEditorWorkflowOptions) {
  const applySavedMolecule = useCallback(
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

  const workflow = useSavedMoleculeWorkflow({
    activeSavedMoleculeId,
    applySavedMolecule,
    buildSaveMoleculeInput,
    closeImportModal,
    collapseFloatingSaveShortcut,
    isSavedMoleculesLoading,
    normalizedSavedMolecules,
    onCreateSavedMolecule,
    onDeleteSavedMolecule,
    onUpdateSavedMolecule,
    pageMode,
    setActiveSavedMoleculeId,
    setMoleculeEducationalDescription,
    setMoleculeName,
    showGalleryFeedback,
    summaryAtomCount,
  });

  const hasCurrentSavedSelection = workflow.resolvedActiveSavedMoleculeId !== null;
  const currentSaveLabel =
    (moleculeName.trim().length > 0 ? moleculeName.trim() : null) ??
    workflow.activeSavedMolecule?.name ??
    workflow.activeSavedMolecule?.summary.formula ??
    (summaryAtomCount === 0 ? 'Unsaved molecule' : formula);

  return {
    ...workflow,
    currentSaveLabel,
    hasCurrentSavedSelection,
  };
}
