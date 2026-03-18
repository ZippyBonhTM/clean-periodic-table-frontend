'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import {
  formatMolecularEditorGalleryLoadedMessage,
} from '@/components/organisms/molecular-editor/molecularEditorText';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
import type { ShowGalleryFeedback } from '@/components/organisms/molecular-editor/savedMoleculeWorkflow.types';
import { writePendingSavedMoleculeId } from '@/shared/storage/pendingSavedMoleculeStorage';
import type { SavedMolecule } from '@/shared/types/molecule';

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
  const text = useMolecularEditorText();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const onDetachSavedMolecule = useCallback(() => {
    setActiveSavedMoleculeId(null);
    showGalleryFeedback('info', text.notices.currentCanvasDetached);
  }, [setActiveSavedMoleculeId, showGalleryFeedback, text.notices.currentCanvasDetached]);

  const onOpenSaveModal = useCallback(() => {
    collapseFloatingSaveShortcut();
    closeImportModal();
    setIsSaveModalOpen(true);
  }, [closeImportModal, collapseFloatingSaveShortcut]);

  const onOpenGalleryEditModal = useCallback(() => {
    if (resolvedActiveSavedMoleculeId === null) {
      showGalleryFeedback('error', text.notices.selectSavedBeforeEditing);
      return;
    }

    closeImportModal();
    collapseFloatingSaveShortcut();
    setIsSaveModalOpen(true);
  }, [
    closeImportModal,
    collapseFloatingSaveShortcut,
    resolvedActiveSavedMoleculeId,
    showGalleryFeedback,
    text.notices.selectSavedBeforeEditing,
  ]);

  const onCloseSaveModal = useCallback(() => {
    setIsSaveModalOpen(false);
  }, []);

  const onLoadSavedMolecule = useCallback(
    (savedMolecule: SavedMolecule) => {
      applySavedMolecule(
        savedMolecule,
        formatMolecularEditorGalleryLoadedMessage(text, savedMolecule.name ?? savedMolecule.summary.formula),
      );
    },
    [applySavedMolecule, text],
  );

  const onOpenCurrentSavedMoleculeInEditor = useCallback(() => {
    if (activeSavedMolecule === null) {
      showGalleryFeedback('error', text.notices.selectSavedBeforeOpening);
      return;
    }

    writePendingSavedMoleculeId(activeSavedMolecule.id);
    router.push('/molecular-editor');
  }, [activeSavedMolecule, router, showGalleryFeedback, text.notices.selectSavedBeforeOpening]);

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
