'use client';

import { useCallback } from 'react';

import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
import type {
  MoleculeEditorStructureActions,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';

type UseMoleculeEditorResetActionOptions<Snapshot> = Pick<
  UseMoleculeEditorActionsOptions<Snapshot>,
  | 'activeView'
  | 'bondOrder'
  | 'buildHistorySnapshot'
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

export default function useMoleculeEditorResetAction<Snapshot>({
  activeView,
  bondOrder,
  buildHistorySnapshot,
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
}: UseMoleculeEditorResetActionOptions<Snapshot>): Pick<
  MoleculeEditorStructureActions,
  'onResetMolecule'
> {
  const text = useMolecularEditorText();

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
      setEditorNotice(text.notices.editorAlreadyReset);
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
    setEditorNotice(text.notices.editorReset);
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
    text.notices.editorAlreadyReset,
    text.notices.editorReset,
  ]);

  return {
    onResetMolecule,
  };
}
