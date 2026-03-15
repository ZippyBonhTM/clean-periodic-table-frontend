'use client';

import { useCallback } from 'react';

import type { ShowGalleryFeedback } from '@/components/organisms/molecular-editor/savedMoleculeWorkflow.types';
import type {
  SavedMoleculeMutationState,
  SavedMoleculeUpsertHandlers,
} from '@/components/organisms/molecular-editor/savedMoleculeWorkflowOptions.types';
import { mapSavedMoleculesErrorMessage } from '@/shared/hooks/useSavedMolecules';

type UseSavedMoleculeUpsertActionsOptions = SavedMoleculeUpsertHandlers &
  SavedMoleculeMutationState & {
  showGalleryFeedback: ShowGalleryFeedback;
};

export default function useSavedMoleculeUpsertActions({
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
}: UseSavedMoleculeUpsertActionsOptions) {
  const onSaveAsNewMolecule = useCallback(async () => {
    if (summaryAtomCount === 0) {
      showGalleryFeedback('error', 'Add atoms before saving a molecule to the gallery.');
      return;
    }

    try {
      showGalleryFeedback('info', 'Save request sent.', { persist: true });
      const created = await onCreateSavedMolecule(buildSaveMoleculeInput());
      setActiveSavedMoleculeId(created.id);
      setMoleculeName(created.name ?? '');
      setMoleculeEducationalDescription(created.educationalDescription ?? '');
      setIsSaveModalOpen(false);
      showGalleryFeedback('success', 'Work saved.');
    } catch (caughtError: unknown) {
      showGalleryFeedback('error', mapSavedMoleculesErrorMessage(caughtError));
    }
  }, [
    buildSaveMoleculeInput,
    onCreateSavedMolecule,
    setActiveSavedMoleculeId,
    setIsSaveModalOpen,
    setMoleculeEducationalDescription,
    setMoleculeName,
    showGalleryFeedback,
    summaryAtomCount,
  ]);

  const onUpdateCurrentSavedMolecule = useCallback(async () => {
    if (resolvedActiveSavedMoleculeId === null) {
      showGalleryFeedback('error', 'Select a saved molecule before updating it.');
      return;
    }

    if (summaryAtomCount === 0) {
      showGalleryFeedback('error', 'Add atoms before updating a saved molecule.');
      return;
    }

    try {
      showGalleryFeedback('info', 'Save request sent.', { persist: true });
      const updated = await onUpdateSavedMolecule(resolvedActiveSavedMoleculeId, buildSaveMoleculeInput());
      setMoleculeName(updated.name ?? '');
      setMoleculeEducationalDescription(updated.educationalDescription ?? '');
      setIsSaveModalOpen(false);
      showGalleryFeedback('success', 'Work saved.');
    } catch (caughtError: unknown) {
      showGalleryFeedback('error', mapSavedMoleculesErrorMessage(caughtError));
    }
  }, [
    buildSaveMoleculeInput,
    onUpdateSavedMolecule,
    resolvedActiveSavedMoleculeId,
    setIsSaveModalOpen,
    setMoleculeEducationalDescription,
    setMoleculeName,
    showGalleryFeedback,
    summaryAtomCount,
  ]);

  return {
    onSaveAsNewMolecule,
    onUpdateCurrentSavedMolecule,
  };
}
