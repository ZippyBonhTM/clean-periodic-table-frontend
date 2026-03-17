'use client';

import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import useEditorHistory from '@/components/organisms/molecular-editor/useEditorHistory';
import useMoleculeEditorDerivedState from '@/components/organisms/molecular-editor/useMoleculeEditorDerivedState';
import useMoleculeGalleryFeedback from '@/components/organisms/molecular-editor/useMoleculeGalleryFeedback';
import useMoleculeEditorSnapshotActions from '@/components/organisms/molecular-editor/useMoleculeEditorSnapshotActions';
import type { SavedMolecule } from '@/shared/types/molecule';
import type { ChemicalElement } from '@/shared/types/element';
import {
  type BondOrder,
  type MoleculeModel,
} from '@/shared/utils/moleculeEditor';
import {
  cloneEditorSnapshot,
  type CanvasViewport,
  type EditorViewMode,
  type SavedEditorDraft,
} from '@/components/organisms/molecular-editor/moleculeEditorSession';

const EDITOR_HISTORY_LIMIT = 80;

type UseMoleculeEditorSessionOptions = {
  activeElement: ChemicalElement | null;
  activeView: EditorViewMode;
  bondOrder: BondOrder;
  canvasViewport: CanvasViewport;
  clearTransientEditorStateRef: MutableRefObject<() => void>;
  focusedComponentIndex: number;
  molecule: MoleculeModel;
  moleculeEducationalDescription: string;
  moleculeName: string;
  nomenclatureFallback: string | null;
  savedMolecules: SavedMolecule[];
  selectedAtomId: string | null;
  setActiveView: Dispatch<SetStateAction<EditorViewMode>>;
  setBondOrder: Dispatch<SetStateAction<BondOrder>>;
  setCanvasViewport: Dispatch<SetStateAction<CanvasViewport>>;
  setEditorNotice: Dispatch<SetStateAction<string | null>>;
  setFocusedComponentIndex: Dispatch<SetStateAction<number>>;
  setMolecule: Dispatch<SetStateAction<MoleculeModel>>;
  setNomenclatureFallback: Dispatch<SetStateAction<string | null>>;
  setSelectedAtomId: Dispatch<SetStateAction<string | null>>;
};

export default function useMoleculeEditorSession({
  activeElement,
  activeView,
  bondOrder,
  canvasViewport,
  clearTransientEditorStateRef,
  focusedComponentIndex,
  molecule,
  moleculeEducationalDescription,
  moleculeName,
  nomenclatureFallback,
  savedMolecules,
  selectedAtomId,
  setActiveView,
  setBondOrder,
  setCanvasViewport,
  setEditorNotice,
  setFocusedComponentIndex,
  setMolecule,
  setNomenclatureFallback,
  setSelectedAtomId,
}: UseMoleculeEditorSessionOptions) {
  const {
    activeElementMaxBondSlots,
    compositionRows,
    focusedSummary,
    formula,
    formulaDisplayValue,
    formulaStatsRows,
    moleculeComponents,
    normalizedSavedMolecules,
    resolvedFocusedComponentIndex,
    summary,
    systematicNameDisplayValue,
  } = useMoleculeEditorDerivedState({
    activeElement,
    focusedComponentIndex,
    molecule,
    nomenclatureFallback,
    savedMolecules,
    selectedAtomId,
  });
  const { galleryFeedback, showGalleryFeedback } = useMoleculeGalleryFeedback();

  const {
    applyEditorSnapshot,
    buildEditorSnapshot,
    buildHistorySnapshot,
    buildSaveMoleculeInput,
  } = useMoleculeEditorSnapshotActions({
    activeView,
    bondOrder,
    canvasViewport,
    clearTransientEditorStateRef,
    molecule,
    moleculeEducationalDescription,
    moleculeName,
    nomenclatureFallback,
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

  const { canRedo, canUndo, clearHistory, onRedo, onUndo, pushHistorySnapshot } = useEditorHistory<SavedEditorDraft>({
    limit: EDITOR_HISTORY_LIMIT,
    cloneSnapshot: cloneEditorSnapshot,
    buildCurrentSnapshot: buildHistorySnapshot,
    applySnapshot: applyEditorSnapshot,
  });

  return {
    activeElementMaxBondSlots,
    applyEditorSnapshot,
    buildEditorSnapshot,
    buildHistorySnapshot,
    buildSaveMoleculeInput,
    canRedo,
    canUndo,
    clearHistory,
    compositionRows,
    focusedSummary,
    formula,
    formulaDisplayValue,
    formulaStatsRows,
    galleryFeedback,
    moleculeComponents,
    normalizedSavedMolecules,
    onRedo,
    onUndo,
    pushHistorySnapshot,
    resolvedFocusedComponentIndex,
    showGalleryFeedback,
    summary,
    systematicNameDisplayValue,
  };
}
