'use client';

import { useCallback } from 'react';

import {
  formatMolecularEditorBondUpdatedNotice,
} from '@/components/organisms/molecular-editor/molecularEditorText';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
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
  const text = useMolecularEditorText();

  const onClearSelection = useCallback(() => {
    clearPendingCanvasPlacementRef.current();
    setSelectedAtomId(null);
    setEditorNotice(text.notices.selectionCleared);
  }, [clearPendingCanvasPlacementRef, setEditorNotice, setSelectedAtomId, text.notices.selectionCleared]);

  const handleAtomActivate = useCallback(
    (atomId: string) => {
      clearPendingCanvasPlacementRef.current();

      if (selectedAtomId === null) {
        setSelectedAtomId(atomId);
        setEditorNotice(text.notices.atomSelected);
        return;
      }

      if (selectedAtomId === atomId) {
        onClearSelection();
        return;
      }

      const result = connectAtoms(molecule, selectedAtomId, atomId, bondOrder);
      commitMoleculeChange(molecule, result, formatMolecularEditorBondUpdatedNotice(text, bondOrder));
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
      text,
    ],
  );

  return {
    handleAtomActivate,
    onClearSelection,
  };
}
