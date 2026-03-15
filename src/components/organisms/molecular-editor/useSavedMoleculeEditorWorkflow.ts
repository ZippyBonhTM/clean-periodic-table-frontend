'use client';

import { resolveSavedMoleculeEditorStatus } from '@/components/organisms/molecular-editor/savedMoleculeEditorStatus';
import type { ShowGalleryFeedback } from '@/components/organisms/molecular-editor/savedMoleculeWorkflow.types';
import type {
  SavedMoleculeEditorBridgeOptions,
  SavedMoleculeMutationHandlers,
  SavedMoleculePageMode,
} from '@/components/organisms/molecular-editor/savedMoleculeWorkflowOptions.types';
import useApplySavedMoleculeToEditor from '@/components/organisms/molecular-editor/useApplySavedMoleculeToEditor';
import useSavedMoleculeWorkflow from '@/components/organisms/molecular-editor/useSavedMoleculeWorkflow';
import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';

type UseSavedMoleculeEditorWorkflowOptions = SavedMoleculeEditorBridgeOptions &
  SavedMoleculeMutationHandlers & {
  activeSavedMoleculeId: string | null;
  buildSaveMoleculeInput: () => SaveMoleculeInput;
  closeImportModal: () => void;
  collapseFloatingSaveShortcut: () => void;
  formula: string;
  isSavedMoleculesLoading: boolean;
  moleculeName: string;
  normalizedSavedMolecules: SavedMolecule[];
  pageMode: SavedMoleculePageMode;
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

  const { currentSaveLabel, hasCurrentSavedSelection } = resolveSavedMoleculeEditorStatus({
    activeSavedMolecule: workflow.activeSavedMolecule,
    formula,
    moleculeName,
    resolvedActiveSavedMoleculeId: workflow.resolvedActiveSavedMoleculeId,
    summaryAtomCount,
  });

  return {
    ...workflow,
    currentSaveLabel,
    hasCurrentSavedSelection,
  };
}
