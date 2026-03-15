'use client';

import type { ShowGalleryFeedback } from '@/components/organisms/molecular-editor/savedMoleculeWorkflow.types';
import useSavedMoleculeDeleteActions from '@/components/organisms/molecular-editor/useSavedMoleculeDeleteActions';
import useSavedMoleculeUpsertActions from '@/components/organisms/molecular-editor/useSavedMoleculeUpsertActions';
import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';

type UseSavedMoleculeMutationsOptions = {
  activeSavedMolecule: SavedMolecule | null;
  buildSaveMoleculeInput: () => SaveMoleculeInput;
  onCreateSavedMolecule: (input: SaveMoleculeInput) => Promise<SavedMolecule>;
  onDeleteSavedMolecule: (moleculeId: string) => Promise<void>;
  onUpdateSavedMolecule: (moleculeId: string, input: SaveMoleculeInput) => Promise<SavedMolecule>;
  resolvedActiveSavedMoleculeId: string | null;
  setActiveSavedMoleculeId: (moleculeId: string | null) => void;
  setIsSaveModalOpen: (isOpen: boolean) => void;
  setMoleculeEducationalDescription: (value: string) => void;
  setMoleculeName: (value: string) => void;
  showGalleryFeedback: ShowGalleryFeedback;
  summaryAtomCount: number;
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
