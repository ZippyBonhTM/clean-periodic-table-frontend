'use client';

import type { SavedEditorDraft } from '@/components/organisms/molecular-editor/moleculeEditorSession';
import type { ShowGalleryFeedback } from '@/components/organisms/molecular-editor/savedMoleculeWorkflow.types';
import useApplySavedMoleculeToEditor from '@/components/organisms/molecular-editor/useApplySavedMoleculeToEditor';
import useSavedMoleculeWorkflow from '@/components/organisms/molecular-editor/useSavedMoleculeWorkflow';
import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';

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
  const applySavedMolecule = useApplySavedMoleculeToEditor({
    applyEditorSnapshot,
    clearHistory,
    setActiveSavedMoleculeId,
    setMoleculeEducationalDescription,
    setMoleculeName,
    setNomenclatureFallback,
  });

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
