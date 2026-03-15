'use client';

import { useCallback } from 'react';

import type { ShowGalleryFeedback } from '@/components/organisms/molecular-editor/savedMoleculeWorkflow.types';
import { mapSavedMoleculesErrorMessage } from '@/shared/hooks/useSavedMolecules';
import type { SavedMolecule } from '@/shared/types/molecule';

type UseSavedMoleculeDeleteActionsOptions = {
  activeSavedMolecule: SavedMolecule | null;
  onDeleteSavedMolecule: (moleculeId: string) => Promise<void>;
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
  const onDeleteCurrentSavedMolecule = useCallback(async () => {
    if (resolvedActiveSavedMoleculeId === null) {
      showGalleryFeedback('error', 'Select a saved molecule before deleting it.');
      return;
    }

    try {
      showGalleryFeedback('info', 'Delete request sent.', { persist: true });
      await onDeleteSavedMolecule(resolvedActiveSavedMoleculeId);
      setActiveSavedMoleculeId(null);
      setIsSaveModalOpen(false);
      showGalleryFeedback('success', 'Saved work deleted.');
    } catch (caughtError: unknown) {
      showGalleryFeedback('error', mapSavedMoleculesErrorMessage(caughtError));
    }
  }, [
    onDeleteSavedMolecule,
    resolvedActiveSavedMoleculeId,
    setActiveSavedMoleculeId,
    setIsSaveModalOpen,
    showGalleryFeedback,
  ]);

  const onDeleteCurrentSavedMoleculeFromGallery = useCallback(async () => {
    if (activeSavedMolecule === null) {
      showGalleryFeedback('error', 'Select a saved molecule before deleting it.');
      return;
    }

    const label = activeSavedMolecule.name ?? activeSavedMolecule.summary.formula;
    const shouldDelete = window.confirm(`Delete "${label}" from your gallery?`);

    if (!shouldDelete) {
      return;
    }

    await onDeleteCurrentSavedMolecule();
  }, [activeSavedMolecule, onDeleteCurrentSavedMolecule, showGalleryFeedback]);

  return {
    onDeleteCurrentSavedMolecule,
    onDeleteCurrentSavedMoleculeFromGallery,
  };
}
