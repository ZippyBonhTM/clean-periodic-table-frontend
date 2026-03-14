'use client';

import { useCallback } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import useEditorHistory from '@/components/organisms/molecular-editor/useEditorHistory';
import useMoleculeEditorDerivedState from '@/components/organisms/molecular-editor/useMoleculeEditorDerivedState';
import useMoleculeGalleryFeedback from '@/components/organisms/molecular-editor/useMoleculeGalleryFeedback';
import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';
import type { ChemicalElement } from '@/shared/types/element';
import {
  normalizeMoleculeModel,
  syncMoleculeIdCounter,
  type BondOrder,
  type MoleculeModel,
} from '@/shared/utils/moleculeEditor';

import {
  cloneEditorSnapshot,
  cloneMoleculeModel,
  type CanvasViewport,
  type EditorViewMode,
  normalizeOptionalText,
  normalizeSnapshotSelectedAtomId,
  resolveDefaultFocusedComponentIndex,
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

  const buildEditorSnapshot = useCallback(
    (
      overrides?: Partial<SavedEditorDraft>,
    ): SavedEditorDraft => {
      const snapshot: SavedEditorDraft = {
        molecule: cloneMoleculeModel(overrides?.molecule ?? molecule),
        selectedAtomId: normalizeSnapshotSelectedAtomId(
          overrides?.molecule ?? molecule,
          overrides?.selectedAtomId ?? selectedAtomId,
        ),
        nomenclatureFallback: overrides?.nomenclatureFallback ?? nomenclatureFallback,
        activeView: overrides?.activeView ?? activeView,
        bondOrder: overrides?.bondOrder ?? bondOrder,
        canvasViewport: {
          offsetX: overrides?.canvasViewport?.offsetX ?? canvasViewport.offsetX,
          offsetY: overrides?.canvasViewport?.offsetY ?? canvasViewport.offsetY,
          scale: overrides?.canvasViewport?.scale ?? canvasViewport.scale,
        },
      };

      return snapshot;
    },
    [
      activeView,
      bondOrder,
      canvasViewport.offsetX,
      canvasViewport.offsetY,
      canvasViewport.scale,
      molecule,
      nomenclatureFallback,
      selectedAtomId,
    ],
  );

  const buildHistorySnapshot = useCallback((): SavedEditorDraft => {
    return buildEditorSnapshot({
      selectedAtomId: null,
    });
  }, [buildEditorSnapshot]);

  const applyEditorSnapshot = useCallback(
    (snapshot: SavedEditorDraft, notice: string) => {
      const nextSnapshot = cloneEditorSnapshot(snapshot);
      const nextMolecule = nextSnapshot.molecule;
      const nextSelectedAtomId = normalizeSnapshotSelectedAtomId(nextMolecule, nextSnapshot.selectedAtomId);
      clearTransientEditorStateRef.current();
      setMolecule(nextMolecule);
      setSelectedAtomId(nextSelectedAtomId);
      setNomenclatureFallback(nextSnapshot.nomenclatureFallback);
      setFocusedComponentIndex(resolveDefaultFocusedComponentIndex(nextMolecule, nextSelectedAtomId));
      setActiveView(nextSnapshot.activeView);
      setBondOrder(nextSnapshot.bondOrder);
      setCanvasViewport(nextSnapshot.canvasViewport);
      setEditorNotice(notice);
    },
    [
      clearTransientEditorStateRef,
      setActiveView,
      setBondOrder,
      setCanvasViewport,
      setEditorNotice,
      setFocusedComponentIndex,
      setMolecule,
      setNomenclatureFallback,
      setSelectedAtomId,
    ],
  );

  const { canRedo, canUndo, clearHistory, onRedo, onUndo, pushHistorySnapshot } = useEditorHistory<SavedEditorDraft>({
    limit: EDITOR_HISTORY_LIMIT,
    cloneSnapshot: cloneEditorSnapshot,
    buildCurrentSnapshot: buildHistorySnapshot,
    applySnapshot: applyEditorSnapshot,
  });

  const buildSaveMoleculeInput = useCallback((): SaveMoleculeInput => {
    const snapshot = buildEditorSnapshot();
    const normalized = normalizeMoleculeModel(snapshot.molecule);
    const normalizedModel = normalized.model;
    const normalizedSelectedAtomId =
      snapshot.selectedAtomId === null ? null : normalized.atomIdsByOriginalId.get(snapshot.selectedAtomId)?.[0] ?? null;

    syncMoleculeIdCounter(normalizedModel);

    return {
      name: normalizeOptionalText(moleculeName),
      educationalDescription: normalizeOptionalText(moleculeEducationalDescription),
      molecule: normalizedModel,
      editorState: {
        selectedAtomId: normalizeSnapshotSelectedAtomId(normalizedModel, normalizedSelectedAtomId),
        activeView: snapshot.activeView,
        bondOrder: snapshot.bondOrder,
        canvasViewport: {
          offsetX: snapshot.canvasViewport.offsetX,
          offsetY: snapshot.canvasViewport.offsetY,
          scale: snapshot.canvasViewport.scale,
        },
      },
    };
  }, [buildEditorSnapshot, moleculeEducationalDescription, moleculeName]);

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
