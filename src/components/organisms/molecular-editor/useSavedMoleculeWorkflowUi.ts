'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import { writePendingSavedMoleculeId } from '@/shared/storage/pendingSavedMoleculeStorage';
import type { SavedMolecule } from '@/shared/types/molecule';

type ShowGalleryFeedback = (
  tone: 'info' | 'success' | 'error',
  message: string,
  options?: {
    persist?: boolean;
  },
) => void;

type UseSavedMoleculeWorkflowUiOptions = {
  activeSavedMolecule: SavedMolecule | null;
  applySavedMolecule: (savedMolecule: SavedMolecule, notice: string) => void;
  closeImportModal: () => void;
  collapseFloatingSaveShortcut: () => void;
  resolvedActiveSavedMoleculeId: string | null;
  setActiveSavedMoleculeId: (moleculeId: string | null) => void;
  showGalleryFeedback: ShowGalleryFeedback;
};

export default function useSavedMoleculeWorkflowUi({
  activeSavedMolecule,
  applySavedMolecule,
  closeImportModal,
  collapseFloatingSaveShortcut,
  resolvedActiveSavedMoleculeId,
  setActiveSavedMoleculeId,
  showGalleryFeedback,
}: UseSavedMoleculeWorkflowUiOptions) {
  const router = useRouter();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const onDetachSavedMolecule = useCallback(() => {
    setActiveSavedMoleculeId(null);
    showGalleryFeedback('info', 'Current canvas detached. Saving now will create a new record.');
  }, [setActiveSavedMoleculeId, showGalleryFeedback]);

  const onOpenSaveModal = useCallback(() => {
    collapseFloatingSaveShortcut();
    closeImportModal();
    setIsSaveModalOpen(true);
  }, [closeImportModal, collapseFloatingSaveShortcut]);

  const onOpenGalleryEditModal = useCallback(() => {
    if (resolvedActiveSavedMoleculeId === null) {
      showGalleryFeedback('error', 'Select a saved molecule before editing its gallery data.');
      return;
    }

    closeImportModal();
    collapseFloatingSaveShortcut();
    setIsSaveModalOpen(true);
  }, [closeImportModal, collapseFloatingSaveShortcut, resolvedActiveSavedMoleculeId, showGalleryFeedback]);

  const onCloseSaveModal = useCallback(() => {
    setIsSaveModalOpen(false);
  }, []);

  const onLoadSavedMolecule = useCallback(
    (savedMolecule: SavedMolecule) => {
      applySavedMolecule(savedMolecule, `${savedMolecule.name ?? savedMolecule.summary.formula} loaded.`);
    },
    [applySavedMolecule],
  );

  const onOpenCurrentSavedMoleculeInEditor = useCallback(() => {
    if (activeSavedMolecule === null) {
      showGalleryFeedback('error', 'Select a saved molecule before opening it in the editor.');
      return;
    }

    writePendingSavedMoleculeId(activeSavedMolecule.id);
    router.push('/molecular-editor');
  }, [activeSavedMolecule, router, showGalleryFeedback]);

  return {
    isSaveModalOpen,
    onCloseSaveModal,
    onDetachSavedMolecule,
    onLoadSavedMolecule,
    onOpenCurrentSavedMoleculeInEditor,
    onOpenGalleryEditModal,
    onOpenSaveModal,
    setIsSaveModalOpen,
  };
}
