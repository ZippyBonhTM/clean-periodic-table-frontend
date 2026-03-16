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

type UseMoleculeEditorRemoveAtomActionOptions<Snapshot> = Pick<
  UseMoleculeEditorActionsOptions<Snapshot>,
  | 'buildHistorySnapshot'
  | 'canvasFrameAspectRatio'
  | 'canvasViewport'
  | 'molecule'
  | 'pushHistorySnapshot'
  | 'selectedAtomId'
  | 'setCanvasViewport'
  | 'setEditorNotice'
  | 'setMolecule'
  | 'setSelectedAtomId'
>;

export default function useMoleculeEditorRemoveAtomAction<Snapshot>({
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
}: UseMoleculeEditorRemoveAtomActionOptions<Snapshot>): Pick<
  MoleculeEditorStructureActions,
  'onRemoveSelectedAtom'
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

  return {
    onRemoveSelectedAtom,
  };
}
