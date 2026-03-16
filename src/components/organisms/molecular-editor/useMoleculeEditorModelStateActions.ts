'use client';

import type {
  MoleculeEditorStructureActions,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';
import useMoleculeEditorRemoveAtomAction from '@/components/organisms/molecular-editor/useMoleculeEditorRemoveAtomAction';
import useMoleculeEditorResetAction from '@/components/organisms/molecular-editor/useMoleculeEditorResetAction';

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
  const { onRemoveSelectedAtom } = useMoleculeEditorRemoveAtomAction({
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
  });

  const { onResetMolecule } = useMoleculeEditorResetAction({
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
  });

  return {
    onRemoveSelectedAtom,
    onResetMolecule,
  };
}
