'use client';

import useMoleculeEditorChangeCommitter from '@/components/organisms/molecular-editor/useMoleculeEditorChangeCommitter';
import useMoleculeEditorImportActions from '@/components/organisms/molecular-editor/useMoleculeEditorImportActions';
import useMoleculeEditorModelStateActions from '@/components/organisms/molecular-editor/useMoleculeEditorModelStateActions';
import useMoleculeEditorPlacementActions from '@/components/organisms/molecular-editor/useMoleculeEditorPlacementActions';
import useMoleculeEditorSelectionActions from '@/components/organisms/molecular-editor/useMoleculeEditorSelectionActions';
import type {
  MoleculeEditorStructureActions,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';

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

  const { handleAtomActivate, onClearSelection } = useMoleculeEditorSelectionActions({
    bondOrder,
    clearPendingCanvasPlacementRef,
    commitMoleculeChange,
    molecule,
    selectedAtomId,
    setEditorNotice,
    setSelectedAtomId,
  });

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
