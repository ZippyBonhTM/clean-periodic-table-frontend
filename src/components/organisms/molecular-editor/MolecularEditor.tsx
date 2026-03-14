'use client';

import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';

import MoleculeComponentFocusRail from '@/components/organisms/molecular-editor/MoleculeComponentFocusRail';
import EditorCanvas from '@/components/organisms/molecular-editor/MoleculeEditorCanvas';
import MoleculeGallerySection from '@/components/organisms/molecular-editor/MoleculeGallerySection';
import MoleculeImportModal from '@/components/organisms/molecular-editor/MoleculeImportModal';
import MoleculePaletteRail from '@/components/organisms/molecular-editor/MoleculePaletteRail';
import MoleculeSaveModal from '@/components/organisms/molecular-editor/MoleculeSaveModal';
import MoleculeSummaryPanel from '@/components/organisms/molecular-editor/MoleculeSummaryPanel';
import MoleculeEditorTopBar from '@/components/organisms/molecular-editor/MoleculeEditorTopBar';
import MoleculeEditorToolRail from '@/components/organisms/molecular-editor/MoleculeEditorToolRail';
import {
  preserveViewportAcrossModelChange,
  resolveInteractiveViewBox,
  resolveNextStandalonePoint,
  resolveScaledViewBoxMetrics,
  resolveViewBox,
} from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import useCanvasInteractions from '@/components/organisms/molecular-editor/useCanvasInteractions';
import useEditorHistory from '@/components/organisms/molecular-editor/useEditorHistory';
import type { ResolvedImportedPubChemCompound } from '@/shared/api/pubchemApi';
import { mapSavedMoleculesErrorMessage } from '@/shared/hooks/useSavedMolecules';
import {
  clearPendingSavedMoleculeId,
  readPendingSavedMoleculeId,
  writePendingSavedMoleculeId,
} from '@/shared/storage/pendingSavedMoleculeStorage';
import type {
  SaveMoleculeInput,
  SavedMolecule,
  SavedMoleculeEditorState,
} from '@/shared/types/molecule';
import type { ChemicalElement } from '@/shared/types/element';
import {
  matchesElementQuery,
  resolveElementQueryRank,
} from '@/shared/utils/elementPresentation';
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

const DRAG_THRESHOLD_PX = 6;
const CANVAS_ZOOM_MIN = 0.5;
const CANVAS_ZOOM_MAX = 3;
const CANVAS_ZOOM_STEP = 1.15;
const PALETTE_GESTURE_STEP_MIN = 18;
const PALETTE_GESTURE_STEP_MAX = 32;
const PALETTE_GESTURE_STEP_RATIO = 0.58;
const PALETTE_MOMENTUM_DECAY = 0.9;
const PALETTE_MOMENTUM_MIN_SPEED = 0.08;
const PALETTE_MOMENTUM_IDLE_RELEASE_MS = 90;
const PALETTE_TILE_LONG_PRESS_MS = 260;
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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="3.8" />
      <path d="m10.2 10.2 2.6 2.6" />
    </svg>
  );
}

function CloseChipIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m4.5 4.5 7 7" />
      <path d="m11.5 4.5-7 7" />
    </svg>
  );
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
  const router = useRouter();
  const [molecule, setMolecule] = useState<MoleculeModel>(EMPTY_MOLECULE);
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<EditorViewMode>('editor');
  const [bondOrder, setBondOrder] = useState<BondOrder>(1);
  const [isToolRailCollapsed, setIsToolRailCollapsed] = useState(true);
  const [paletteQuery, setPaletteQuery] = useState('');
  const [isPaletteSearchExpanded, setIsPaletteSearchExpanded] = useState(false);
  const [isFormulaPanelOpen, setIsFormulaPanelOpen] = useState(false);
  const [centerPaletteIndex, setCenterPaletteIndex] = useState(0);
  const [expandedPaletteIndex, setExpandedPaletteIndex] = useState(0);
  const [isPaletteMoving, setIsPaletteMoving] = useState(false);
  const [isPalettePointerActive, setIsPalettePointerActive] = useState(false);
  const [editorNotice, setEditorNotice] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isFloatingSaveShortcutExpanded, setIsFloatingSaveShortcutExpanded] = useState(false);
  const [activeSavedMoleculeId, setActiveSavedMoleculeId] = useState<string | null>(null);
  const [focusedComponentIndex, setFocusedComponentIndex] = useState(0);
  const [nomenclatureFallback, setNomenclatureFallback] = useState<string | null>(null);
  const [moleculeName, setMoleculeName] = useState('');
  const [moleculeEducationalDescription, setMoleculeEducationalDescription] = useState('');
  const [galleryFeedback, setGalleryFeedback] = useState<GalleryFeedback | null>(null);
  const [canvasViewport, setCanvasViewport] = useState<CanvasViewport>(DEFAULT_CANVAS_VIEWPORT);
  const [paletteEdgePadding, setPaletteEdgePadding] = useState(0);
  const [hasCheckedPendingSavedMolecule, setHasCheckedPendingSavedMolecule] = useState(pageMode !== 'editor');
  const [hasPendingSavedMolecule, setHasPendingSavedMolecule] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const paletteViewportRef = useRef<HTMLDivElement | null>(null);
  const paletteItemRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const centerPaletteIndexRef = useRef(0);
  const topControlsRef = useRef<HTMLDivElement | null>(null);
  const topOverlayRef = useRef<HTMLDivElement | null>(null);
  const paletteSearchRailRef = useRef<HTMLDivElement | null>(null);
  const bottomNoticeRef = useRef<HTMLDivElement | null>(null);
  const canvasFrameRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const paletteInteractionRef = useRef({
    pointerId: -1,
    startClientX: 0,
    startScrollLeft: 0,
    startedAt: 0,
    lastClientX: 0,
    lastTimestamp: 0,
    velocity: 0,
    moved: false,
    pressedIndex: null as number | null,
  });
  const paletteMomentumFrameRef = useRef<number | null>(null);
  const paletteSnapTimeoutRef = useRef<number | null>(null);
  const paletteSettleTimeoutRef = useRef<number | null>(null);
  const galleryFeedbackTimeoutRef = useRef<number | null>(null);
  const suppressPaletteClickRef = useRef(false);
  const paletteSearchFocusTimeoutRef = useRef<number | null>(null);
  const pendingSavedMoleculeIdRef = useRef<string | null>(null);
  const [topControlsHeight, setTopControlsHeight] = useState(0);
  const [topOverlayHeight, setTopOverlayHeight] = useState(0);
  const [paletteSearchRailHeight, setPaletteSearchRailHeight] = useState(0);
  const [bottomNoticeHeight, setBottomNoticeHeight] = useState(0);
  const [canvasFrameSize, setCanvasFrameSize] = useState({ width: 0, height: 0 });

  const filteredElements = useMemo(() => {
    const normalizedQuery = paletteQuery.trim();

    if (normalizedQuery.length === 0) {
      return elements;
    }

    return elements
      .filter((element) => matchesElementQuery(element, normalizedQuery))
      .sort((first, second) => {
        const firstRank = resolveElementQueryRank(first, normalizedQuery);
        const secondRank = resolveElementQueryRank(second, normalizedQuery);

        if (firstRank !== secondRank) {
          return firstRank - secondRank;
        }

        return first.number - second.number;
      });
  }, [elements, paletteQuery]);

  const resolvedExpandedPaletteIndex =
    filteredElements.length === 0 ? 0 : Math.min(expandedPaletteIndex, filteredElements.length - 1);
  const resolvedCenterPaletteIndex =
    filteredElements.length === 0 ? 0 : Math.min(centerPaletteIndex, filteredElements.length - 1);
  const activeElement = filteredElements[resolvedExpandedPaletteIndex] ?? null;
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
  const resolvedEditorNotice =
    editorNotice ??
    (hasCheckedPendingSavedMolecule &&
    !hasPendingSavedMolecule &&
    summary.atomCount === 0 &&
    selectedAtomId === null
      ? DEFAULT_EDITOR_NOTICE
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
  const interactiveViewBox = useMemo(
    () =>
      resolveInteractiveViewBox(
        molecule,
        canvasViewport,
        canvasFrameSize.width > 0 && canvasFrameSize.height > 0
          ? canvasFrameSize.width / canvasFrameSize.height
          : undefined,
      ),
    [canvasFrameSize.height, canvasFrameSize.width, canvasViewport, molecule],
  );
  const canvasFrameAspectRatio =
    canvasFrameSize.width > 0 && canvasFrameSize.height > 0
      ? canvasFrameSize.width / canvasFrameSize.height
      : undefined;
  const hasActivePaletteFilter = paletteQuery.trim().length > 0;
  const isPaletteSearchOpen = isPaletteSearchExpanded;
  const zoomPercent = Math.round(canvasViewport.scale * 100);
  const normalizedSavedMolecules = useMemo(
    () => savedMolecules.map((entry) => normalizeSavedMoleculeRecord(entry)),
    [savedMolecules],
  );

  const resolvedActiveSavedMoleculeId = useMemo(() => {
    if (activeSavedMoleculeId === null) {
      return null;
    }

    return normalizedSavedMolecules.some((entry) => entry.id === activeSavedMoleculeId)
      ? activeSavedMoleculeId
      : null;
  }, [activeSavedMoleculeId, normalizedSavedMolecules]);
  const activeSavedMolecule = useMemo(
    () => normalizedSavedMolecules.find((entry) => entry.id === resolvedActiveSavedMoleculeId) ?? null,
    [normalizedSavedMolecules, resolvedActiveSavedMoleculeId],
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

  const syncCenterPaletteIndex = useCallback((index: number) => {
    centerPaletteIndexRef.current = index;
    setCenterPaletteIndex((currentIndex) => (currentIndex === index ? currentIndex : index));
  }, []);

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

  useEffect(() => {
    if (pageMode !== 'editor') {
      return;
    }

    if (pendingSavedMoleculeIdRef.current === null) {
      pendingSavedMoleculeIdRef.current = readPendingSavedMoleculeId();
    }

    setHasPendingSavedMolecule(pendingSavedMoleculeIdRef.current !== null);
    setHasCheckedPendingSavedMolecule(true);

    const pendingSavedMoleculeId = pendingSavedMoleculeIdRef.current;

    if (pendingSavedMoleculeId === null) {
      return;
    }

    if (isSavedMoleculesLoading) {
      return;
    }

    const pendingSavedMolecule = normalizedSavedMolecules.find((entry) => entry.id === pendingSavedMoleculeId);

    if (pendingSavedMolecule === undefined) {
      const timeoutId = window.setTimeout(() => {
        clearPendingSavedMoleculeId();
        pendingSavedMoleculeIdRef.current = null;
        setHasPendingSavedMolecule(false);
        showGalleryFeedback('error', 'Could not find the selected gallery molecule.');
      }, 0);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    const timeoutId = window.setTimeout(() => {
      clearPendingSavedMoleculeId();
      pendingSavedMoleculeIdRef.current = null;
      setHasPendingSavedMolecule(false);
      applySavedMolecule(
        pendingSavedMolecule,
        `${pendingSavedMolecule.name ?? pendingSavedMolecule.summary.formula} loaded from gallery.`,
      );
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [applySavedMolecule, isSavedMoleculesLoading, normalizedSavedMolecules, pageMode, showGalleryFeedback]);

  const resetPaletteSearchViewport = useCallback(() => {
    setExpandedPaletteIndex(0);
    syncCenterPaletteIndex(0);
    setIsPaletteMoving(false);
    setIsPalettePointerActive(false);
  }, [syncCenterPaletteIndex]);

  const onPaletteSearchChange = useCallback((nextQuery: string) => {
    setPaletteQuery(nextQuery);
    resetPaletteSearchViewport();
  }, [resetPaletteSearchViewport]);

  const onClearPaletteSearch = useCallback(() => {
    setPaletteQuery('');
    resetPaletteSearchViewport();
  }, [resetPaletteSearchViewport]);

  const onTogglePaletteSearch = useCallback(() => {
    setIsPaletteSearchExpanded((current) => !current);
  }, []);

  const clampPaletteIndex = useCallback(
    (index: number) => {
      if (filteredElements.length === 0) {
        return 0;
      }

      return Math.max(0, Math.min(filteredElements.length - 1, index));
    },
    [filteredElements.length],
  );

  const resolvePaletteGestureStep = useCallback(() => {
    const currentButton =
      paletteItemRefs.current[centerPaletteIndexRef.current] ?? paletteItemRefs.current[resolvedExpandedPaletteIndex];
    const baseWidth = currentButton?.clientWidth ?? 40;

    return Math.max(
      PALETTE_GESTURE_STEP_MIN,
      Math.min(PALETTE_GESTURE_STEP_MAX, Math.round(baseWidth * PALETTE_GESTURE_STEP_RATIO)),
    );
  }, [resolvedExpandedPaletteIndex]);

  const centerPaletteElement = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const viewport = paletteViewportRef.current;
      const elementButton = paletteItemRefs.current[index];

      if (viewport === null || elementButton === null) {
        return;
      }

      const viewportRect = viewport.getBoundingClientRect();
      const buttonRect = elementButton.getBoundingClientRect();
      const buttonCenter = viewport.scrollLeft + (buttonRect.left - viewportRect.left) + buttonRect.width / 2;
      const nextScrollLeft = Math.max(0, buttonCenter - viewport.clientWidth / 2);

      if (behavior === 'auto') {
        viewport.scrollLeft = nextScrollLeft;
        return;
      }

      viewport.scrollTo({
        left: nextScrollLeft,
        behavior,
      });
    },
    [],
  );

  const resolveNearestPaletteIndex = useCallback(() => {
    const viewport = paletteViewportRef.current;

    if (viewport === null || filteredElements.length === 0) {
      return 0;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < filteredElements.length; index += 1) {
      const elementButton = paletteItemRefs.current[index];

      if (elementButton === null || elementButton === undefined) {
        continue;
      }

      const buttonRect = elementButton.getBoundingClientRect();
      const buttonCenter = viewport.scrollLeft + (buttonRect.left - viewportRect.left) + buttonRect.width / 2;
      const distance = Math.abs(buttonCenter - center);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    return nearestIndex;
  }, [filteredElements.length]);

  const cancelPaletteMomentum = useCallback(() => {
    if (paletteMomentumFrameRef.current !== null) {
      cancelAnimationFrame(paletteMomentumFrameRef.current);
      paletteMomentumFrameRef.current = null;
    }

    if (paletteSnapTimeoutRef.current !== null) {
      window.clearTimeout(paletteSnapTimeoutRef.current);
      paletteSnapTimeoutRef.current = null;
    }

    if (paletteSettleTimeoutRef.current !== null) {
      window.clearTimeout(paletteSettleTimeoutRef.current);
      paletteSettleTimeoutRef.current = null;
    }
  }, []);

  const settlePaletteSelection = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      cancelPaletteMomentum();
      syncCenterPaletteIndex(index);
      centerPaletteElement(index, behavior);

      const finalizeSelection = () => {
        setExpandedPaletteIndex(index);
        setIsPaletteMoving(false);
      };

      if (behavior === 'auto') {
        finalizeSelection();
        return;
      }

      paletteSettleTimeoutRef.current = window.setTimeout(finalizeSelection, 140);
    },
    [cancelPaletteMomentum, centerPaletteElement, syncCenterPaletteIndex],
  );

  const goToPreviousPaletteElement = useCallback(() => {
    if (filteredElements.length === 0) {
      return;
    }

    const currentIndex = clampPaletteIndex(centerPaletteIndexRef.current);
    const nextIndex = currentIndex === 0 ? filteredElements.length - 1 : currentIndex - 1;

    setIsPaletteMoving(true);
    settlePaletteSelection(nextIndex);
  }, [clampPaletteIndex, filteredElements.length, settlePaletteSelection]);

  const goToNextPaletteElement = useCallback(() => {
    if (filteredElements.length === 0) {
      return;
    }

    const currentIndex = clampPaletteIndex(centerPaletteIndexRef.current);
    const nextIndex = currentIndex === filteredElements.length - 1 ? 0 : currentIndex + 1;

    setIsPaletteMoving(true);
    settlePaletteSelection(nextIndex);
  }, [clampPaletteIndex, filteredElements.length, settlePaletteSelection]);

  const snapPaletteToNearest = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const nextIndex = resolveNearestPaletteIndex();
      settlePaletteSelection(nextIndex, behavior);
    },
    [resolveNearestPaletteIndex, settlePaletteSelection],
  );

  const settlePaletteToCurrentCenter = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const nextIndex = clampPaletteIndex(centerPaletteIndexRef.current);
      settlePaletteSelection(nextIndex, behavior);
    },
    [clampPaletteIndex, settlePaletteSelection],
  );

  const startPaletteMomentum = useCallback(
    (initialVelocity: number) => {
      if (filteredElements.length === 0) {
        setIsPaletteMoving(false);
        return;
      }

      let velocity = initialVelocity;
      let carry = 0;

      if (Math.abs(velocity) < PALETTE_MOMENTUM_MIN_SPEED) {
        settlePaletteToCurrentCenter('auto');
        return;
      }

      cancelPaletteMomentum();
      let lastTimestamp = performance.now();
      const gestureStep = resolvePaletteGestureStep();

      const step = (timestamp: number) => {
        const deltaTime = Math.min(32, Math.max(8, timestamp - lastTimestamp));
        lastTimestamp = timestamp;
        carry += velocity * (deltaTime / 16);
        velocity *= Math.pow(PALETTE_MOMENTUM_DECAY, deltaTime / 16);

        const stepCount = Math.floor(Math.abs(carry) / gestureStep);

        if (stepCount > 0) {
          const stepDirection = carry < 0 ? -1 : 1;
          const nextIndex = clampPaletteIndex(centerPaletteIndexRef.current + stepDirection * stepCount);

          if (nextIndex !== centerPaletteIndexRef.current) {
            syncCenterPaletteIndex(nextIndex);
            centerPaletteElement(nextIndex, 'auto');
          }

          carry -= Math.sign(carry) * stepCount * gestureStep;
        }

        if (Math.abs(velocity) < PALETTE_MOMENTUM_MIN_SPEED) {
          cancelPaletteMomentum();
          settlePaletteToCurrentCenter('auto');
          return;
        }

        paletteMomentumFrameRef.current = requestAnimationFrame(step);
      };

      paletteMomentumFrameRef.current = requestAnimationFrame(step);
    },
    [cancelPaletteMomentum, centerPaletteElement, clampPaletteIndex, filteredElements.length, resolvePaletteGestureStep, settlePaletteToCurrentCenter, syncCenterPaletteIndex],
  );

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

  const onDetachSavedMolecule = useCallback(() => {
    setActiveSavedMoleculeId(null);
    showGalleryFeedback('info', 'Current canvas detached. Saving now will create a new record.');
  }, [showGalleryFeedback]);

  const onOpenSaveModal = useCallback(() => {
    setIsFloatingSaveShortcutExpanded(false);
    setIsImportModalOpen(false);
    setIsSaveModalOpen(true);
  }, []);

  const onOpenGalleryEditModal = useCallback(() => {
    if (resolvedActiveSavedMoleculeId === null) {
      showGalleryFeedback('error', 'Select a saved molecule before editing its gallery data.');
      return;
    }

    setIsImportModalOpen(false);
    setIsFloatingSaveShortcutExpanded(false);
    setIsSaveModalOpen(true);
  }, [resolvedActiveSavedMoleculeId, showGalleryFeedback]);

  const onCloseSaveModal = useCallback(() => {
    setIsSaveModalOpen(false);
  }, []);

  const onOpenImportModal = useCallback(() => {
    setIsFloatingSaveShortcutExpanded(false);
    setIsSaveModalOpen(false);
    setIsImportModalOpen(true);
  }, []);

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

  const onLoadSavedMolecule = useCallback(
    (savedMolecule: SavedMolecule) => {
      applySavedMolecule(savedMolecule, `${savedMolecule.name ?? savedMolecule.summary.formula} loaded.`);
    },
    [applySavedMolecule],
  );

  const onOpenCurrentSavedMoleculeInEditor = useCallback(() => {
    if (activeSavedMolecule === null) {
      showGalleryFeedback('error', 'Select a saved molecule before opening it in the editor.');
      return;
    }

    writePendingSavedMoleculeId(activeSavedMolecule.id);
    router.push('/molecular-editor');
  }, [activeSavedMolecule, router, showGalleryFeedback]);

  const onSaveAsNewMolecule = useCallback(async () => {
    if (summary.atomCount === 0) {
      showGalleryFeedback('error', 'Add atoms before saving a molecule to the gallery.');
      return;
    }

    try {
      showGalleryFeedback('info', 'Save request sent.', { persist: true });
      const created = await onCreateSavedMolecule(buildSaveMoleculeInput());
      setActiveSavedMoleculeId(created.id);
      setMoleculeName(created.name ?? '');
      setMoleculeEducationalDescription(created.educationalDescription ?? '');
      setIsSaveModalOpen(false);
      showGalleryFeedback('success', 'Work saved.');
    } catch (caughtError: unknown) {
      showGalleryFeedback('error', mapSavedMoleculesErrorMessage(caughtError));
    }
  }, [buildSaveMoleculeInput, onCreateSavedMolecule, showGalleryFeedback, summary.atomCount]);

  const onUpdateCurrentSavedMolecule = useCallback(async () => {
    if (resolvedActiveSavedMoleculeId === null) {
      showGalleryFeedback('error', 'Select a saved molecule before updating it.');
      return;
    }

    if (summary.atomCount === 0) {
      showGalleryFeedback('error', 'Add atoms before updating a saved molecule.');
      return;
    }

    try {
      showGalleryFeedback('info', 'Save request sent.', { persist: true });
      const updated = await onUpdateSavedMolecule(resolvedActiveSavedMoleculeId, buildSaveMoleculeInput());
      setMoleculeName(updated.name ?? '');
      setMoleculeEducationalDescription(updated.educationalDescription ?? '');
      setIsSaveModalOpen(false);
      showGalleryFeedback('success', 'Work saved.');
    } catch (caughtError: unknown) {
      showGalleryFeedback('error', mapSavedMoleculesErrorMessage(caughtError));
    }
  }, [buildSaveMoleculeInput, onUpdateSavedMolecule, resolvedActiveSavedMoleculeId, showGalleryFeedback, summary.atomCount]);

  const onDeleteCurrentSavedMolecule = useCallback(async () => {
    if (resolvedActiveSavedMoleculeId === null) {
      showGalleryFeedback('error', 'Select a saved molecule before deleting it.');
      return;
    }

    try {
      showGalleryFeedback('info', 'Delete request sent.', { persist: true });
      await onDeleteSavedMolecule(resolvedActiveSavedMoleculeId);
      setActiveSavedMoleculeId(null);
      setIsSaveModalOpen(false);
      showGalleryFeedback('success', 'Saved work deleted.');
    } catch (caughtError: unknown) {
      showGalleryFeedback('error', mapSavedMoleculesErrorMessage(caughtError));
    }
  }, [onDeleteSavedMolecule, resolvedActiveSavedMoleculeId, showGalleryFeedback]);

  const onDeleteCurrentSavedMoleculeFromGallery = useCallback(async () => {
    if (activeSavedMolecule === null) {
      showGalleryFeedback('error', 'Select a saved molecule before deleting it.');
      return;
    }

    const label = activeSavedMolecule.name ?? activeSavedMolecule.summary.formula;
    const shouldDelete = window.confirm(`Delete "${label}" from your gallery?`);

    if (!shouldDelete) {
      return;
    }

    await onDeleteCurrentSavedMolecule();
  }, [activeSavedMolecule, onDeleteCurrentSavedMolecule, showGalleryFeedback]);

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

  useEffect(() => {
    if (paletteSearchFocusTimeoutRef.current !== null) {
      window.clearTimeout(paletteSearchFocusTimeoutRef.current);
      paletteSearchFocusTimeoutRef.current = null;
    }

    if (!isPaletteSearchOpen || searchInputRef.current === null) {
      return;
    }

    paletteSearchFocusTimeoutRef.current = window.setTimeout(() => {
      searchInputRef.current?.focus();
      paletteSearchFocusTimeoutRef.current = null;
    }, 160);

    return () => {
      if (paletteSearchFocusTimeoutRef.current !== null) {
        window.clearTimeout(paletteSearchFocusTimeoutRef.current);
        paletteSearchFocusTimeoutRef.current = null;
      }
    };
  }, [isPaletteSearchOpen]);

  useEffect(() => {
    if (!isPaletteSearchOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const searchRailElement = paletteSearchRailRef.current;

      if (searchRailElement === null || searchRailElement.contains(event.target as Node)) {
        return;
      }

      setIsPaletteSearchExpanded(false);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [isPaletteSearchOpen]);

  useEffect(() => {
    const viewport = paletteViewportRef.current;

    if (viewport === null) {
      return;
    }

    let frameId = 0;
    const updatePadding = () => {
      const selectedButton = paletteItemRefs.current[resolvedExpandedPaletteIndex];
      const selectedWidth = selectedButton?.clientWidth ?? 0;
      const nextPadding = Math.max(0, Math.round(viewport.clientWidth / 2 - selectedWidth / 2));

      setPaletteEdgePadding((currentPadding) =>
        currentPadding === nextPadding ? currentPadding : nextPadding,
      );
    };

    frameId = window.requestAnimationFrame(updatePadding);
    const resizeObserver = new ResizeObserver(() => {
      updatePadding();
    });

    resizeObserver.observe(viewport);
    const selectedButton = paletteItemRefs.current[resolvedExpandedPaletteIndex];

    if (selectedButton !== null && selectedButton !== undefined) {
      resizeObserver.observe(selectedButton);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [filteredElements.length, resolvedExpandedPaletteIndex]);

  useEffect(() => {
    return () => {
      cancelPaletteMomentum();
    };
  }, [cancelPaletteMomentum]);

  useEffect(() => {
    centerPaletteIndexRef.current = resolvedCenterPaletteIndex;
  }, [resolvedCenterPaletteIndex]);

  useEffect(() => {
    if (isPaletteMoving) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      syncCenterPaletteIndex(resolvedExpandedPaletteIndex);
      centerPaletteElement(resolvedExpandedPaletteIndex, 'auto');
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [centerPaletteElement, filteredElements, isPaletteMoving, paletteEdgePadding, resolvedExpandedPaletteIndex, syncCenterPaletteIndex]);

  useEffect(() => {
    if (!isPaletteMoving && !isPalettePointerActive) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      centerPaletteElement(resolvedCenterPaletteIndex, 'auto');
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [centerPaletteElement, isPaletteMoving, isPalettePointerActive, resolvedCenterPaletteIndex]);

  const onPaletteScroll = useCallback(() => {
    if (isPalettePointerActive || isPaletteMoving) {
      return;
    }

    const nextIndex = resolveNearestPaletteIndex();
    syncCenterPaletteIndex(nextIndex);

    if (paletteSnapTimeoutRef.current !== null) {
      window.clearTimeout(paletteSnapTimeoutRef.current);
    }

    paletteSnapTimeoutRef.current = window.setTimeout(() => {
      snapPaletteToNearest();
    }, 120);
  }, [isPaletteMoving, isPalettePointerActive, resolveNearestPaletteIndex, snapPaletteToNearest, syncCenterPaletteIndex]);

  const onPalettePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const viewport = paletteViewportRef.current;

    if (viewport === null) {
      return;
    }

    event.preventDefault();
    cancelPaletteMomentum();
    setIsPaletteMoving(true);
    setIsPalettePointerActive(true);
    suppressPaletteClickRef.current = false;
    viewport.setPointerCapture(event.pointerId);
    const pressedIndexAttr =
      event.target instanceof Element ? event.target.closest<HTMLElement>('[data-palette-index]')?.dataset.paletteIndex : undefined;
    const pressedIndex =
      pressedIndexAttr === undefined ? null : Number.parseInt(pressedIndexAttr, 10);
    paletteInteractionRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startScrollLeft: viewport.scrollLeft,
      startedAt: performance.now(),
      lastClientX: event.clientX,
      lastTimestamp: performance.now(),
      velocity: 0,
      moved: false,
      pressedIndex: Number.isNaN(pressedIndex ?? Number.NaN) ? null : pressedIndex,
    };
  }, [cancelPaletteMomentum]);

  const onPalettePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const viewport = paletteViewportRef.current;
      const interaction = paletteInteractionRef.current;

      if (viewport === null || interaction.pointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - interaction.startClientX;
      const distance = Math.abs(deltaX);

      if (distance < DRAG_THRESHOLD_PX && !interaction.moved) {
        return;
      }

      event.preventDefault();
      setIsPaletteMoving(true);
      suppressPaletteClickRef.current = true;
      const now = performance.now();
      const deltaTime = Math.max(8, now - interaction.lastTimestamp);
      const instantaneousVelocity = -(event.clientX - interaction.lastClientX) / Math.max(0.5, deltaTime / 16);
      const gestureStep = resolvePaletteGestureStep();
      const stepCount = Math.floor(Math.abs(deltaX) / gestureStep);

      if (stepCount === 0) {
        paletteInteractionRef.current = {
          ...interaction,
          lastClientX: event.clientX,
          lastTimestamp: now,
          velocity: interaction.velocity * 0.7 + instantaneousVelocity * 0.3,
        };
        return;
      }

      const stepDirection = deltaX > 0 ? -1 : 1;
      const previousIndex = centerPaletteIndexRef.current;
      const nextIndex = clampPaletteIndex(previousIndex + stepDirection * stepCount);
      const didAdvance = nextIndex !== previousIndex;

      if (didAdvance) {
        syncCenterPaletteIndex(nextIndex);
        centerPaletteElement(nextIndex, 'auto');
      }

      paletteInteractionRef.current = {
        ...interaction,
        startClientX: interaction.startClientX + Math.sign(deltaX) * gestureStep * stepCount,
        lastClientX: event.clientX,
        lastTimestamp: now,
        velocity: interaction.velocity * 0.64 + instantaneousVelocity * 0.36,
        moved: didAdvance || interaction.moved,
      };
    },
    [centerPaletteElement, clampPaletteIndex, resolvePaletteGestureStep, syncCenterPaletteIndex],
  );

  const onPalettePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = paletteViewportRef.current;
    const interaction = paletteInteractionRef.current;

    if (viewport === null || interaction.pointerId !== event.pointerId) {
      return;
    }

    if (viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    setIsPalettePointerActive(false);
    const releaseTimestamp = performance.now();
    const timeSinceLastMove = releaseTimestamp - interaction.lastTimestamp;
    const shouldCarryMomentum = timeSinceLastMove <= PALETTE_MOMENTUM_IDLE_RELEASE_MS;
    const pressedTileIndex = interaction.pressedIndex;
    const wasShortTilePress =
      pressedTileIndex !== null && releaseTimestamp - interaction.startedAt < PALETTE_TILE_LONG_PRESS_MS;
    paletteInteractionRef.current = {
      pointerId: -1,
      startClientX: 0,
      startScrollLeft: 0,
      startedAt: 0,
      lastClientX: 0,
      lastTimestamp: 0,
      velocity: 0,
      moved: false,
      pressedIndex: null,
    };

    if (interaction.moved) {
      const releaseVelocity = shouldCarryMomentum ? interaction.velocity : 0;

      if (Math.abs(releaseVelocity) < PALETTE_MOMENTUM_MIN_SPEED) {
        settlePaletteToCurrentCenter('auto');
      } else {
        startPaletteMomentum(releaseVelocity);
      }

      window.setTimeout(() => {
        suppressPaletteClickRef.current = false;
      }, 40);
      return;
    }

    setIsPaletteMoving(false);

    if (pressedTileIndex !== null && wasShortTilePress) {
      settlePaletteSelection(pressedTileIndex, 'smooth');
      return;
    }

    settlePaletteToCurrentCenter('auto');
  }, [settlePaletteSelection, settlePaletteToCurrentCenter, startPaletteMomentum]);

  const onPalettePointerCancel = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = paletteViewportRef.current;

    if (viewport !== null && viewport.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    setIsPalettePointerActive(false);
    paletteInteractionRef.current = {
      pointerId: -1,
      startClientX: 0,
      startScrollLeft: 0,
      startedAt: 0,
      lastClientX: 0,
      lastTimestamp: 0,
      velocity: 0,
      moved: false,
      pressedIndex: null,
    };
    setIsPaletteMoving(false);
    settlePaletteToCurrentCenter('auto');
  }, [settlePaletteToCurrentCenter]);

  useEffect(() => {
    const topControlsElement = topControlsRef.current;
    const overlayElement = topOverlayRef.current;
    const searchRailElement = paletteSearchRailRef.current;
    const bottomNoticeElement = bottomNoticeRef.current;
    const canvasElement = canvasFrameRef.current;

    if (
      topControlsElement === null &&
      overlayElement === null &&
      searchRailElement === null &&
      bottomNoticeElement === null &&
      canvasElement === null
    ) {
      return;
    }

    const updateMeasurements = () => {
      if (topControlsElement !== null) {
        const nextTopControlsHeight = Math.round(topControlsElement.getBoundingClientRect().height);
        setTopControlsHeight((currentHeight) =>
          currentHeight === nextTopControlsHeight ? currentHeight : nextTopControlsHeight,
        );
      }

      if (overlayElement !== null) {
        const nextOverlayHeight = Math.round(overlayElement.getBoundingClientRect().height);
        setTopOverlayHeight((currentHeight) =>
          currentHeight === nextOverlayHeight ? currentHeight : nextOverlayHeight,
        );
      }

      if (searchRailElement !== null) {
        const nextSearchRailHeight = Math.round(searchRailElement.getBoundingClientRect().height);
        setPaletteSearchRailHeight((currentHeight) =>
          currentHeight === nextSearchRailHeight ? currentHeight : nextSearchRailHeight,
        );
      }

      if (bottomNoticeElement !== null) {
        const nextBottomNoticeHeight = Math.round(bottomNoticeElement.getBoundingClientRect().height);
        setBottomNoticeHeight((currentHeight) =>
          currentHeight === nextBottomNoticeHeight ? currentHeight : nextBottomNoticeHeight,
        );
      } else {
        setBottomNoticeHeight((currentHeight) => (currentHeight === 0 ? currentHeight : 0));
      }

      if (canvasElement !== null) {
        const rect = canvasElement.getBoundingClientRect();
        const nextWidth = Math.round(rect.width);
        const nextHeight = Math.round(rect.height);

        setCanvasFrameSize((currentSize) =>
          currentSize.width === nextWidth && currentSize.height === nextHeight
            ? currentSize
            : { width: nextWidth, height: nextHeight },
        );
      }
    };

    updateMeasurements();

    const resizeObserver = new ResizeObserver(() => {
      updateMeasurements();
    });

    if (topControlsElement !== null) {
      resizeObserver.observe(topControlsElement);
    }

    if (overlayElement !== null) {
      resizeObserver.observe(overlayElement);
    }

    if (searchRailElement !== null) {
      resizeObserver.observe(searchRailElement);
    }

    if (bottomNoticeElement !== null) {
      resizeObserver.observe(bottomNoticeElement);
    }

    if (canvasElement !== null) {
      resizeObserver.observe(canvasElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeView]);

  const isCompactCanvas = canvasFrameSize.width > 0 && canvasFrameSize.width < 640;
  const isWideCanvas = canvasFrameSize.width >= 1024;
  const isSimplifiedView = activeView === 'simplified';
  const editorSectionGap = 12;
  const editorSectionTopPadding = 2;
  const editorSectionBottomPadding = 16;
  const isLandscapeCompactCanvas =
    !isSimplifiedView &&
    canvasFrameSize.width > 0 &&
    canvasFrameSize.height > 0 &&
    canvasFrameSize.width > canvasFrameSize.height &&
    canvasFrameSize.height < 360;
  const viewportMainHeightCss = 'var(--app-viewport-main-height, 100svh)';
  const viewportMainGutterCss = 'var(--app-viewport-main-gutter, 0px)';
  const viewportMainTopGutterCss = `calc(${viewportMainGutterCss} + ${editorSectionTopPadding}px)`;
  const canvasPanelHeightCss = `max(280px, calc(${viewportMainHeightCss} - ${topControlsHeight + editorSectionGap + editorSectionBottomPadding}px - ${viewportMainTopGutterCss}))`;
  const canvasPanelStyle: CSSProperties = {
    height: canvasPanelHeightCss,
    minHeight: canvasPanelHeightCss,
    maxHeight: canvasPanelHeightCss,
  };
  const editorSectionStyle: CSSProperties = {
    minHeight: viewportMainHeightCss,
    paddingTop: viewportMainTopGutterCss,
  };
  const canvasContentInsetTop = topOverlayHeight > 0 ? topOverlayHeight + 16 : 96;
  const paletteSearchRailGap = paletteSearchRailHeight > 0 ? (isLandscapeCompactCanvas ? 6 : 8) : 0;
  const paletteSearchRailOffset = paletteSearchRailHeight + paletteSearchRailGap;
  const toolRailTop = canvasContentInsetTop + paletteSearchRailOffset;
  const toolRailStyle: CSSProperties = {
    top: toolRailTop,
    maxHeight: `calc(100% - ${toolRailTop + 12}px)`,
  };
  const simplifiedHorizontalPadding = isWideCanvas ? 32 : isCompactCanvas ? 14 : 22;
  const simplifiedFloatingSaveClearance =
    isSimplifiedView && pageMode === 'editor' ? (isLandscapeCompactCanvas ? 54 : 62) : 0;
  const simplifiedTopPadding =
    canvasContentInsetTop + paletteSearchRailOffset + (isCompactCanvas ? 12 : 16);
  const simplifiedBottomPadding = isWideCanvas ? 36 : isCompactCanvas ? 24 : 30;
  const simplifiedViewStyle: CSSProperties = {
    paddingTop: simplifiedTopPadding,
    paddingLeft: simplifiedHorizontalPadding + simplifiedFloatingSaveClearance,
    paddingRight: simplifiedHorizontalPadding,
    paddingBottom: simplifiedBottomPadding,
    WebkitOverflowScrolling: 'touch',
  };
  const effectiveToolRailCollapsed = isLandscapeCompactCanvas || isToolRailCollapsed;
  const showExpandedToolRailContent = !effectiveToolRailCollapsed;
  const responsiveLayoutWidth = canvasFrameSize.width > 0 ? canvasFrameSize.width : 320;

  const topControlsRowClassName = isLandscapeCompactCanvas
    ? 'flex min-w-0 flex-nowrap items-center justify-between gap-1.5'
    : responsiveLayoutWidth < 430
      ? 'flex min-w-0 flex-nowrap items-center justify-between gap-1.5'
      : 'flex flex-wrap items-center justify-between gap-2';
  const topControlsBlockClassName = moleculeComponents.length > 1 ? 'space-y-2' : '';
  const topControlsLeadingGroupClassName = isLandscapeCompactCanvas
    ? 'flex min-w-0 flex-nowrap items-center gap-1.5'
    : responsiveLayoutWidth < 430
      ? 'flex min-w-0 flex-nowrap items-center gap-1.5'
      : 'flex flex-wrap items-center gap-2';
  const viewModeTabsClassName = isLandscapeCompactCanvas
    ? 'flex items-center gap-0.5 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) p-0.5 shadow-lg backdrop-blur-xl'
    : 'flex items-center gap-1 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) p-1 shadow-lg backdrop-blur-xl';
  const viewModeButtonClassName = isLandscapeCompactCanvas
    ? 'inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[10px] font-semibold transition-colors'
    : responsiveLayoutWidth < 430
      ? 'inline-flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-[10px] font-semibold transition-colors'
      : 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[11px] font-semibold transition-colors';
  const importButtonClassName = isLandscapeCompactCanvas
    ? 'inline-flex h-7 items-center gap-1 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) px-2 text-[10px] font-semibold text-(--text-muted) shadow-lg backdrop-blur-xl transition-colors hover:border-(--accent) hover:text-foreground'
    : responsiveLayoutWidth < 430
      ? 'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) px-0 text-[10px] font-semibold text-(--text-muted) shadow-lg backdrop-blur-xl transition-colors hover:border-(--accent) hover:text-foreground'
      : 'inline-flex h-8 items-center gap-1.5 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) px-2.5 text-[11px] font-semibold text-(--text-muted) shadow-lg backdrop-blur-xl transition-colors hover:border-(--accent) hover:text-foreground';
  const zoomControlsClassName = isLandscapeCompactCanvas
    ? 'ml-auto flex items-center gap-0.5 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) p-0.5 shadow-lg backdrop-blur-xl'
    : responsiveLayoutWidth < 430
      ? 'ml-auto flex shrink-0 items-center gap-px rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) p-0.5 shadow-lg backdrop-blur-xl'
      : 'ml-auto flex items-center gap-0.5 rounded-xl border border-(--border-subtle) bg-(--surface-overlay-mid) p-0.5 shadow-lg backdrop-blur-xl';
  const zoomControlsVisibilityClassName = isSimplifiedView ? 'pointer-events-none invisible' : '';
  const topOverlayClassName = isLandscapeCompactCanvas
    ? 'absolute inset-x-2 top-2 z-30'
    : 'absolute inset-x-3 top-3 z-30';
  const toolRailCollapsedWidthClassName = isLandscapeCompactCanvas ? 'w-10' : 'w-12';
  const toolRailExpandedWidthClassName = isLandscapeCompactCanvas
    ? 'w-[min(56vw,8.5rem)]'
    : 'w-[min(72vw,224px)] sm:w-52';
  const paletteSearchShellClassName = isLandscapeCompactCanvas
    ? 'h-6 rounded-xl'
    : 'h-7 rounded-xl';
  const toolRailInsetPx = 12;
  const toolRailCollapsedWidthPx = isLandscapeCompactCanvas ? 40 : 48;
  const paletteSearchTriggerWidthPx = isLandscapeCompactCanvas ? 40 : 48;
  const paletteSearchClosedWidthPx = toolRailCollapsedWidthPx;
  const toolRailExpandedWidthPx = isLandscapeCompactCanvas
    ? Math.round(Math.min(responsiveLayoutWidth * 0.56, 136))
    : responsiveLayoutWidth >= 640
      ? 208
      : Math.round(Math.min(responsiveLayoutWidth * 0.72, 224));
  const paletteSearchExpandedWidthPx = Math.round(
    toolRailExpandedWidthPx,
  );
  const paletteSearchRailStyle: CSSProperties = {
    top: canvasContentInsetTop,
    left: `${toolRailInsetPx + (toolRailCollapsedWidthPx - paletteSearchClosedWidthPx) / 2}px`,
  };
  const paletteSearchPanelStyle: CSSProperties = {
    width: `${isPaletteSearchOpen ? paletteSearchExpandedWidthPx : paletteSearchClosedWidthPx}px`,
  };
  const paletteSearchInnerStyle: CSSProperties = {
    width: `${paletteSearchExpandedWidthPx}px`,
  };
  const paletteSearchTriggerStyle: CSSProperties = {
    width: `${paletteSearchTriggerWidthPx}px`,
  };
  const floatingSaveShortcutClosedWidthPx = toolRailCollapsedWidthPx;
  const floatingSaveShortcutExpandedWidthPx = isLandscapeCompactCanvas ? 132 : 156;
  const floatingSaveShortcutPanelStyle: CSSProperties = {
    width: `${isFloatingSaveShortcutExpanded ? floatingSaveShortcutExpandedWidthPx : floatingSaveShortcutClosedWidthPx}px`,
  };
  const floatingSaveShortcutInnerStyle: CSSProperties = {
    width: `${floatingSaveShortcutExpandedWidthPx}px`,
  };
  const floatingSaveShortcutTriggerStyle: CSSProperties = {
    width: `${floatingSaveShortcutClosedWidthPx}px`,
  };
  const paletteSearchButtonClassName = isLandscapeCompactCanvas ? 'h-5 w-5' : 'h-5.5 w-5.5';
  const paletteViewportWrapperClassName = isLandscapeCompactCanvas
    ? 'relative overflow-hidden px-8 py-1'
    : 'relative overflow-hidden px-9 py-1 sm:px-10 sm:py-1.5';
  const paletteRowClassName = isLandscapeCompactCanvas
    ? 'flex h-8 items-center gap-0.5'
    : 'flex h-11 items-center gap-1 sm:h-12 sm:gap-1.5 lg:h-[3.25rem] lg:gap-2';
  const compactBottomOverlayClassName = isLandscapeCompactCanvas
    ? 'pointer-events-none absolute bottom-2 left-1/2 z-20 flex w-full -translate-x-1/2 justify-center px-2'
    : 'pointer-events-none absolute bottom-3 left-1/2 z-20 flex w-full -translate-x-1/2 justify-center px-3';
  const compactBottomNoticeClassName = isLandscapeCompactCanvas
    ? 'pointer-events-auto max-w-[min(84vw,320px)] rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-panel) px-2 py-1.5 text-[10px] leading-[1.2] text-(--text-muted) shadow-lg backdrop-blur-xl'
    : 'pointer-events-auto max-w-[min(92vw,620px)] rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-panel) px-3 py-2 text-xs text-(--text-muted) shadow-lg backdrop-blur-xl sm:text-[13px]';
  const compactDisplayedEditorNotice =
    isLandscapeCompactCanvas && resolvedEditorNotice === DEFAULT_EDITOR_NOTICE
      ? 'Select an element, then double-tap to place it.'
      : resolvedEditorNotice;
  const toolRailBodyClassName = effectiveToolRailCollapsed
    ? 'flex flex-1 flex-col items-center gap-2 overflow-y-auto px-1.5 py-2'
    : 'flex-1 space-y-2.5 overflow-y-auto p-2';
  const collapsedToolRailSectionClassName = 'flex w-full flex-col items-center gap-2';
  const expandedToolRailSectionClassName = 'space-y-1.5';
  const formulaPanelBottom = bottomNoticeHeight > 0 ? bottomNoticeHeight + (isLandscapeCompactCanvas ? 8 : 16) : isLandscapeCompactCanvas ? 10 : 56;
  const formulaPanelStyle: CSSProperties = {
    bottom: `${formulaPanelBottom}px`,
  };
  const canvasPanelClassName = 'surface-panel relative overflow-hidden rounded-3xl border border-(--border-subtle) shadow-sm';
  const canvasFrameClassName = 'relative h-full w-full';
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

      <div
        className={canvasPanelClassName}
        style={canvasPanelStyle}
      >
        <MoleculePaletteRail
          overlayRef={topOverlayRef}
          overlayClassName={topOverlayClassName}
          viewportRef={paletteViewportRef}
          elements={filteredElements}
          paletteEdgePadding={paletteEdgePadding}
          isCompact={isLandscapeCompactCanvas}
          isPaletteMoving={isPaletteMoving}
          isPalettePointerActive={isPalettePointerActive}
          resolvedExpandedPaletteIndex={resolvedExpandedPaletteIndex}
          resolvedCenterPaletteIndex={resolvedCenterPaletteIndex}
          wrapperClassName={paletteViewportWrapperClassName}
          rowClassName={paletteRowClassName}
          onPaletteScroll={onPaletteScroll}
          onPalettePointerDown={onPalettePointerDown}
          onPalettePointerMove={onPalettePointerMove}
          onPalettePointerUp={onPalettePointerUp}
          onPalettePointerCancel={onPalettePointerCancel}
          onPrevious={goToPreviousPaletteElement}
          onNext={goToNextPaletteElement}
          onItemRef={(index, node) => {
            paletteItemRefs.current[index] = node;
          }}
        />

        <div
          ref={paletteSearchRailRef}
          style={paletteSearchRailStyle}
          className="absolute z-20"
        >
          <div
            style={paletteSearchPanelStyle}
            className={`pointer-events-auto flex flex-nowrap items-stretch overflow-hidden border bg-(--surface-overlay-strong) shadow-lg backdrop-blur-xl origin-left transition-[width,border-color] duration-200 ${paletteSearchShellClassName} ${
              hasActivePaletteFilter ? 'border-(--accent)' : 'border-(--border-subtle)'
            }`}
          >
            <div style={paletteSearchInnerStyle} className="flex h-full flex-nowrap items-stretch">
              <div style={paletteSearchTriggerStyle} className="flex h-full shrink-0 items-center justify-center">
                <button
                  type="button"
                  onClick={onTogglePaletteSearch}
                  className="inline-flex h-full w-full items-center justify-center text-(--text-muted) transition-colors hover:text-foreground"
                  aria-label={isPaletteSearchOpen ? 'Close element search' : 'Open element search'}
                  title={isPaletteSearchOpen ? 'Close element search' : 'Open element search'}
                >
                  <SearchIcon />
                </button>
              </div>

              <div
                className={`flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-hidden pr-1.5 ${
                  isPaletteSearchOpen ? 'pointer-events-auto' : 'pointer-events-none'
                }`}
                aria-hidden={!isPaletteSearchOpen}
              >
                <input
                  ref={searchInputRef}
                  id="molecule-element-search"
                  name="molecule-element-search"
                  type="text"
                  value={paletteQuery}
                  onChange={(event) => {
                    onPaletteSearchChange(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape' || event.key === 'Enter') {
                      setIsPaletteSearchExpanded(false);
                    }
                  }}
                  tabIndex={isPaletteSearchOpen ? undefined : -1}
                  placeholder="Search"
                  className={`w-full min-w-0 bg-transparent text-foreground outline-none placeholder:text-(--text-muted) ${
                    isLandscapeCompactCanvas ? 'text-[11px]' : 'text-[13px]'
                  }`}
                />

                {paletteQuery.trim().length > 0 ? (
                  <button
                    type="button"
                    onClick={onClearPaletteSearch}
                    className={`inline-flex shrink-0 items-center justify-center rounded-full text-(--text-muted) transition-colors hover:text-foreground ${paletteSearchButtonClassName}`}
                    aria-label="Clear element search"
                    title="Clear element search"
                  >
                    <CloseChipIcon />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <MoleculeEditorToolRail
          activeElementMaxBondSlots={activeElementMaxBondSlots}
          activeElementSymbol={activeElement?.symbol ?? null}
          bondOrder={bondOrder}
          bondOrderOptions={BOND_ORDER_OPTIONS}
          canRedo={canRedo}
          canUndo={canUndo}
          collapsedToolRailSectionClassName={collapsedToolRailSectionClassName}
          effectiveToolRailCollapsed={effectiveToolRailCollapsed}
          expandedToolRailSectionClassName={expandedToolRailSectionClassName}
          floatingSaveShortcutInnerStyle={floatingSaveShortcutInnerStyle}
          floatingSaveShortcutPanelStyle={floatingSaveShortcutPanelStyle}
          floatingSaveShortcutTriggerStyle={floatingSaveShortcutTriggerStyle}
          isFloatingSaveShortcutExpanded={isFloatingSaveShortcutExpanded}
          isLandscapeCompactCanvas={isLandscapeCompactCanvas}
          isSaveModalOpen={isSaveModalOpen}
          onAddSelectedElement={onAddSelectedElement}
          onClearSelection={onClearSelection}
          onFloatingSaveShortcutExpandedChange={setIsFloatingSaveShortcutExpanded}
          onOpenSaveModal={onOpenSaveModal}
          onRedo={onRedo}
          onRemoveSelectedAtom={onRemoveSelectedAtom}
          onResetMolecule={onResetMolecule}
          onSetBondOrder={onSetBondOrder}
          onToggleCollapsed={() => setIsToolRailCollapsed((current) => !current)}
          onUndo={onUndo}
          selectedAtomId={selectedAtomId}
          shouldShowFloatingSaveShortcut={shouldShowFloatingSaveShortcut}
          shouldShowToolRail={shouldShowToolRail}
          showExpandedToolRailContent={showExpandedToolRailContent}
          summaryAtomCount={summary.atomCount}
          toolRailBodyClassName={toolRailBodyClassName}
          toolRailCollapsedWidthClassName={toolRailCollapsedWidthClassName}
          toolRailExpandedWidthClassName={toolRailExpandedWidthClassName}
          toolRailStyle={toolRailStyle}
        />

        <div
          ref={canvasFrameRef}
          className={canvasFrameClassName}
        >
          {isSimplifiedView ? (
            <div
              className="absolute inset-0 overflow-y-auto overscroll-contain"
              style={simplifiedViewStyle}
            >
              <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col justify-start gap-2.5 sm:gap-4 lg:justify-center">
                <div className="rounded-[24px] border border-(--border-subtle) bg-(--surface-overlay-soft) px-3.5 py-4 text-center shadow-sm backdrop-blur-sm sm:px-6 sm:py-7 lg:px-7 lg:py-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-(--text-muted) sm:text-[11px]">
                    Simplified
                  </p>
                  <p className="mt-2.5 wrap-break-word text-[clamp(1.5rem,8vw,4.5rem)] font-black leading-[0.96] tracking-[0.03em] text-foreground">
                    {formulaDisplayValue}
                  </p>
                  <p className="mx-auto mt-2.5 max-w-2xl text-[11px] leading-relaxed text-(--text-muted) sm:mt-4 sm:text-sm">
                    {moleculeComponents.length > 1
                      ? `Compact composition view for Mol ${resolvedFocusedComponentIndex + 1}.`
                      : 'Compact composition view for the current molecule.'}
                  </p>
                </div>

                {compositionRows.length > 0 ? (
                  <dl className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {compositionRows.map((row) => (
                      <div
                        key={row.symbol}
                        className="rounded-2xl border border-(--border-subtle) bg-(--surface-overlay-faint) px-3.5 py-3 shadow-sm backdrop-blur-sm"
                      >
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.15em] text-(--text-muted)">
                          {row.name}
                        </dt>
                        <dd className="mt-2 flex items-end justify-between gap-3">
                          <span className="text-xl font-black text-foreground sm:text-2xl">{row.symbol}</span>
                          <span className="text-base font-semibold text-foreground sm:text-lg">{row.count}</span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <div className="rounded-2xl border border-dashed border-(--border-subtle) bg-(--surface-overlay-subtle) px-4 py-5 text-center text-sm text-(--text-muted)">
                    Add atoms to generate a simplified formula.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <EditorCanvas
              model={molecule}
              mode={activeView}
              viewBox={interactiveViewBox}
              selectedAtomId={selectedAtomId}
              svgRef={svgRef}
              onCanvasPointerDown={onCanvasPointerDown}
              onCanvasPointerMove={onCanvasPointerMove}
              onCanvasPointerUp={onCanvasPointerUp}
              onCanvasPointerCancel={onCanvasPointerCancel}
              onCanvasWheel={onCanvasWheel}
              onAtomPointerDown={onAtomPointerDown}
            />
          )}
        </div>

        {isSimplifiedView || resolvedEditorNotice === null ? null : (
          <div className={compactBottomOverlayClassName}>
            <div ref={bottomNoticeRef} className={compactBottomNoticeClassName} title={resolvedEditorNotice}>
              {compactDisplayedEditorNotice}
            </div>
          </div>
        )}

        {isSimplifiedView ? null : (
          <MoleculeSummaryPanel
            isCompact={isLandscapeCompactCanvas}
            isOpen={isFormulaPanelOpen}
            rows={formulaStatsRows}
            style={formulaPanelStyle}
            onToggle={() => setIsFormulaPanelOpen((current) => !current)}
          />
        )}
      </div>

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
