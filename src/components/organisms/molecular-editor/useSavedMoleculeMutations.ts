'use client';

import type { ShowGalleryFeedback } from '@/components/organisms/molecular-editor/savedMoleculeWorkflow.types';
import type {
  SavedMoleculeMetadataSetters,
  SavedMoleculeMutationHandlers,
  SavedMoleculeMutationState,
} from '@/components/organisms/molecular-editor/savedMoleculeWorkflowOptions.types';
import useSavedMoleculeDeleteActions from '@/components/organisms/molecular-editor/useSavedMoleculeDeleteActions';
import useSavedMoleculeUpsertActions from '@/components/organisms/molecular-editor/useSavedMoleculeUpsertActions';
import type { SavedMolecule } from '@/shared/types/molecule';

type UseSavedMoleculeMutationsOptions = SavedMoleculeMutationHandlers &
  SavedMoleculeMetadataSetters &
  SavedMoleculeMutationState & {
  activeSavedMolecule: SavedMolecule | null;
  showGalleryFeedback: ShowGalleryFeedback;
};

export default function useSavedMoleculeMutations({
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
}: UseSavedMoleculeMutationsOptions) {
  const { onSaveAsNewMolecule, onUpdateCurrentSavedMolecule } = useSavedMoleculeUpsertActions({
    buildSaveMoleculeInput,
    onCreateSavedMolecule,
    onUpdateSavedMolecule,
    resolvedActiveSavedMoleculeId,
    setActiveSavedMoleculeId,
    setIsSaveModalOpen,
    setMoleculeEducationalDescription,
    setMoleculeName,
    showGalleryFeedback,
    summaryAtomCount,
  });

  const { onDeleteCurrentSavedMolecule, onDeleteCurrentSavedMoleculeFromGallery } =
    useSavedMoleculeDeleteActions({
      activeSavedMolecule,
      onDeleteSavedMolecule,
      resolvedActiveSavedMoleculeId,
      setActiveSavedMoleculeId,
      setIsSaveModalOpen,
      showGalleryFeedback,
    });

  return {
    onDeleteCurrentSavedMolecule,
    onDeleteCurrentSavedMoleculeFromGallery,
    onSaveAsNewMolecule,
    onUpdateCurrentSavedMolecule,
  };
}
