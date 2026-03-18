'use client';

import { useCallback } from 'react';

import { resolveNextStandalonePoint } from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import {
  getMolecularEditorBondOrderLabel,
  formatMolecularEditorPlacementAddedToCanvas,
  formatMolecularEditorPlacementAttachedToSelection,
  formatMolecularEditorPlacementBondMessage,
  formatMolecularEditorPlacementOnCanvas,
} from '@/components/organisms/molecular-editor/molecularEditorText';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
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
  const text = useMolecularEditorText();

  const onAddSelectedElement = useCallback(() => {
    if (activeElement === null) {
      setEditorNotice(text.notices.noElementMatchesSearch);
      return;
    }

    if (molecule.atoms.length === 0 || selectedAtomId === null) {
      const nextPoint = resolveNextStandalonePoint(molecule);
      const result = addStandaloneAtom(molecule, activeElement, nextPoint);
      commitMoleculeChange(
        molecule,
        result,
        formatMolecularEditorPlacementAddedToCanvas(text, activeElement.symbol),
        nextPoint,
      );
      return;
    }

    const result = addAttachedAtom(molecule, selectedAtomId, activeElement, bondOrder);
    const bondLabel = getMolecularEditorBondOrderLabel(text, bondOrder).toLowerCase();
    commitMoleculeChange(
      molecule,
      result,
      formatMolecularEditorPlacementBondMessage(text, activeElement.symbol, bondLabel),
    );
  }, [activeElement, bondOrder, commitMoleculeChange, molecule, selectedAtomId, setEditorNotice, text]);

  const handleCanvasPlacement = useCallback(
    (point: { x: number; y: number }) => {
      if (activeView !== 'editor') {
        return;
      }

      if (activeElement === null) {
        setEditorNotice(text.notices.chooseElementBeforePlacing);
        return;
      }

      if (selectedAtomId === null) {
        const result = addStandaloneAtom(molecule, activeElement, point);
        commitMoleculeChange(
          molecule,
          result,
          formatMolecularEditorPlacementOnCanvas(text, activeElement.symbol),
          point,
        );
        return;
      }

      const result = addAttachedAtom(molecule, selectedAtomId, activeElement, bondOrder);
      commitMoleculeChange(
        molecule,
        result,
        formatMolecularEditorPlacementAttachedToSelection(text, activeElement.symbol),
      );
    },
    [activeElement, activeView, bondOrder, commitMoleculeChange, molecule, selectedAtomId, setEditorNotice, text],
  );

  return {
    handleCanvasPlacement,
    onAddSelectedElement,
  };
}
