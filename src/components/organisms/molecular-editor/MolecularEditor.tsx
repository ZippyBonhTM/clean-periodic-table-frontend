'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import MoleculeComponentFocusRail from '@/components/organisms/molecular-editor/MoleculeComponentFocusRail';
import MoleculeEditorCanvasPanel from '@/components/organisms/molecular-editor/MoleculeEditorCanvasPanel';
import MoleculeGallerySection from '@/components/organisms/molecular-editor/MoleculeGallerySection';
import MoleculeImportModal from '@/components/organisms/molecular-editor/MoleculeImportModal';
import MoleculeSaveModal from '@/components/organisms/molecular-editor/MoleculeSaveModal';
import MoleculeEditorTopBar from '@/components/organisms/molecular-editor/MoleculeEditorTopBar';
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
