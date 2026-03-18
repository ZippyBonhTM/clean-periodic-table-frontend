'use client';

import { useCallback } from 'react';

import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
import type { ShowGalleryFeedback } from '@/components/organisms/molecular-editor/savedMoleculeWorkflow.types';
import type { SavedMoleculeDeleteHandler } from '@/components/organisms/molecular-editor/savedMoleculeWorkflowOptions.types';
import { mapSavedMoleculesErrorMessage } from '@/shared/hooks/useSavedMolecules';
import type { SavedMolecule } from '@/shared/types/molecule';

type UseSavedMoleculeDeleteActionsOptions = SavedMoleculeDeleteHandler & {
  activeSavedMolecule: SavedMolecule | null;
  resolvedActiveSavedMoleculeId: string | null;
  setActiveSavedMoleculeId: (moleculeId: string | null) => void;
  setIsSaveModalOpen: (isOpen: boolean) => void;
  showGalleryFeedback: ShowGalleryFeedback;
};

export default function useSavedMoleculeDeleteActions({
  activeSavedMolecule,
  onDeleteSavedMolecule,
  resolvedActiveSavedMoleculeId,
  setActiveSavedMoleculeId,
  setIsSaveModalOpen,
  showGalleryFeedback,
}: UseSavedMoleculeDeleteActionsOptions) {
  const text = useMolecularEditorText();

  const onDeleteCurrentSavedMolecule = useCallback(async () => {
    if (resolvedActiveSavedMoleculeId === null) {
      showGalleryFeedback('error', text.notices.selectSavedBeforeDeleting);
      return;
    }

    try {
      showGalleryFeedback('info', text.notices.deleteRequestSent, { persist: true });
      await onDeleteSavedMolecule(resolvedActiveSavedMoleculeId);
      setActiveSavedMoleculeId(null);
      setIsSaveModalOpen(false);
      showGalleryFeedback('success', text.notices.savedWorkDeleted);
    } catch (caughtError: unknown) {
      showGalleryFeedback('error', mapSavedMoleculesErrorMessage(caughtError));
    }
  }, [
    onDeleteSavedMolecule,
    resolvedActiveSavedMoleculeId,
    setActiveSavedMoleculeId,
    setIsSaveModalOpen,
    showGalleryFeedback,
    text.notices.deleteRequestSent,
    text.notices.savedWorkDeleted,
    text.notices.selectSavedBeforeDeleting,
  ]);

  const onDeleteCurrentSavedMoleculeFromGallery = useCallback(async () => {
    if (activeSavedMolecule === null) {
      showGalleryFeedback('error', text.notices.selectSavedBeforeDeleting);
      return;
    }

    const label = activeSavedMolecule.name ?? activeSavedMolecule.summary.formula;
    const shouldDelete = window.confirm(`${text.gallery.delete} "${label}"?`);

    if (!shouldDelete) {
      return;
    }

    await onDeleteCurrentSavedMolecule();
  }, [
    activeSavedMolecule,
    onDeleteCurrentSavedMolecule,
    showGalleryFeedback,
    text.gallery.delete,
    text.notices.selectSavedBeforeDeleting,
  ]);

  return {
    onDeleteCurrentSavedMolecule,
    onDeleteCurrentSavedMoleculeFromGallery,
  };
}
