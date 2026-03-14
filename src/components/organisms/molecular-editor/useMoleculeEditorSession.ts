'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';

import useEditorHistory from '@/components/organisms/molecular-editor/useEditorHistory';
import type { SaveMoleculeInput, SavedMolecule } from '@/shared/types/molecule';
import type { ChemicalElement } from '@/shared/types/element';
import {
  buildCompositionRows,
  buildMolecularFormula,
  buildSystematicMoleculeName,
  normalizeMoleculeModel,
  resolveMaxBondSlots,
  resolveMoleculeComponents,
  summarizeMolecule,
  syncMoleculeIdCounter,
  type BondOrder,
  type MoleculeModel,
} from '@/shared/utils/moleculeEditor';

import {
  cloneEditorSnapshot,
  cloneMoleculeModel,
  type CanvasViewport,
  type EditorViewMode,
  type GalleryFeedback,
  type GalleryFeedbackTone,
  normalizeOptionalText,
  normalizeSavedMoleculeRecord,
  normalizeSnapshotSelectedAtomId,
  resolveDefaultFocusedComponentIndex,
  resolveMoleculeComponentIndexByAtomId,
  type SavedEditorDraft,
} from '@/components/organisms/molecular-editor/moleculeEditorSession';

const GALLERY_FEEDBACK_AUTO_HIDE_MS = 4200;
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
  const [galleryFeedback, setGalleryFeedback] = useState<GalleryFeedback | null>(null);
  const galleryFeedbackTimeoutRef = useRef<number | null>(null);

  const activeElementMaxBondSlots = activeElement === null ? null : resolveMaxBondSlots(activeElement);
  const summary = useMemo(() => summarizeMolecule(molecule), [molecule]);
  const formula = useMemo(() => buildMolecularFormula(molecule), [molecule]);
  const moleculeComponents = useMemo(() => resolveMoleculeComponents(molecule), [molecule]);
  const selectedComponentIndex = useMemo(
    () => resolveMoleculeComponentIndexByAtomId(moleculeComponents, selectedAtomId),
    [moleculeComponents, selectedAtomId],
  );
  const resolvedFocusedComponentIndex =
    moleculeComponents.length === 0
      ? 0
      : selectedComponentIndex ?? Math.min(Math.max(focusedComponentIndex, 0), moleculeComponents.length - 1);
  const focusedComponent = moleculeComponents[resolvedFocusedComponentIndex] ?? null;
  const focusedComponentModel = focusedComponent?.model ?? molecule;
  const focusedSummary = useMemo(() => summarizeMolecule(focusedComponentModel), [focusedComponentModel]);
  const focusedFormula = useMemo(() => buildMolecularFormula(focusedComponentModel), [focusedComponentModel]);
  const focusedSystematicName = useMemo(
    () => buildSystematicMoleculeName(focusedComponentModel),
    [focusedComponentModel],
  );
  const resolvedNomenclatureValue =
    focusedSystematicName ??
    (moleculeComponents.length === 1 && nomenclatureFallback !== null
      ? normalizeOptionalText(nomenclatureFallback)
      : null);
  const formulaDisplayValue = focusedSummary.atomCount === 0 ? 'N/A' : focusedFormula;
  const systematicNameDisplayValue =
    focusedSummary.atomCount === 0 ? 'N/A' : (resolvedNomenclatureValue ?? 'Unavailable');
  const compactSystematicNameDisplayValue =
    systematicNameDisplayValue === 'Unavailable' ? 'Unavail.' : systematicNameDisplayValue;
  const formulaStatsRows = useMemo(
    () => {
      const baseRows = [
        {
          label: 'Nomen.',
          compactLabel: 'Nomen.',
          title: 'Nomenclature',
          value: systematicNameDisplayValue,
          compactValue: compactSystematicNameDisplayValue,
        },
        {
          label: 'Formula',
          compactLabel: 'Formula',
          value: formulaDisplayValue,
        },
        {
          label: 'Atoms',
          compactLabel: 'Atoms',
          value: String(focusedSummary.atomCount),
        },
        {
          label: 'Bonds',
          compactLabel: 'Bonds',
          value: String(focusedSummary.bondCount),
        },
        {
          label: 'Slots',
          compactLabel: 'Slots',
          value: String(focusedSummary.totalBondOrder),
        },
      ];

      if (moleculeComponents.length <= 1) {
        return baseRows;
      }

      return [
        {
          label: 'Comp.',
          compactLabel: 'Comp.',
          title: 'Component',
          value: `Mol ${resolvedFocusedComponentIndex + 1} / ${moleculeComponents.length}`,
          compactValue: `${resolvedFocusedComponentIndex + 1}/${moleculeComponents.length}`,
        },
        ...baseRows,
      ];
    },
    [
      compactSystematicNameDisplayValue,
      formulaDisplayValue,
      focusedSummary.atomCount,
      focusedSummary.bondCount,
      focusedSummary.totalBondOrder,
      moleculeComponents.length,
      resolvedFocusedComponentIndex,
      systematicNameDisplayValue,
    ],
  );
  const compositionRows = useMemo(() => buildCompositionRows(focusedComponentModel), [focusedComponentModel]);
  const normalizedSavedMolecules = useMemo(
    () => savedMolecules.map((entry) => normalizeSavedMoleculeRecord(entry)),
    [savedMolecules],
  );

  const clearGalleryFeedbackTimeout = useCallback(() => {
    if (galleryFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(galleryFeedbackTimeoutRef.current);
      galleryFeedbackTimeoutRef.current = null;
    }
  }, []);

  const showGalleryFeedback = useCallback(
    (
      tone: GalleryFeedbackTone,
      message: string,
      options?: {
        persist?: boolean;
      },
    ) => {
      clearGalleryFeedbackTimeout();
      setGalleryFeedback({ tone, message });

      if (options?.persist === true) {
        return;
      }

      galleryFeedbackTimeoutRef.current = window.setTimeout(() => {
        setGalleryFeedback((current) => (current?.message === message ? null : current));
        galleryFeedbackTimeoutRef.current = null;
      }, GALLERY_FEEDBACK_AUTO_HIDE_MS);
    },
    [clearGalleryFeedbackTimeout],
  );

  useEffect(() => {
    return () => {
      clearGalleryFeedbackTimeout();
    };
  }, [clearGalleryFeedbackTimeout]);

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
