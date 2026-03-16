'use client';

import { useCallback } from 'react';

import useMoleculeEditorChangeCommitter from '@/components/organisms/molecular-editor/useMoleculeEditorChangeCommitter';
import useMoleculeEditorImportActions from '@/components/organisms/molecular-editor/useMoleculeEditorImportActions';
import useMoleculeEditorModelStateActions from '@/components/organisms/molecular-editor/useMoleculeEditorModelStateActions';
import useMoleculeEditorPlacementActions from '@/components/organisms/molecular-editor/useMoleculeEditorPlacementActions';
import type {
  MoleculeEditorStructureActions,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';
import { connectAtoms } from '@/shared/utils/moleculeEditor';

type UseMoleculeEditorStructureActionsOptions<Snapshot> = Pick<
  UseMoleculeEditorActionsOptions<Snapshot>,
  | 'activeElement'
  | 'activeView'
  | 'applyEditorSnapshot'
  | 'bondOrder'
  | 'buildHistorySnapshot'
  | 'canvasFrameAspectRatio'
  | 'canvasViewport'
  | 'clearPendingCanvasPlacementRef'
  | 'clearTransientEditorStateRef'
  | 'cloneMoleculeModel'
  | 'defaultCanvasViewport'
  | 'emptyMolecule'
  | 'molecule'
  | 'normalizeSelectedAtomId'
  | 'pushHistorySnapshot'
  | 'selectedAtomId'
  | 'setActiveSavedMoleculeId'
  | 'setActiveView'
  | 'setBondOrder'
  | 'setCanvasViewport'
  | 'setEditorNotice'
  | 'setFocusedComponentIndex'
  | 'setIsImportModalOpen'
  | 'setMolecule'
  | 'setMoleculeEducationalDescription'
  | 'setMoleculeName'
  | 'setNomenclatureFallback'
  | 'setSelectedAtomId'
  | 'showGalleryFeedback'
>;

export default function useMoleculeEditorStructureActions<Snapshot>({
  activeElement,
  activeView,
  applyEditorSnapshot,
  bondOrder,
  buildHistorySnapshot,
  canvasFrameAspectRatio,
  canvasViewport,
  clearPendingCanvasPlacementRef,
  clearTransientEditorStateRef,
  cloneMoleculeModel,
  defaultCanvasViewport,
  emptyMolecule,
  molecule,
  normalizeSelectedAtomId,
  pushHistorySnapshot,
  selectedAtomId,
  setActiveSavedMoleculeId,
  setActiveView,
  setBondOrder,
  setCanvasViewport,
  setEditorNotice,
  setFocusedComponentIndex,
  setIsImportModalOpen,
  setMolecule,
  setMoleculeEducationalDescription,
  setMoleculeName,
  setNomenclatureFallback,
  setSelectedAtomId,
  showGalleryFeedback,
}: UseMoleculeEditorStructureActionsOptions<Snapshot>): MoleculeEditorStructureActions {
  const commitMoleculeChange = useMoleculeEditorChangeCommitter({
    buildHistorySnapshot,
    canvasFrameAspectRatio,
    canvasViewport,
    clearPendingCanvasPlacementRef,
    molecule,
    normalizeSelectedAtomId,
    pushHistorySnapshot,
    selectedAtomId,
    setCanvasViewport,
    setEditorNotice,
    setMolecule,
    setNomenclatureFallback,
    setSelectedAtomId,
  });

  const onImportExternalMolecule = useMoleculeEditorImportActions({
    applyEditorSnapshot,
    buildHistorySnapshot,
    cloneMoleculeModel,
    defaultCanvasViewport,
    pushHistorySnapshot,
    setActiveSavedMoleculeId,
    setIsImportModalOpen,
    setMoleculeEducationalDescription,
    setMoleculeName,
    setNomenclatureFallback,
    showGalleryFeedback,
  });

  const { onRemoveSelectedAtom, onResetMolecule } = useMoleculeEditorModelStateActions({
    activeView,
    bondOrder,
    buildHistorySnapshot,
    canvasFrameAspectRatio,
    canvasViewport,
    clearTransientEditorStateRef,
    defaultCanvasViewport,
    emptyMolecule,
    molecule,
    pushHistorySnapshot,
    selectedAtomId,
    setActiveView,
    setBondOrder,
    setCanvasViewport,
    setEditorNotice,
    setFocusedComponentIndex,
    setMolecule,
    setNomenclatureFallback,
    setSelectedAtomId,
  });

  const { handleCanvasPlacement, onAddSelectedElement } = useMoleculeEditorPlacementActions({
    activeElement,
    activeView,
    bondOrder,
    commitMoleculeChange,
    molecule,
    selectedAtomId,
    setEditorNotice,
  });

  const handleAtomActivate = useCallback(
    (atomId: string) => {
      clearPendingCanvasPlacementRef.current();

      if (selectedAtomId === null) {
        setSelectedAtomId(atomId);
        setEditorNotice('Atom selected. Tap another atom to create a bond, or use the tools to attach the active element.');
        return;
      }

      if (selectedAtomId === atomId) {
        setSelectedAtomId(null);
        setEditorNotice('Selection cleared.');
        return;
      }

      const result = connectAtoms(molecule, selectedAtomId, atomId, bondOrder);
      commitMoleculeChange(molecule, result, `Bond updated to order ${bondOrder}.`);
    },
    [bondOrder, clearPendingCanvasPlacementRef, commitMoleculeChange, molecule, selectedAtomId, setEditorNotice, setSelectedAtomId],
  );

  const onClearSelection = useCallback(() => {
    clearPendingCanvasPlacementRef.current();
    setSelectedAtomId(null);
    setEditorNotice('Selection cleared.');
  }, [clearPendingCanvasPlacementRef, setEditorNotice, setSelectedAtomId]);

  return {
    handleAtomActivate,
    handleCanvasPlacement,
    onAddSelectedElement,
    onClearSelection,
    onImportExternalMolecule,
    onRemoveSelectedAtom,
    onResetMolecule,
  };
}
