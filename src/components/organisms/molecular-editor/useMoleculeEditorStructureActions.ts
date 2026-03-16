'use client';

import { useCallback } from 'react';

import { resolveNextStandalonePoint } from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import useMoleculeEditorChangeCommitter from '@/components/organisms/molecular-editor/useMoleculeEditorChangeCommitter';
import useMoleculeEditorImportActions from '@/components/organisms/molecular-editor/useMoleculeEditorImportActions';
import useMoleculeEditorModelStateActions from '@/components/organisms/molecular-editor/useMoleculeEditorModelStateActions';
import type {
  MoleculeEditorStructureActions,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';
import {
  addAttachedAtom,
  addStandaloneAtom,
  connectAtoms,
} from '@/shared/utils/moleculeEditor';

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

  const onAddSelectedElement = useCallback(() => {
    if (activeElement === null) {
      setEditorNotice('No element matches the current search.');
      return;
    }

    if (molecule.atoms.length === 0 || selectedAtomId === null) {
      const nextPoint = resolveNextStandalonePoint(molecule);
      const result = addStandaloneAtom(molecule, activeElement, nextPoint);
      commitMoleculeChange(molecule, result, `${activeElement.symbol} added to the canvas.`, nextPoint);
      return;
    }

    const result = addAttachedAtom(molecule, selectedAtomId, activeElement, bondOrder);
    commitMoleculeChange(molecule, result, `${activeElement.symbol} attached with a bond order of ${bondOrder}.`);
  }, [activeElement, bondOrder, commitMoleculeChange, molecule, selectedAtomId, setEditorNotice]);

  const handleCanvasPlacement = useCallback(
    (point: { x: number; y: number }) => {
      if (activeView !== 'editor') {
        return;
      }

      if (activeElement === null) {
        setEditorNotice('Choose an element before placing atoms.');
        return;
      }

      if (selectedAtomId === null) {
        const result = addStandaloneAtom(molecule, activeElement, point);
        commitMoleculeChange(molecule, result, `${activeElement.symbol} placed on the canvas.`, point);
        return;
      }

      const result = addAttachedAtom(molecule, selectedAtomId, activeElement, bondOrder);
      commitMoleculeChange(molecule, result, `${activeElement.symbol} attached to the selected atom.`);
    },
    [activeElement, activeView, bondOrder, commitMoleculeChange, molecule, selectedAtomId, setEditorNotice],
  );

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
