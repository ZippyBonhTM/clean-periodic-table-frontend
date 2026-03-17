'use client';

import { useEffect } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import useCanvasInteractions from '@/components/organisms/molecular-editor/useCanvasInteractions';
import useMoleculeEditorActions from '@/components/organisms/molecular-editor/useMoleculeEditorActions';
import useMoleculeEditorShortcuts from '@/components/organisms/molecular-editor/useMoleculeEditorShortcuts';
import {
  DEFAULT_CANVAS_VIEWPORT,
  EMPTY_MOLECULE,
  isTextEditingElement,
} from '@/components/organisms/molecular-editor/moleculeEditorConfig';
import {
  cloneMoleculeModel,
  normalizeSnapshotSelectedAtomId,
  type CanvasViewport,
  type EditorViewMode,
  type SavedEditorDraft,
} from '@/components/organisms/molecular-editor/moleculeEditorSession';
import type { ChemicalElement } from '@/shared/types/element';
import type { MoleculeComponent, MoleculeModel, BondOrder } from '@/shared/utils/moleculeEditor';

type UseMolecularEditorRuntimeOptions = {
  activeElement: ChemicalElement | null;
  activeView: EditorViewMode;
  applyEditorSnapshot: (snapshot: SavedEditorDraft, notice: string) => void;
  bondOrder: BondOrder;
  buildHistorySnapshot: () => SavedEditorDraft;
  canvasFrameAspectRatio?: number;
  canvasFrameSize: {
    width: number;
    height: number;
  };
  canvasViewport: CanvasViewport;
  clearPendingCanvasPlacementRef: MutableRefObject<() => void>;
  clearTransientEditorStateRef: MutableRefObject<() => void>;
  isImportModalOpen: boolean;
  isSaveModalOpen: boolean;
  molecule: MoleculeModel;
  moleculeComponents: MoleculeComponent[];
  onRedo: () => void;
  onUndo: () => void;
  pageMode: 'editor' | 'gallery';
  pushHistorySnapshot: (snapshot: SavedEditorDraft) => void;
  selectedAtomId: string | null;
  setActiveSavedMoleculeId: Dispatch<SetStateAction<string | null>>;
  setActiveView: Dispatch<SetStateAction<EditorViewMode>>;
  setBondOrder: Dispatch<SetStateAction<BondOrder>>;
  setCanvasViewport: Dispatch<SetStateAction<CanvasViewport>>;
  setEditorNotice: Dispatch<SetStateAction<string | null>>;
  setFocusedComponentIndex: Dispatch<SetStateAction<number>>;
  setIsImportModalOpen: Dispatch<SetStateAction<boolean>>;
  setMolecule: Dispatch<SetStateAction<MoleculeModel>>;
  setMoleculeEducationalDescription: Dispatch<SetStateAction<string>>;
  setMoleculeName: Dispatch<SetStateAction<string>>;
  setNomenclatureFallback: Dispatch<SetStateAction<string | null>>;
  setSelectedAtomId: Dispatch<SetStateAction<string | null>>;
  showGalleryFeedback: (
    tone: 'info' | 'success' | 'error',
    message: string,
    options?: { persist?: boolean },
  ) => void;
  svgRef: React.RefObject<SVGSVGElement | null>;
};

export default function useMolecularEditorRuntime({
  activeElement,
  activeView,
  applyEditorSnapshot,
  bondOrder,
  buildHistorySnapshot,
  canvasFrameAspectRatio,
  canvasFrameSize,
  canvasViewport,
  clearPendingCanvasPlacementRef,
  clearTransientEditorStateRef,
  isImportModalOpen,
  isSaveModalOpen,
  molecule,
  moleculeComponents,
  onRedo,
  onUndo,
  pageMode,
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
  svgRef,
}: UseMolecularEditorRuntimeOptions) {
  const editorActions = useMoleculeEditorActions<SavedEditorDraft>({
    activeElement,
    activeView,
    applyEditorSnapshot,
    bondOrder,
    buildHistorySnapshot,
    canvasFrameAspectRatio,
    canvasFrameSize,
    canvasViewport,
    clearPendingCanvasPlacementRef,
    clearTransientEditorStateRef,
    cloneMoleculeModel,
    defaultCanvasViewport: DEFAULT_CANVAS_VIEWPORT,
    emptyMolecule: EMPTY_MOLECULE,
    isImportModalOpen,
    isSaveModalOpen,
    isTextEditingElement,
    molecule,
    moleculeComponents,
    normalizeSelectedAtomId: normalizeSnapshotSelectedAtomId,
    pageMode,
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
  });

  const canvasInteractions = useCanvasInteractions({
    activeView,
    canvasViewport,
    molecule,
    selectedAtomId,
    setCanvasViewport,
    setEditorNotice,
    setSelectedAtomId,
    svgRef,
    onCanvasPlacement: editorActions.handleCanvasPlacement,
    onAtomActivate: editorActions.handleAtomActivate,
  });

  useEffect(() => {
    clearPendingCanvasPlacementRef.current = canvasInteractions.clearPendingCanvasPlacement;
    clearTransientEditorStateRef.current = canvasInteractions.clearTransientEditorState;
  }, [
    canvasInteractions.clearPendingCanvasPlacement,
    canvasInteractions.clearTransientEditorState,
    clearPendingCanvasPlacementRef,
    clearTransientEditorStateRef,
  ]);

  useMoleculeEditorShortcuts({
    isImportModalOpen,
    isSaveModalOpen,
    isTextEditingElement,
    onRedo,
    onUndo,
  });

  return {
    ...editorActions,
    ...canvasInteractions,
  };
}
