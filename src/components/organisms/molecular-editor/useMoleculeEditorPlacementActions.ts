'use client';

import { useCallback } from 'react';

import { resolveNextStandalonePoint } from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import type {
  MoleculeEditorChangeCommitter,
  MoleculeEditorStructureActions,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';
import {
  addAttachedAtom,
  addStandaloneAtom,
} from '@/shared/utils/moleculeEditor';

type UseMoleculeEditorPlacementActionsOptions<Snapshot> = Pick<
  UseMoleculeEditorActionsOptions<Snapshot>,
  | 'activeElement'
  | 'activeView'
  | 'bondOrder'
  | 'molecule'
  | 'selectedAtomId'
  | 'setEditorNotice'
> & {
  commitMoleculeChange: MoleculeEditorChangeCommitter<Snapshot>;
};

export default function useMoleculeEditorPlacementActions<Snapshot>({
  activeElement,
  activeView,
  bondOrder,
  commitMoleculeChange,
  molecule,
  selectedAtomId,
  setEditorNotice,
}: UseMoleculeEditorPlacementActionsOptions<Snapshot>): Pick<
  MoleculeEditorStructureActions,
  'handleCanvasPlacement' | 'onAddSelectedElement'
> {
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

  return {
    handleCanvasPlacement,
    onAddSelectedElement,
  };
}
