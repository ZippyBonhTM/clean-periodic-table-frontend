'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';

import usePendingSavedMoleculeLoader from '@/components/organisms/molecular-editor/usePendingSavedMoleculeLoader';
import { mapSavedMoleculesErrorMessage } from '@/shared/hooks/useSavedMolecules';
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

  const resolvedActiveSavedMoleculeId = useMemo(() => {
    if (activeSavedMoleculeId === null) {
      return null;
    }

    return normalizedSavedMolecules.some((entry) => entry.id === activeSavedMoleculeId)
      ? activeSavedMoleculeId
      : null;
  }, [activeSavedMoleculeId, normalizedSavedMolecules]);

  const activeSavedMolecule = useMemo(
    () => normalizedSavedMolecules.find((entry) => entry.id === resolvedActiveSavedMoleculeId) ?? null,
    [normalizedSavedMolecules, resolvedActiveSavedMoleculeId],
  );

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
    setMoleculeEducationalDescription,
    setMoleculeName,
    showGalleryFeedback,
    summaryAtomCount,
  ]);

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
  }, [onDeleteSavedMolecule, resolvedActiveSavedMoleculeId, setActiveSavedMoleculeId, showGalleryFeedback]);

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
