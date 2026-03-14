'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import MoleculeEditorFeedbackToast from '@/components/organisms/molecular-editor/MoleculeEditorFeedbackToast';
import MoleculeGallerySection from '@/components/organisms/molecular-editor/MoleculeGallerySection';
import MoleculeImportModal from '@/components/organisms/molecular-editor/MoleculeImportModal';
import MoleculeSaveModal from '@/components/organisms/molecular-editor/MoleculeSaveModal';
import MoleculeEditorSection from '@/components/organisms/molecular-editor/MoleculeEditorSection';
import useMoleculeEditorActions from '@/components/organisms/molecular-editor/useMoleculeEditorActions';
import useMoleculeEditorLayout from '@/components/organisms/molecular-editor/useMoleculeEditorLayout';
import {
  type CanvasViewport,
  cloneEditorSnapshot,
  cloneMoleculeModel,
  type EditorViewMode,
  normalizeOptionalText,
  normalizeSavedMoleculeRecord,
  normalizeSnapshotSelectedAtomId,
  type SavedEditorDraft,
} from '@/components/organisms/molecular-editor/moleculeEditorSession';
import {
  resolveInteractiveViewBox,
} from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import useCanvasInteractions from '@/components/organisms/molecular-editor/useCanvasInteractions';
import useEditorHistory from '@/components/organisms/molecular-editor/useEditorHistory';
import useMoleculePaletteController from '@/components/organisms/molecular-editor/useMoleculePaletteController';
import useMoleculeEditorSession from '@/components/organisms/molecular-editor/useMoleculeEditorSession';
import useMoleculeEditorShortcuts from '@/components/organisms/molecular-editor/useMoleculeEditorShortcuts';
import useSavedMoleculeWorkflow from '@/components/organisms/molecular-editor/useSavedMoleculeWorkflow';
import type {
  SaveMoleculeInput,
  SavedMolecule,
} from '@/shared/types/molecule';
import type { ChemicalElement } from '@/shared/types/element';
import {
  syncMoleculeIdCounter,
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

const EDITOR_HISTORY_LIMIT = 80;

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
  const [canvasViewport, setCanvasViewport] = useState<CanvasViewport>(DEFAULT_CANVAS_VIEWPORT);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const clearPendingCanvasPlacementRef = useRef<() => void>(() => undefined);
  const clearTransientEditorStateRef = useRef<() => void>(() => undefined);

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

  const {
    activeElementMaxBondSlots,
    applyEditorSnapshot,
    buildHistorySnapshot,
    buildSaveMoleculeInput,
    compositionRows,
    focusedSummary,
    formula,
    formulaDisplayValue,
    formulaStatsRows,
    galleryFeedback,
    moleculeComponents,
    normalizedSavedMolecules,
    resolvedFocusedComponentIndex,
    showGalleryFeedback,
    summary,
    systematicNameDisplayValue,
  } = useMoleculeEditorSession({
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
  });

  const { canRedo, canUndo, clearHistory, onRedo, onUndo, pushHistorySnapshot } = useEditorHistory<SavedEditorDraft>({
    limit: EDITOR_HISTORY_LIMIT,
    cloneSnapshot: cloneEditorSnapshot,
    buildCurrentSnapshot: buildHistorySnapshot,
    applySnapshot: applyEditorSnapshot,
  });

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

  const onSetActiveView = useCallback(
    (nextView: EditorViewMode) => {
      setIsFloatingSaveShortcutExpanded(false);
      setActiveView(nextView);
    },
    [],
  );

  const onSetBondOrder = useCallback(
    (nextBondOrder: BondOrder) => {
      setBondOrder(nextBondOrder);
    },
    [],
  );

  const {
    handleAtomActivate,
    handleCanvasPlacement,
    onAddSelectedElement,
    onCanvasWheel,
    onClearSelection,
    onFocusComponent,
    onImportExternalMolecule,
    onRemoveSelectedAtom,
    onResetCanvasView,
    onResetMolecule,
    onZoomIn,
    onZoomOut,
  } = useMoleculeEditorActions<SavedEditorDraft>({
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

  useEffect(() => {
    clearPendingCanvasPlacementRef.current = clearPendingCanvasPlacement;
    clearTransientEditorStateRef.current = clearTransientEditorState;
  }, [clearPendingCanvasPlacement, clearTransientEditorState]);

  const onOpenImportModal = useCallback(() => {
    setIsFloatingSaveShortcutExpanded(false);
    onCloseSaveModal();
    setIsImportModalOpen(true);
  }, [onCloseSaveModal]);

  const onCloseImportModal = useCallback(() => {
    setIsImportModalOpen(false);
  }, []);

  useMoleculeEditorShortcuts({
    isImportModalOpen,
    isSaveModalOpen,
    isTextEditingElement,
    onRedo,
    onUndo,
  });

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

  return (
    <section className="flex min-h-0 flex-col gap-3 overflow-visible pb-4" style={editorSectionStyle}>
      {isEditorPage ? (
        <MoleculeEditorSection
          topControlsBlockClassName={topControlsBlockClassName}
          topControlsRef={topControlsRef}
          topBarProps={{
            activeView,
            importButtonClassName,
            isLandscapeCompactCanvas,
            isSimplifiedView,
            onOpenImportModal,
            onResetCanvasView,
            onSetActiveView,
            onZoomIn,
            onZoomOut,
            responsiveLayoutWidth,
            topControlsLeadingGroupClassName,
            topControlsRowClassName,
            viewModeButtonClassName,
            viewModeTabsClassName,
            viewOptions: VIEW_OPTIONS,
            zoomControlsClassName,
            zoomControlsVisibilityClassName,
            zoomPercent,
          }}
          showComponentFocusRail={shouldShowComponentFocusRail}
          componentFocusRailProps={{
            components: moleculeComponents,
            focusedComponentIndex: resolvedFocusedComponentIndex,
            isCompact: isLandscapeCompactCanvas,
            onFocusComponent,
          }}
          canvasPanelProps={{
            activeView,
            bottomNoticeRef,
            canvasFrameClassName,
            canvasFrameRef,
            canvasPanelClassName,
            canvasPanelStyle,
            compactBottomNoticeClassName,
            compactBottomOverlayClassName,
            compactDisplayedEditorNotice,
            compositionRows,
            focusedComponentIndex: resolvedFocusedComponentIndex,
            formulaDisplayValue,
            formulaPanelProps: {
              isCompact: isLandscapeCompactCanvas,
              isOpen: isFormulaPanelOpen,
              rows: formulaStatsRows,
              style: formulaPanelStyle,
              onToggle: () => setIsFormulaPanelOpen((current) => !current),
            },
            interactiveViewBox,
            isLandscapeCompactCanvas,
            isPaletteSearchOpen,
            isSimplifiedView,
            molecule,
            moleculeComponentsCount: moleculeComponents.length,
            onAtomPointerDown,
            onCanvasPointerCancel,
            onCanvasPointerDown,
            onCanvasPointerMove,
            onCanvasPointerUp,
            onCanvasWheel,
            onClearPaletteSearch,
            onClosePaletteSearch,
            onPaletteSearchChange,
            onTogglePaletteSearch,
            paletteQuery,
            paletteRailProps: {
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
            },
            paletteSearchButtonClassName,
            paletteSearchInnerStyle,
            paletteSearchPanelStyle,
            paletteSearchRailRef,
            paletteSearchRailStyle,
            paletteSearchShellClassName,
            paletteSearchTriggerStyle,
            resolvedEditorNotice,
            searchInputRef,
            shouldShowActivePaletteFilter: hasActivePaletteFilter,
            simplifiedViewStyle,
            svgRef,
            toolRailProps: {
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
            },
          }}
        />
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

      <MoleculeEditorFeedbackToast feedback={galleryFeedback} pageMode={pageMode} />
    </section>
  );
}

export default memo(MolecularEditor);
