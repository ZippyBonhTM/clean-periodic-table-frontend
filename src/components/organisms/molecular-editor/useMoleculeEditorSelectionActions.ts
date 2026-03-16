'use client';

import { useCallback } from 'react';

import type {
  MoleculeEditorChangeCommitter,
  MoleculeEditorStructureActions,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';
import { connectAtoms } from '@/shared/utils/moleculeEditor';

type UseMoleculeEditorSelectionActionsOptions<Snapshot> = Pick<
  UseMoleculeEditorActionsOptions<Snapshot>,
  | 'bondOrder'
  | 'clearPendingCanvasPlacementRef'
  | 'molecule'
  | 'selectedAtomId'
  | 'setEditorNotice'
  | 'setSelectedAtomId'
> & {
  commitMoleculeChange: MoleculeEditorChangeCommitter<Snapshot>;
};

export default function useMoleculeEditorSelectionActions<Snapshot>({
  bondOrder,
  clearPendingCanvasPlacementRef,
  commitMoleculeChange,
  molecule,
  selectedAtomId,
  setEditorNotice,
  setSelectedAtomId,
}: UseMoleculeEditorSelectionActionsOptions<Snapshot>): Pick<
  MoleculeEditorStructureActions,
  'handleAtomActivate' | 'onClearSelection'
> {
  const onClearSelection = useCallback(() => {
    clearPendingCanvasPlacementRef.current();
    setSelectedAtomId(null);
    setEditorNotice('Selection cleared.');
  }, [clearPendingCanvasPlacementRef, setEditorNotice, setSelectedAtomId]);

  const handleAtomActivate = useCallback(
    (atomId: string) => {
      clearPendingCanvasPlacementRef.current();

      if (selectedAtomId === null) {
        setSelectedAtomId(atomId);
        setEditorNotice('Atom selected. Tap another atom to create a bond, or use the tools to attach the active element.');
        return;
      }

      if (selectedAtomId === atomId) {
        onClearSelection();
        return;
      }

      const result = connectAtoms(molecule, selectedAtomId, atomId, bondOrder);
      commitMoleculeChange(molecule, result, `Bond updated to order ${bondOrder}.`);
    },
    [
      bondOrder,
      clearPendingCanvasPlacementRef,
      commitMoleculeChange,
      molecule,
      onClearSelection,
      selectedAtomId,
      setEditorNotice,
      setSelectedAtomId,
    ],
  );

  return {
    handleAtomActivate,
    onClearSelection,
  };
}
