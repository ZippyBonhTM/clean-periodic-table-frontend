'use client';

import usePendingSavedMoleculeLoader from '@/components/organisms/molecular-editor/usePendingSavedMoleculeLoader';
import useResolvedSavedMoleculeSelection from '@/components/organisms/molecular-editor/useResolvedSavedMoleculeSelection';
import type { ShowGalleryFeedback } from '@/components/organisms/molecular-editor/savedMoleculeWorkflow.types';
import type {
  SavedMoleculeMetadataSetters,
  SavedMoleculeMutationHandlers,
  SavedMoleculePageMode,
} from '@/components/organisms/molecular-editor/savedMoleculeWorkflowOptions.types';
import useSavedMoleculeMutations from '@/components/organisms/molecular-editor/useSavedMoleculeMutations';
import useSavedMoleculeWorkflowUi from '@/components/organisms/molecular-editor/useSavedMoleculeWorkflowUi';
import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';

type UseSavedMoleculeWorkflowOptions = SavedMoleculeMutationHandlers &
  SavedMoleculeMetadataSetters & {
  activeSavedMoleculeId: string | null;
  applySavedMolecule: (savedMolecule: SavedMolecule, notice: string) => void;
  buildSaveMoleculeInput: () => SaveMoleculeInput;
  closeImportModal: () => void;
  collapseFloatingSaveShortcut: () => void;
  isSavedMoleculesLoading: boolean;
  normalizedSavedMolecules: SavedMolecule[];
  pageMode: SavedMoleculePageMode;
  showGalleryFeedback: ShowGalleryFeedback;
  summaryAtomCount: number;
};

export default function useSavedMoleculeWorkflow({
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
}: UseSavedMoleculeWorkflowOptions) {
  const { activeSavedMolecule, resolvedActiveSavedMoleculeId } = useResolvedSavedMoleculeSelection({
    activeSavedMoleculeId,
    normalizedSavedMolecules,
  });

  const { hasCheckedPendingSavedMolecule, hasPendingSavedMolecule } = usePendingSavedMoleculeLoader({
    applySavedMolecule,
    isSavedMoleculesLoading,
    normalizedSavedMolecules,
    pageMode,
    showGalleryFeedback,
  });

  const {
    isSaveModalOpen,
    onCloseSaveModal,
    onDetachSavedMolecule,
    onLoadSavedMolecule,
    onOpenCurrentSavedMoleculeInEditor,
    onOpenGalleryEditModal,
    onOpenSaveModal,
    setIsSaveModalOpen,
  } = useSavedMoleculeWorkflowUi({
    activeSavedMolecule,
    applySavedMolecule,
    closeImportModal,
    collapseFloatingSaveShortcut,
    resolvedActiveSavedMoleculeId,
    setActiveSavedMoleculeId,
    showGalleryFeedback,
  });

  const {
    onDeleteCurrentSavedMolecule,
    onDeleteCurrentSavedMoleculeFromGallery,
    onSaveAsNewMolecule,
    onUpdateCurrentSavedMolecule,
  } = useSavedMoleculeMutations({
    activeSavedMolecule,
    buildSaveMoleculeInput,
    onCreateSavedMolecule,
    onDeleteSavedMolecule,
    onUpdateSavedMolecule,
    resolvedActiveSavedMoleculeId,
    setActiveSavedMoleculeId,
    setIsSaveModalOpen,
    setMoleculeEducationalDescription,
    setMoleculeName,
    showGalleryFeedback,
    summaryAtomCount,
  });

  return {
    activeSavedMolecule,
    hasCheckedPendingSavedMolecule,
    hasPendingSavedMolecule,
    isSaveModalOpen,
    onCloseSaveModal,
    onDeleteCurrentSavedMolecule,
    onDeleteCurrentSavedMoleculeFromGallery,
    onDetachSavedMolecule,
    onLoadSavedMolecule,
    onOpenCurrentSavedMoleculeInEditor,
    onOpenGalleryEditModal,
    onOpenSaveModal,
    onSaveAsNewMolecule,
    onUpdateCurrentSavedMolecule,
    resolvedActiveSavedMoleculeId,
  };
}
