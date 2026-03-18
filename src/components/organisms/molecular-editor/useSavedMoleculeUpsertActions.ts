'use client';

import { useCallback } from 'react';

import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
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
  const text = useMolecularEditorText();

  const onSaveAsNewMolecule = useCallback(async () => {
    if (summaryAtomCount === 0) {
      showGalleryFeedback('error', text.notices.addAtomsBeforeSaving);
      return;
    }

    try {
      showGalleryFeedback('info', text.notices.saveRequestSent, { persist: true });
      const created = await onCreateSavedMolecule(buildSaveMoleculeInput());
      setActiveSavedMoleculeId(created.id);
      setMoleculeName(created.name ?? '');
      setMoleculeEducationalDescription(created.educationalDescription ?? '');
      setIsSaveModalOpen(false);
      showGalleryFeedback('success', text.feedback.workSaved);
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
    text.feedback.workSaved,
    text.notices.addAtomsBeforeSaving,
    text.notices.saveRequestSent,
  ]);

  const onUpdateCurrentSavedMolecule = useCallback(async () => {
    if (resolvedActiveSavedMoleculeId === null) {
      showGalleryFeedback('error', text.notices.selectSavedBeforeUpdating);
      return;
    }

    if (summaryAtomCount === 0) {
      showGalleryFeedback('error', text.notices.addAtomsBeforeUpdating);
      return;
    }

    try {
      showGalleryFeedback('info', text.notices.saveRequestSent, { persist: true });
      const updated = await onUpdateSavedMolecule(resolvedActiveSavedMoleculeId, buildSaveMoleculeInput());
      setMoleculeName(updated.name ?? '');
      setMoleculeEducationalDescription(updated.educationalDescription ?? '');
      setIsSaveModalOpen(false);
      showGalleryFeedback('success', text.feedback.workSaved);
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
    text.feedback.workSaved,
    text.notices.addAtomsBeforeUpdating,
    text.notices.saveRequestSent,
    text.notices.selectSavedBeforeUpdating,
  ]);

  return {
    onSaveAsNewMolecule,
    onUpdateCurrentSavedMolecule,
  };
}
