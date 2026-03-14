'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import MoleculeComponentFocusRail from '@/components/organisms/molecular-editor/MoleculeComponentFocusRail';
import MoleculeEditorCanvasPanel from '@/components/organisms/molecular-editor/MoleculeEditorCanvasPanel';
import MoleculeGallerySection from '@/components/organisms/molecular-editor/MoleculeGallerySection';
import MoleculeImportModal from '@/components/organisms/molecular-editor/MoleculeImportModal';
import MoleculeSaveModal from '@/components/organisms/molecular-editor/MoleculeSaveModal';
import MoleculeEditorTopBar from '@/components/organisms/molecular-editor/MoleculeEditorTopBar';
import useMoleculeEditorLayout from '@/components/organisms/molecular-editor/useMoleculeEditorLayout';
import {
  preserveViewportAcrossModelChange,
  resolveInteractiveViewBox,
  resolveNextStandalonePoint,
  resolveScaledViewBoxMetrics,
  resolveViewBox,
} from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import useCanvasInteractions from '@/components/organisms/molecular-editor/useCanvasInteractions';
import useEditorHistory from '@/components/organisms/molecular-editor/useEditorHistory';
import useMoleculePaletteController from '@/components/organisms/molecular-editor/useMoleculePaletteController';
import useSavedMoleculeWorkflow from '@/components/organisms/molecular-editor/useSavedMoleculeWorkflow';
import type { ResolvedImportedPubChemCompound } from '@/shared/api/pubchemApi';
import type {
  SaveMoleculeInput,
  SavedMolecule,
  SavedMoleculeEditorState,
} from '@/shared/types/molecule';
import type { ChemicalElement } from '@/shared/types/element';
import {
  addAttachedAtom,
  addStandaloneAtom,
  buildCompositionRows,
  dedupeBondConnections,
  buildMolecularFormula,
  buildSystematicMoleculeName,
  connectAtoms,
  normalizeMoleculeModel,
  rebalanceMoleculeLayout,
  removeAtom,
  resolveMoleculeComponents,
  resolveMaxBondSlots,
  resolvePrimaryMoleculeComponentIndex,
  summarizeMolecule,
  syncMoleculeIdCounter,
  type MoleculeComponent,
  type BondOrder,
  type MoleculeModel,
} from '@/shared/utils/moleculeEditor';

type MolecularEditorProps = {
  pageMode: 'editor' | 'gallery';
  elements: ChemicalElement[];
  savedMolecules: SavedMolecule[];
  savedMoleculesError: string | null;
  isSavedMoleculesLoading: boolean;
  isSavedMoleculesMutating: boolean;
  onReloadSavedMolecules: () => void;
  onCreateSavedMolecule: (input: SaveMoleculeInput) => Promise<SavedMolecule>;
  onUpdateSavedMolecule: (moleculeId: string, input: SaveMoleculeInput) => Promise<SavedMolecule>;
  onDeleteSavedMolecule: (moleculeId: string) => Promise<void>;
};

type EditorViewMode = SavedMoleculeEditorState['activeView'];

type CanvasViewport = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

type SavedEditorDraft = {
  molecule: MoleculeModel;
  selectedAtomId: string | null;
  nomenclatureFallback: string | null;
  activeView: EditorViewMode;
  bondOrder: BondOrder;
  canvasViewport: CanvasViewport;
};

type GalleryFeedbackTone = 'info' | 'success' | 'error';

type GalleryFeedback = {
  tone: GalleryFeedbackTone;
  message: string;
};

const VIEW_OPTIONS: Array<{ mode: EditorViewMode; label: string }> = [
  { mode: 'editor', label: 'Editor' },
  { mode: 'structural', label: 'Structural' },
  { mode: 'simplified', label: 'Simplified' },
  { mode: 'stick', label: 'Stick' },
];

const BOND_ORDER_OPTIONS: Array<{ order: BondOrder; label: string }> = [
  { order: 1, label: 'Single' },
  { order: 2, label: 'Double' },
  { order: 3, label: 'Triple' },
];

const DEFAULT_EDITOR_NOTICE = 'Select an element, then double-click or double-tap the canvas to place it.';

const EMPTY_MOLECULE: MoleculeModel = {
  atoms: [],
  bonds: [],
};

const DEFAULT_CANVAS_VIEWPORT: CanvasViewport = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

const CANVAS_ZOOM_MIN = 0.5;
const CANVAS_ZOOM_MAX = 3;
const CANVAS_ZOOM_STEP = 1.15;
const EDITOR_HISTORY_LIMIT = 80;
const GALLERY_FEEDBACK_AUTO_HIDE_MS = 4200;

function cloneMoleculeModel(model: MoleculeModel): MoleculeModel {
  return dedupeBondConnections({
    atoms: model.atoms.map((atom) => ({ ...atom })),
    bonds: model.bonds.map((bond) => ({ ...bond })),
  });
}

function normalizeSnapshotSelectedAtomId(model: MoleculeModel, selectedAtomId: string | null): string | null {
  return selectedAtomId !== null && model.atoms.some((atom) => atom.id === selectedAtomId) ? selectedAtomId : null;
}

function cloneEditorSnapshot(snapshot: SavedEditorDraft): SavedEditorDraft {
  return {
    molecule: cloneMoleculeModel(snapshot.molecule),
    selectedAtomId: normalizeSnapshotSelectedAtomId(snapshot.molecule, snapshot.selectedAtomId),
    nomenclatureFallback: snapshot.nomenclatureFallback,
    activeView: snapshot.activeView,
    bondOrder: snapshot.bondOrder,
    canvasViewport: {
      offsetX: snapshot.canvasViewport.offsetX,
      offsetY: snapshot.canvasViewport.offsetY,
      scale: snapshot.canvasViewport.scale,
    },
  };
}

function normalizeSavedMoleculeRecord(savedMolecule: SavedMolecule): SavedMolecule {
  const normalized = normalizeMoleculeModel(savedMolecule.molecule);
  const normalizedModel = normalized.model;
  const components = resolveMoleculeComponents(normalizedModel);
  const primaryComponent = components[resolvePrimaryMoleculeComponentIndex(components)]?.model ?? normalizedModel;
  const selectedAtomId =
    savedMolecule.editorState.selectedAtomId === null
      ? null
      : normalized.atomIdsByOriginalId.get(savedMolecule.editorState.selectedAtomId)?.[0] ?? null;
  const normalizedSummary = summarizeMolecule(normalizedModel);
  const systematicName = buildSystematicMoleculeName(primaryComponent);

  return {
    ...savedMolecule,
    molecule: normalizedModel,
    editorState: {
      ...savedMolecule.editorState,
      selectedAtomId,
    },
    summary: {
      systematicName,
      componentCount: components.length,
      formula: buildMolecularFormula(normalizedModel),
      atomCount: normalizedSummary.atomCount,
      bondCount: normalizedSummary.bondCount,
      totalBondOrder: normalizedSummary.totalBondOrder,
      composition: buildCompositionRows(normalizedModel),
    },
  };
}

function resolveMoleculeComponentIndexByAtomId(
  components: MoleculeComponent[],
  atomId: string | null,
): number | null {
  if (atomId === null) {
    return null;
  }

  const componentIndex = components.findIndex((component) => component.atomIds.includes(atomId));
  return componentIndex === -1 ? null : componentIndex;
}

function resolveDefaultFocusedComponentIndex(
  model: MoleculeModel,
  selectedAtomId: string | null,
): number {
  const components = resolveMoleculeComponents(model);
  const selectedComponentIndex = resolveMoleculeComponentIndexByAtomId(components, selectedAtomId);

  if (selectedComponentIndex !== null) {
    return selectedComponentIndex;
  }

  return resolvePrimaryMoleculeComponentIndex(components);
}

function isTextEditingElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable ||
    target.closest('[contenteditable="true"]') !== null
  );
}

function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;

  return {
    x: viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.width,
    y: viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.height,
  };
}

function toSvgDelta(
  svg: SVGSVGElement,
  viewBox: { width: number; height: number },
  deltaClientX: number,
  deltaClientY: number,
) {
  const rect = svg.getBoundingClientRect();

  return {
    x: (deltaClientX / rect.width) * viewBox.width,
    y: (deltaClientY / rect.height) * viewBox.height,
  };
}

function clampCanvasScale(scale: number): number {
  return Math.min(CANVAS_ZOOM_MAX, Math.max(CANVAS_ZOOM_MIN, scale));
}

function resolveViewportCenter(
  model: MoleculeModel,
  viewport: CanvasViewport,
  frameAspectRatio?: number,
) {
  const viewBox = resolveInteractiveViewBox(model, viewport, frameAspectRatio);

  return {
    x: viewBox.x + viewBox.width / 2,
    y: viewBox.y + viewBox.height / 2,
  };
}

function zoomCanvasViewport(
  model: MoleculeModel,
  currentViewport: CanvasViewport,
  nextScale: number,
  anchorPoint: { x: number; y: number },
  frameAspectRatio?: number,
): CanvasViewport {
  const safeScale = clampCanvasScale(nextScale);
  const baseViewBox = resolveViewBox(model);
  const currentViewBox = resolveInteractiveViewBox(model, currentViewport, frameAspectRatio);
  const ratioX =
    currentViewBox.width === 0 ? 0.5 : (anchorPoint.x - currentViewBox.x) / currentViewBox.width;
  const ratioY =
    currentViewBox.height === 0 ? 0.5 : (anchorPoint.y - currentViewBox.y) / currentViewBox.height;
  const nextWidth = baseViewBox.width / safeScale;
  const nextHeight = baseViewBox.height / safeScale;
  const nextX = anchorPoint.x - ratioX * nextWidth;
  const nextY = anchorPoint.y - ratioY * nextHeight;
  const baseCenterX = baseViewBox.x + baseViewBox.width / 2;
  const baseCenterY = baseViewBox.y + baseViewBox.height / 2;

  return {
    offsetX: nextX + nextWidth / 2 - baseCenterX,
    offsetY: nextY + nextHeight / 2 - baseCenterY,
    scale: safeScale,
  };
}

function normalizeOptionalText(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function MolecularEditor({
  pageMode,
  elements,
  savedMolecules,
  savedMoleculesError,
  isSavedMoleculesLoading,
  isSavedMoleculesMutating,
  onReloadSavedMolecules,
  onCreateSavedMolecule,
  onUpdateSavedMolecule,
  onDeleteSavedMolecule,
}: MolecularEditorProps) {
  const [molecule, setMolecule] = useState<MoleculeModel>(EMPTY_MOLECULE);
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<EditorViewMode>('editor');
  const [bondOrder, setBondOrder] = useState<BondOrder>(1);
  const [isToolRailCollapsed, setIsToolRailCollapsed] = useState(true);
  const [isFormulaPanelOpen, setIsFormulaPanelOpen] = useState(false);
  const [editorNotice, setEditorNotice] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFloatingSaveShortcutExpanded, setIsFloatingSaveShortcutExpanded] = useState(false);
  const [activeSavedMoleculeId, setActiveSavedMoleculeId] = useState<string | null>(null);
  const [focusedComponentIndex, setFocusedComponentIndex] = useState(0);
  const [nomenclatureFallback, setNomenclatureFallback] = useState<string | null>(null);
  const [moleculeName, setMoleculeName] = useState('');
  const [moleculeEducationalDescription, setMoleculeEducationalDescription] = useState('');
  const [galleryFeedback, setGalleryFeedback] = useState<GalleryFeedback | null>(null);
  const [canvasViewport, setCanvasViewport] = useState<CanvasViewport>(DEFAULT_CANVAS_VIEWPORT);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const galleryFeedbackTimeoutRef = useRef<number | null>(null);

  const {
    activeElement,
    filteredElements,
    goToNextPaletteElement,
    goToPreviousPaletteElement,
    hasActivePaletteFilter,
    isPaletteMoving,
    isPalettePointerActive,
    isPaletteSearchOpen,
    onClearPaletteSearch,
    onClosePaletteSearch,
    onPaletteItemRef,
    onPalettePointerCancel,
    onPalettePointerDown,
    onPalettePointerMove,
    onPalettePointerUp,
    onPaletteScroll,
    onPaletteSearchChange,
    onTogglePaletteSearch,
    paletteEdgePadding,
    paletteQuery,
    paletteSearchRailRef,
    paletteViewportRef,
    resolvedCenterPaletteIndex,
    resolvedExpandedPaletteIndex,
    searchInputRef,
  } = useMoleculePaletteController({ elements });

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
  const compactSystematicNameDisplayValue = systematicNameDisplayValue === 'Unavailable' ? 'Unavail.' : systematicNameDisplayValue;
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

  const {
    clearPendingCanvasPlacement,
    clearTransientEditorState,
    onAtomPointerDown,
    onCanvasPointerCancel,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
  } = useCanvasInteractions({
    activeView,
    canvasViewport,
    molecule,
    selectedAtomId,
    setCanvasViewport,
    setEditorNotice,
    setSelectedAtomId,
    svgRef,
    onCanvasPlacement: handleCanvasPlacement,
    onAtomActivate: handleAtomActivate,
  });

  const applyEditorSnapshot = useCallback(
    (snapshot: SavedEditorDraft, notice: string) => {
      const nextSnapshot = cloneEditorSnapshot(snapshot);
      const nextMolecule = dedupeBondConnections(nextSnapshot.molecule);
      const nextSelectedAtomId = normalizeSnapshotSelectedAtomId(nextMolecule, nextSnapshot.selectedAtomId);
      clearTransientEditorState();
      setMolecule(nextMolecule);
      setSelectedAtomId(nextSelectedAtomId);
      setNomenclatureFallback(nextSnapshot.nomenclatureFallback);
      setFocusedComponentIndex(resolveDefaultFocusedComponentIndex(nextMolecule, nextSelectedAtomId));
      setActiveView(nextSnapshot.activeView);
      setBondOrder(nextSnapshot.bondOrder);
      setCanvasViewport(nextSnapshot.canvasViewport);
      setEditorNotice(notice);
    },
    [clearTransientEditorState],
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

  const applySavedMolecule = useCallback(
    (savedMolecule: SavedMolecule, notice: string) => {
      const normalizedSavedMolecule = normalizeSavedMoleculeRecord(savedMolecule);

      syncMoleculeIdCounter(normalizedSavedMolecule.molecule);
      applyEditorSnapshot(
        {
          molecule: cloneMoleculeModel(normalizedSavedMolecule.molecule),
          selectedAtomId: normalizedSavedMolecule.editorState.selectedAtomId,
          nomenclatureFallback: null,
          activeView: normalizedSavedMolecule.editorState.activeView,
          bondOrder: normalizedSavedMolecule.editorState.bondOrder,
          canvasViewport: {
            offsetX: normalizedSavedMolecule.editorState.canvasViewport.offsetX,
            offsetY: normalizedSavedMolecule.editorState.canvasViewport.offsetY,
            scale: normalizedSavedMolecule.editorState.canvasViewport.scale,
          },
        },
        notice,
      );
      clearHistory();
      setActiveSavedMoleculeId(normalizedSavedMolecule.id);
      setNomenclatureFallback(null);
      setMoleculeName(normalizedSavedMolecule.name ?? '');
      setMoleculeEducationalDescription(normalizedSavedMolecule.educationalDescription ?? '');
    },
    [applyEditorSnapshot, clearHistory],
  );

  const {
    activeSavedMolecule,
    hasCheckedPendingSavedMolecule,
    hasPendingSavedMolecule,
    isSaveModalOpen,
    onCloseSaveModal,
    onDeleteCurrentSavedMolecule,
    onDeleteCurrentSavedMoleculeFromGallery,
    onDetachSavedMolecule,
    onLoadSavedMolecule,
    onOpenCurrentSavedMoleculeInEditor,
    onOpenGalleryEditModal,
    onOpenSaveModal,
    onSaveAsNewMolecule,
    onUpdateCurrentSavedMolecule,
    resolvedActiveSavedMoleculeId,
  } = useSavedMoleculeWorkflow({
    activeSavedMoleculeId,
    applySavedMolecule,
    buildSaveMoleculeInput,
    closeImportModal: () => setIsImportModalOpen(false),
    collapseFloatingSaveShortcut: () => setIsFloatingSaveShortcutExpanded(false),
    isSavedMoleculesLoading,
    normalizedSavedMolecules,
    onCreateSavedMolecule,
    onDeleteSavedMolecule,
    onUpdateSavedMolecule,
    pageMode,
    setActiveSavedMoleculeId,
    setMoleculeEducationalDescription,
    setMoleculeName,
    showGalleryFeedback,
    summaryAtomCount: summary.atomCount,
  });

  const resolvedEditorNotice =
    editorNotice ??
    (hasCheckedPendingSavedMolecule &&
    !hasPendingSavedMolecule &&
    summary.atomCount === 0 &&
    selectedAtomId === null
      ? DEFAULT_EDITOR_NOTICE
      : null);
  const {
    bottomNoticeRef,
    canvasFrameAspectRatio,
    canvasFrameClassName,
    canvasFrameRef,
    canvasFrameSize,
    canvasPanelClassName,
    canvasPanelStyle,
    collapsedToolRailSectionClassName,
    compactBottomNoticeClassName,
    compactBottomOverlayClassName,
    compactDisplayedEditorNotice,
    editorSectionStyle,
    effectiveToolRailCollapsed,
    expandedToolRailSectionClassName,
    floatingSaveShortcutInnerStyle,
    floatingSaveShortcutPanelStyle,
    floatingSaveShortcutTriggerStyle,
    formulaPanelStyle,
    importButtonClassName,
    isLandscapeCompactCanvas,
    isSimplifiedView,
    paletteRowClassName,
    paletteSearchButtonClassName,
    paletteSearchInnerStyle,
    paletteSearchPanelStyle,
    paletteSearchRailStyle,
    paletteSearchShellClassName,
    paletteSearchTriggerStyle,
    paletteViewportWrapperClassName,
    responsiveLayoutWidth,
    showExpandedToolRailContent,
    simplifiedViewStyle,
    toolRailBodyClassName,
    toolRailCollapsedWidthClassName,
    toolRailExpandedWidthClassName,
    toolRailStyle,
    topControlsBlockClassName,
    topControlsLeadingGroupClassName,
    topControlsRef,
    topControlsRowClassName,
    topOverlayClassName,
    topOverlayRef,
    viewModeButtonClassName,
    viewModeTabsClassName,
    zoomControlsClassName,
    zoomControlsVisibilityClassName,
  } = useMoleculeEditorLayout({
    activeView,
    componentCount: moleculeComponents.length,
    isFloatingSaveShortcutExpanded,
    isFormulaPanelOpen,
    isPaletteSearchOpen,
    isToolRailCollapsed,
    pageMode,
    paletteSearchRailRef,
    resolvedEditorNotice,
  });
  const interactiveViewBox = useMemo(
    () => resolveInteractiveViewBox(molecule, canvasViewport, canvasFrameAspectRatio),
    [canvasFrameAspectRatio, canvasViewport, molecule],
  );
  const zoomPercent = Math.round(canvasViewport.scale * 100);

  const commitMoleculeChange = useCallback(
    (
      previousMolecule: MoleculeModel,
      result: {
        molecule: MoleculeModel;
        selectedAtomId: string | null;
        error?: string;
      },
      successMessage: string,
      anchorPoint?: { x: number; y: number },
    ) => {
      clearPendingCanvasPlacement();
      const nextMolecule = dedupeBondConnections(result.molecule);
      const nextSelectedAtomId = normalizeSnapshotSelectedAtomId(nextMolecule, result.selectedAtomId);
      const previousSelectedAtomId = normalizeSnapshotSelectedAtomId(molecule, selectedAtomId);
      const didMoleculeChange = nextMolecule !== previousMolecule;
      const didSelectionChange = nextSelectedAtomId !== previousSelectedAtomId;

      if (didMoleculeChange) {
        pushHistorySnapshot(buildHistorySnapshot());
      }

      if (didMoleculeChange) {
        const nextViewport = preserveViewportAcrossModelChange(
          previousMolecule,
          nextMolecule,
          canvasViewport,
          canvasFrameAspectRatio,
          anchorPoint,
        );

        setCanvasViewport(nextViewport);
        setMolecule(nextMolecule);
        setNomenclatureFallback(null);
      }

      if (didMoleculeChange || didSelectionChange) {
        setSelectedAtomId(nextSelectedAtomId);
      }
      setEditorNotice(result.error ?? successMessage);
    },
    [buildHistorySnapshot, canvasFrameAspectRatio, canvasViewport, clearPendingCanvasPlacement, molecule, pushHistorySnapshot, selectedAtomId],
  );

  const onAddSelectedElement = useCallback(() => {
    if (activeElement === null) {
      setEditorNotice('No element matches the current search.');
      return;
    }

    if (molecule.atoms.length === 0 || selectedAtomId === null) {
      const nextPoint = resolveNextStandalonePoint(molecule);
      const result = addStandaloneAtom(molecule, activeElement, nextPoint);
      commitMoleculeChange(molecule, result, `${activeElement.symbol} added to the canvas.`, nextPoint);
      return;
    }

    const result = addAttachedAtom(molecule, selectedAtomId, activeElement, bondOrder);
    commitMoleculeChange(molecule, result, `${activeElement.symbol} attached with a bond order of ${bondOrder}.`);
  }, [activeElement, bondOrder, commitMoleculeChange, molecule, selectedAtomId]);

  function handleCanvasPlacement(point: { x: number; y: number }) {
    if (activeView !== 'editor') {
      return;
    }

    if (activeElement === null) {
      setEditorNotice('Choose an element before placing atoms.');
      return;
    }

    if (selectedAtomId === null) {
      const result = addStandaloneAtom(molecule, activeElement, point);
      commitMoleculeChange(molecule, result, `${activeElement.symbol} placed on the canvas.`, point);
      return;
    }

    const result = addAttachedAtom(molecule, selectedAtomId, activeElement, bondOrder);
    commitMoleculeChange(molecule, result, `${activeElement.symbol} attached to the selected atom.`);
  }

  function handleAtomActivate(atomId: string) {
    clearPendingCanvasPlacement();

    if (selectedAtomId === null) {
      setSelectedAtomId(atomId);
      setEditorNotice('Atom selected. Tap another atom to create a bond, or use the tools to attach the active element.');
      return;
    }

    if (selectedAtomId === atomId) {
      setSelectedAtomId(null);
      setEditorNotice('Selection cleared.');
      return;
    }

    const result = connectAtoms(molecule, selectedAtomId, atomId, bondOrder);
    commitMoleculeChange(molecule, result, `Bond updated to order ${bondOrder}.`);
  }

  const onSetActiveView = useCallback(
    (nextView: EditorViewMode) => {
      setIsFloatingSaveShortcutExpanded(false);
      setActiveView(nextView);
    },
    [],
  );

  const onFocusComponent = useCallback(
    (componentIndex: number) => {
      const component = moleculeComponents[componentIndex];

      if (component === undefined) {
        return;
      }

      setFocusedComponentIndex(componentIndex);
      setSelectedAtomId(null);
      setEditorNotice(`Mol ${componentIndex + 1} focused.`);

      const nextViewportMetrics = resolveScaledViewBoxMetrics(
        molecule,
        canvasViewport.scale,
        canvasFrameAspectRatio,
      );

      setCanvasViewport((currentViewport) => ({
        ...currentViewport,
        offsetX: component.center.x - nextViewportMetrics.centerX,
        offsetY: component.center.y - nextViewportMetrics.centerY,
      }));
    },
    [canvasFrameAspectRatio, canvasViewport.scale, molecule, moleculeComponents],
  );

  const onSetBondOrder = useCallback(
    (nextBondOrder: BondOrder) => {
      setBondOrder(nextBondOrder);
    },
    [],
  );

  const onClearSelection = useCallback(() => {
    clearPendingCanvasPlacement();
    setSelectedAtomId(null);
    setEditorNotice('Selection cleared.');
  }, [clearPendingCanvasPlacement]);

  const onCanvasWheel = useCallback(
    (event: React.WheelEvent<SVGSVGElement>) => {
      if (activeView === 'simplified') {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        const nextScale = clampCanvasScale(
          canvasViewport.scale * (event.deltaY > 0 ? 1 / CANVAS_ZOOM_STEP : CANVAS_ZOOM_STEP),
        );

        if (nextScale === canvasViewport.scale) {
          return;
        }

        const anchorPoint = toSvgPoint(event.currentTarget, event.clientX, event.clientY);
        setCanvasViewport(
          zoomCanvasViewport(
            molecule,
            canvasViewport,
            nextScale,
            anchorPoint,
            canvasFrameSize.width > 0 && canvasFrameSize.height > 0
              ? canvasFrameSize.width / canvasFrameSize.height
              : undefined,
          ),
        );
        return;
      }

      const svg = svgRef.current;

      if (svg === null) {
        return;
      }

      const delta = toSvgDelta(svg, svg.viewBox.baseVal, event.deltaX, event.deltaY);
      setCanvasViewport((current) => ({
        ...current,
        offsetX: current.offsetX + delta.x,
        offsetY: current.offsetY + delta.y,
      }));
    },
    [activeView, canvasFrameSize.height, canvasFrameSize.width, canvasViewport, molecule],
  );

  const onRemoveSelectedAtom = useCallback(() => {
    if (selectedAtomId === null) {
      setEditorNotice('Select an atom before removing it.');
      return;
    }

    const neighborBond =
      molecule.bonds.find((bond) => bond.sourceId === selectedAtomId || bond.targetId === selectedAtomId) ?? null;
    const fallbackAnchorAtomId =
      neighborBond === null
        ? undefined
        : neighborBond.sourceId === selectedAtomId
          ? neighborBond.targetId
          : neighborBond.sourceId;
    const nextMolecule = removeAtom(molecule, selectedAtomId);
    const rebalancedMolecule =
      nextMolecule.atoms.length === 0
        ? nextMolecule
        : rebalanceMoleculeLayout(
            nextMolecule,
            fallbackAnchorAtomId !== undefined && fallbackAnchorAtomId !== selectedAtomId
              ? fallbackAnchorAtomId
              : nextMolecule.atoms[0]?.id,
          );
    const nextViewport = preserveViewportAcrossModelChange(
      molecule,
      rebalancedMolecule,
      canvasViewport,
      canvasFrameAspectRatio,
    );
    const sanitizedMolecule = dedupeBondConnections(rebalancedMolecule);

    setCanvasViewport(nextViewport);
    pushHistorySnapshot(buildHistorySnapshot());
    setMolecule(sanitizedMolecule);
    setSelectedAtomId(normalizeSnapshotSelectedAtomId(sanitizedMolecule, null));
    setEditorNotice('Selected atom removed.');
  }, [buildHistorySnapshot, canvasFrameAspectRatio, canvasViewport, molecule, pushHistorySnapshot, selectedAtomId]);

  useEffect(() => {
    if (pageMode !== 'editor') {
      return;
    }

    const handleDeleteKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') {
        return;
      }

      if (event.altKey || event.ctrlKey || event.metaKey || isSaveModalOpen || isImportModalOpen) {
        return;
      }

      if (isTextEditingElement(event.target) || selectedAtomId === null) {
        return;
      }

      event.preventDefault();
      onRemoveSelectedAtom();
    };

    window.addEventListener('keydown', handleDeleteKeyDown);

    return () => {
      window.removeEventListener('keydown', handleDeleteKeyDown);
    };
  }, [isImportModalOpen, isSaveModalOpen, onRemoveSelectedAtom, pageMode, selectedAtomId]);

  const onResetMolecule = useCallback(() => {
    const isAlreadyPristine =
      molecule.atoms.length === 0 &&
      selectedAtomId === null &&
      activeView === 'editor' &&
      bondOrder === 1 &&
      canvasViewport.offsetX === DEFAULT_CANVAS_VIEWPORT.offsetX &&
      canvasViewport.offsetY === DEFAULT_CANVAS_VIEWPORT.offsetY &&
      canvasViewport.scale === DEFAULT_CANVAS_VIEWPORT.scale;

    if (isAlreadyPristine) {
      setEditorNotice('Editor already reset.');
      return;
    }

    pushHistorySnapshot(buildHistorySnapshot());
    clearTransientEditorState();
    setMolecule(EMPTY_MOLECULE);
    setSelectedAtomId(null);
    setFocusedComponentIndex(0);
    setNomenclatureFallback(null);
    setActiveView('editor');
    setBondOrder(1);
    setCanvasViewport(DEFAULT_CANVAS_VIEWPORT);
    setEditorNotice('Editor reset.');
  }, [activeView, bondOrder, buildHistorySnapshot, canvasViewport.offsetX, canvasViewport.offsetY, canvasViewport.scale, clearTransientEditorState, molecule.atoms.length, pushHistorySnapshot, selectedAtomId]);

  const onOpenImportModal = useCallback(() => {
    setIsFloatingSaveShortcutExpanded(false);
    onCloseSaveModal();
    setIsImportModalOpen(true);
  }, [onCloseSaveModal]);

  const onCloseImportModal = useCallback(() => {
    setIsImportModalOpen(false);
  }, []);

  const onImportExternalMolecule = useCallback(
    async (compound: ResolvedImportedPubChemCompound) => {
      const importedMolecule = cloneMoleculeModel(compound.molecule);

      syncMoleculeIdCounter(importedMolecule);
      pushHistorySnapshot(buildHistorySnapshot());
      applyEditorSnapshot(
        {
          molecule: importedMolecule,
          selectedAtomId: null,
          nomenclatureFallback: compound.iupacName ?? null,
          activeView: 'editor',
          bondOrder: 1,
          canvasViewport: DEFAULT_CANVAS_VIEWPORT,
        },
        `${compound.title} imported from PubChem.`,
      );
      setActiveSavedMoleculeId(null);
      setNomenclatureFallback(compound.iupacName ?? null);
      setMoleculeName(compound.title);
      setMoleculeEducationalDescription('');
      setIsImportModalOpen(false);
      showGalleryFeedback(
        'info',
        compound.importMode === 'main' && compound.omittedFragmentCount > 0
          ? `${compound.title} imported from PubChem. ${compound.omittedFragmentCount} detached fragment${
              compound.omittedFragmentCount === 1 ? '' : 's'
            } omitted so the main molecule stays editable.`
          : compound.importMode === 'all' && compound.componentCount > 1
            ? `${compound.title} imported from PubChem as a ${compound.componentCount}-component work.`
          : `${compound.title} imported from PubChem. Save it to keep this draft.`,
      );
    },
    [applyEditorSnapshot, buildHistorySnapshot, pushHistorySnapshot, showGalleryFeedback],
  );

  const onZoomOut = useCallback(() => {
    const frameAspectRatio =
      canvasFrameSize.width > 0 && canvasFrameSize.height > 0
        ? canvasFrameSize.width / canvasFrameSize.height
        : undefined;
    const anchorPoint = resolveViewportCenter(molecule, canvasViewport, frameAspectRatio);

    const nextViewport = zoomCanvasViewport(
      molecule,
      canvasViewport,
      canvasViewport.scale / CANVAS_ZOOM_STEP,
      anchorPoint,
      frameAspectRatio,
    );

    setCanvasViewport(nextViewport);
  }, [canvasFrameSize.height, canvasFrameSize.width, canvasViewport, molecule]);

  const onZoomIn = useCallback(() => {
    const frameAspectRatio =
      canvasFrameSize.width > 0 && canvasFrameSize.height > 0
        ? canvasFrameSize.width / canvasFrameSize.height
        : undefined;
    const anchorPoint = resolveViewportCenter(molecule, canvasViewport, frameAspectRatio);

    const nextViewport = zoomCanvasViewport(
      molecule,
      canvasViewport,
      canvasViewport.scale * CANVAS_ZOOM_STEP,
      anchorPoint,
      frameAspectRatio,
    );

    setCanvasViewport(nextViewport);
  }, [canvasFrameSize.height, canvasFrameSize.width, canvasViewport, molecule]);

  const onResetCanvasView = useCallback(() => {
    setCanvasViewport(DEFAULT_CANVAS_VIEWPORT);
    setEditorNotice('Canvas view reset.');
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSaveModalOpen || isImportModalOpen) {
        return;
      }

      if (event.altKey || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') {
        return;
      }

      if (isTextEditingElement(event.target)) {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        onRedo();
        return;
      }

      onUndo();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isImportModalOpen, isSaveModalOpen, onRedo, onUndo]);

  const isEditorPage = pageMode === 'editor';
  const isGalleryPage = pageMode === 'gallery';
  const shouldShowToolRail = isEditorPage && activeView === 'editor';
  const shouldShowFloatingSaveShortcut = isEditorPage && activeView !== 'editor';
  const shouldShowComponentFocusRail = moleculeComponents.length > 1;
  const hasCurrentSavedSelection = resolvedActiveSavedMoleculeId !== null;
  const currentSaveLabel =
    normalizeOptionalText(moleculeName) ??
    activeSavedMolecule?.name ??
    activeSavedMolecule?.summary.formula ??
    (summary.atomCount === 0 ? 'Unsaved molecule' : formula);
  const galleryFeedbackToastLabel =
    galleryFeedback?.tone === 'error'
      ? 'Sync issue'
      : galleryFeedback?.tone === 'success'
        ? isEditorPage
          ? 'Work saved'
          : 'Gallery ready'
        : isEditorPage
          ? 'Saving'
          : 'Gallery';

  return (
    <section className="flex min-h-0 flex-col gap-3 overflow-visible pb-4" style={editorSectionStyle}>
      {isEditorPage ? (
        <>
      <div ref={topControlsRef} className={topControlsBlockClassName}>
        <MoleculeEditorTopBar
          activeView={activeView}
          importButtonClassName={importButtonClassName}
          isLandscapeCompactCanvas={isLandscapeCompactCanvas}
          isSimplifiedView={isSimplifiedView}
          onOpenImportModal={onOpenImportModal}
          onResetCanvasView={onResetCanvasView}
          onSetActiveView={onSetActiveView}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          responsiveLayoutWidth={responsiveLayoutWidth}
          topControlsLeadingGroupClassName={topControlsLeadingGroupClassName}
          topControlsRowClassName={topControlsRowClassName}
          viewModeButtonClassName={viewModeButtonClassName}
          viewModeTabsClassName={viewModeTabsClassName}
          viewOptions={VIEW_OPTIONS}
          zoomControlsClassName={zoomControlsClassName}
          zoomControlsVisibilityClassName={zoomControlsVisibilityClassName}
          zoomPercent={zoomPercent}
        />

        {shouldShowComponentFocusRail ? (
          <MoleculeComponentFocusRail
            components={moleculeComponents}
            focusedComponentIndex={resolvedFocusedComponentIndex}
            isCompact={isLandscapeCompactCanvas}
            onFocusComponent={onFocusComponent}
          />
        ) : null}
      </div>

      <MoleculeEditorCanvasPanel
        activeView={activeView}
        bottomNoticeRef={bottomNoticeRef}
        canvasFrameClassName={canvasFrameClassName}
        canvasFrameRef={canvasFrameRef}
        canvasPanelClassName={canvasPanelClassName}
        canvasPanelStyle={canvasPanelStyle}
        compactBottomNoticeClassName={compactBottomNoticeClassName}
        compactBottomOverlayClassName={compactBottomOverlayClassName}
        compactDisplayedEditorNotice={compactDisplayedEditorNotice}
        compositionRows={compositionRows}
        focusedComponentIndex={resolvedFocusedComponentIndex}
        formulaDisplayValue={formulaDisplayValue}
        formulaPanelProps={{
          isCompact: isLandscapeCompactCanvas,
          isOpen: isFormulaPanelOpen,
          rows: formulaStatsRows,
          style: formulaPanelStyle,
          onToggle: () => setIsFormulaPanelOpen((current) => !current),
        }}
        interactiveViewBox={interactiveViewBox}
        isLandscapeCompactCanvas={isLandscapeCompactCanvas}
        isPaletteSearchOpen={isPaletteSearchOpen}
        isSimplifiedView={isSimplifiedView}
        molecule={molecule}
        moleculeComponentsCount={moleculeComponents.length}
        onAtomPointerDown={onAtomPointerDown}
        onCanvasPointerCancel={onCanvasPointerCancel}
        onCanvasPointerDown={onCanvasPointerDown}
        onCanvasPointerMove={onCanvasPointerMove}
        onCanvasPointerUp={onCanvasPointerUp}
        onCanvasWheel={onCanvasWheel}
        onClearPaletteSearch={onClearPaletteSearch}
        onClosePaletteSearch={onClosePaletteSearch}
        onPaletteSearchChange={onPaletteSearchChange}
        onTogglePaletteSearch={onTogglePaletteSearch}
        paletteQuery={paletteQuery}
        paletteRailProps={{
          overlayRef: topOverlayRef,
          overlayClassName: topOverlayClassName,
          viewportRef: paletteViewportRef,
          elements: filteredElements,
          paletteEdgePadding,
          isCompact: isLandscapeCompactCanvas,
          isPaletteMoving,
          isPalettePointerActive,
          resolvedExpandedPaletteIndex,
          resolvedCenterPaletteIndex,
          wrapperClassName: paletteViewportWrapperClassName,
          rowClassName: paletteRowClassName,
          onPaletteScroll,
          onPalettePointerDown,
          onPalettePointerMove,
          onPalettePointerUp,
          onPalettePointerCancel,
          onPrevious: goToPreviousPaletteElement,
          onNext: goToNextPaletteElement,
          onItemRef: onPaletteItemRef,
        }}
        paletteSearchButtonClassName={paletteSearchButtonClassName}
        paletteSearchInnerStyle={paletteSearchInnerStyle}
        paletteSearchPanelStyle={paletteSearchPanelStyle}
        paletteSearchRailRef={paletteSearchRailRef}
        paletteSearchRailStyle={paletteSearchRailStyle}
        paletteSearchShellClassName={paletteSearchShellClassName}
        paletteSearchTriggerStyle={paletteSearchTriggerStyle}
        resolvedEditorNotice={resolvedEditorNotice}
        searchInputRef={searchInputRef}
        shouldShowActivePaletteFilter={hasActivePaletteFilter}
        simplifiedViewStyle={simplifiedViewStyle}
        svgRef={svgRef}
        toolRailProps={{
          activeElementMaxBondSlots,
          activeElementSymbol: activeElement?.symbol ?? null,
          bondOrder,
          bondOrderOptions: BOND_ORDER_OPTIONS,
          canRedo,
          canUndo,
          collapsedToolRailSectionClassName,
          effectiveToolRailCollapsed,
          expandedToolRailSectionClassName,
          floatingSaveShortcutInnerStyle,
          floatingSaveShortcutPanelStyle,
          floatingSaveShortcutTriggerStyle,
          isFloatingSaveShortcutExpanded,
          isLandscapeCompactCanvas,
          isSaveModalOpen,
          onAddSelectedElement,
          onClearSelection,
          onFloatingSaveShortcutExpandedChange: setIsFloatingSaveShortcutExpanded,
          onOpenSaveModal,
          onRedo,
          onRemoveSelectedAtom,
          onResetMolecule,
          onSetBondOrder,
          onToggleCollapsed: () => setIsToolRailCollapsed((current) => !current),
          onUndo,
          selectedAtomId,
          shouldShowFloatingSaveShortcut,
          shouldShowToolRail,
          showExpandedToolRailContent,
          summaryAtomCount: summary.atomCount,
          toolRailBodyClassName,
          toolRailCollapsedWidthClassName,
          toolRailExpandedWidthClassName,
          toolRailStyle,
        }}
      />

        </>
      ) : null}

      {isGalleryPage ? (
        <MoleculeGallerySection
          savedMolecules={normalizedSavedMolecules}
          activeSavedMoleculeId={resolvedActiveSavedMoleculeId}
          galleryFeedback={galleryFeedback}
          savedMoleculesError={savedMoleculesError}
          isSavedMoleculesLoading={isSavedMoleculesLoading}
          isSavedMoleculesMutating={isSavedMoleculesMutating}
          onOpenGalleryEditModal={onOpenGalleryEditModal}
          onOpenCurrentSavedMoleculeInEditor={onOpenCurrentSavedMoleculeInEditor}
          onDeleteCurrentSavedMoleculeFromGallery={onDeleteCurrentSavedMoleculeFromGallery}
          onReloadSavedMolecules={onReloadSavedMolecules}
          onLoadSavedMolecule={onLoadSavedMolecule}
        />
      ) : null}

      {isEditorPage ? (
        <>
          <MoleculeImportModal
            isOpen={isImportModalOpen}
            elements={elements}
            onClose={onCloseImportModal}
            onImport={onImportExternalMolecule}
          />
        </>
      ) : null}

      <MoleculeSaveModal
        context={isGalleryPage ? 'gallery' : 'editor'}
        isOpen={isSaveModalOpen}
        hasLinkedSelection={hasCurrentSavedSelection}
        currentSaveLabel={currentSaveLabel}
        moleculeTitle={moleculeName}
        educationalDescription={moleculeEducationalDescription}
        formula={formulaDisplayValue}
        nomenclature={systematicNameDisplayValue}
        atomCount={focusedSummary.atomCount}
        bondCount={focusedSummary.bondCount}
        componentCount={moleculeComponents.length}
        focusedComponentLabel={
          moleculeComponents.length > 1
            ? `Mol ${resolvedFocusedComponentIndex + 1} / ${moleculeComponents.length}`
            : null
        }
        isMutating={isSavedMoleculesMutating}
        onClose={onCloseSaveModal}
        onMoleculeTitleChange={setMoleculeName}
        onEducationalDescriptionChange={setMoleculeEducationalDescription}
        onSaveAsNew={onSaveAsNewMolecule}
        onUpdateSelected={onUpdateCurrentSavedMolecule}
        onDetachSelection={onDetachSavedMolecule}
        onDeleteSelected={onDeleteCurrentSavedMolecule}
      />

      {galleryFeedback !== null ? (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[100] w-[min(22rem,calc(100vw-2rem))]">
          <div
            role={galleryFeedback.tone === 'error' ? 'alert' : 'status'}
            aria-live={galleryFeedback.tone === 'error' ? 'assertive' : 'polite'}
            className={`rounded-[1.4rem] border px-4 py-3 shadow-xl backdrop-blur-xl ${
              galleryFeedback.tone === 'error'
                ? 'border-rose-400/40 bg-[#3a0f19]/92 text-rose-50'
                : galleryFeedback.tone === 'success'
                  ? 'border-emerald-400/35 bg-[#08281d]/92 text-emerald-50'
                  : 'border-(--border-subtle) bg-[#0f1726]/90 text-white'
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">{galleryFeedbackToastLabel}</p>
            <p className="mt-1 text-sm leading-relaxed">{galleryFeedback.message}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default memo(MolecularEditor);
