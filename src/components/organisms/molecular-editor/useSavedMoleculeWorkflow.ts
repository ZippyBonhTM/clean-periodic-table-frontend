'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

import usePendingSavedMoleculeLoader from '@/components/organisms/molecular-editor/usePendingSavedMoleculeLoader';
import useResolvedSavedMoleculeSelection from '@/components/organisms/molecular-editor/useResolvedSavedMoleculeSelection';
import useSavedMoleculeMutations from '@/components/organisms/molecular-editor/useSavedMoleculeMutations';
import { writePendingSavedMoleculeId } from '@/shared/storage/pendingSavedMoleculeStorage';
import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';

type GalleryFeedbackTone = 'info' | 'success' | 'error';

type ShowGalleryFeedback = (
  tone: GalleryFeedbackTone,
  message: string,
  options?: {
    persist?: boolean;
  },
) => void;

type UseSavedMoleculeWorkflowOptions = {
  activeSavedMoleculeId: string | null;
  applySavedMolecule: (savedMolecule: SavedMolecule, notice: string) => void;
  buildSaveMoleculeInput: () => SaveMoleculeInput;
  closeImportModal: () => void;
  collapseFloatingSaveShortcut: () => void;
  isSavedMoleculesLoading: boolean;
  normalizedSavedMolecules: SavedMolecule[];
  onCreateSavedMolecule: (input: SaveMoleculeInput) => Promise<SavedMolecule>;
  onDeleteSavedMolecule: (moleculeId: string) => Promise<void>;
  onUpdateSavedMolecule: (moleculeId: string, input: SaveMoleculeInput) => Promise<SavedMolecule>;
  pageMode: 'editor' | 'gallery';
  setActiveSavedMoleculeId: (moleculeId: string | null) => void;
  setMoleculeEducationalDescription: (value: string) => void;
  setMoleculeName: (value: string) => void;
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
  const router = useRouter();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

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
