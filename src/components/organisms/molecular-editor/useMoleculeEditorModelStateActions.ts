'use client';

import { useCallback } from 'react';

import { preserveViewportAcrossModelChange } from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import type {
  MoleculeEditorStructureActions,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';
import {
  dedupeBondConnections,
  rebalanceMoleculeLayout,
  removeAtom,
} from '@/shared/utils/moleculeEditor';

type UseMoleculeEditorModelStateActionsOptions<Snapshot> = Pick<
  UseMoleculeEditorActionsOptions<Snapshot>,
  | 'activeView'
  | 'bondOrder'
  | 'buildHistorySnapshot'
  | 'canvasFrameAspectRatio'
  | 'canvasViewport'
  | 'clearTransientEditorStateRef'
  | 'defaultCanvasViewport'
  | 'emptyMolecule'
  | 'molecule'
  | 'pushHistorySnapshot'
  | 'selectedAtomId'
  | 'setActiveView'
  | 'setBondOrder'
  | 'setCanvasViewport'
  | 'setEditorNotice'
  | 'setFocusedComponentIndex'
  | 'setMolecule'
  | 'setNomenclatureFallback'
  | 'setSelectedAtomId'
>;

export default function useMoleculeEditorModelStateActions<Snapshot>({
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
}: UseMoleculeEditorModelStateActionsOptions<Snapshot>): Pick<
  MoleculeEditorStructureActions,
  'onRemoveSelectedAtom' | 'onResetMolecule'
> {
  const onRemoveSelectedAtom = useCallback(() => {
    if (selectedAtomId === null) {
      setEditorNotice('Select an atom before removing it.');
      return;
    }

    const neighborBond =
      molecule.bonds.find((bond) => bond.sourceId === selectedAtomId || bond.targetId === selectedAtomId) ?? null;
    const fallbackAnchorAtomId =
      neighborBond === null
        ? undefined
        : neighborBond.sourceId === selectedAtomId
          ? neighborBond.targetId
          : neighborBond.sourceId;
    const nextMolecule = removeAtom(molecule, selectedAtomId);
    const rebalancedMolecule =
      nextMolecule.atoms.length === 0
        ? nextMolecule
        : rebalanceMoleculeLayout(
            nextMolecule,
            fallbackAnchorAtomId !== undefined && fallbackAnchorAtomId !== selectedAtomId
              ? fallbackAnchorAtomId
              : nextMolecule.atoms[0]?.id,
          );
    const nextViewport = preserveViewportAcrossModelChange(
      molecule,
      rebalancedMolecule,
      canvasViewport,
      canvasFrameAspectRatio,
    );
    const sanitizedMolecule = dedupeBondConnections(rebalancedMolecule);

    setCanvasViewport(nextViewport);
    pushHistorySnapshot(buildHistorySnapshot());
    setMolecule(sanitizedMolecule);
    setSelectedAtomId(null);
    setEditorNotice('Selected atom removed.');
  }, [
    buildHistorySnapshot,
    canvasFrameAspectRatio,
    canvasViewport,
    molecule,
    pushHistorySnapshot,
    selectedAtomId,
    setCanvasViewport,
    setEditorNotice,
    setMolecule,
    setSelectedAtomId,
  ]);

  const onResetMolecule = useCallback(() => {
    const isAlreadyPristine =
      molecule.atoms.length === 0 &&
      selectedAtomId === null &&
      activeView === 'editor' &&
      bondOrder === 1 &&
      canvasViewport.offsetX === defaultCanvasViewport.offsetX &&
      canvasViewport.offsetY === defaultCanvasViewport.offsetY &&
      canvasViewport.scale === defaultCanvasViewport.scale;

    if (isAlreadyPristine) {
      setEditorNotice('Editor already reset.');
      return;
    }

    pushHistorySnapshot(buildHistorySnapshot());
    clearTransientEditorStateRef.current();
    setMolecule(emptyMolecule);
    setSelectedAtomId(null);
    setFocusedComponentIndex(0);
    setNomenclatureFallback(null);
    setActiveView('editor');
    setBondOrder(1);
    setCanvasViewport(defaultCanvasViewport);
    setEditorNotice('Editor reset.');
  }, [
    activeView,
    bondOrder,
    buildHistorySnapshot,
    canvasViewport.offsetX,
    canvasViewport.offsetY,
    canvasViewport.scale,
    clearTransientEditorStateRef,
    defaultCanvasViewport,
    emptyMolecule,
    molecule.atoms.length,
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
  ]);

  return {
    onRemoveSelectedAtom,
    onResetMolecule,
  };
}
