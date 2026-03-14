'use client';

import { memo, useEffect, useMemo } from 'react';

import MoleculeGallerySection from '@/components/organisms/molecular-editor/MoleculeGallerySection';
import MoleculeEditorOverlays from '@/components/organisms/molecular-editor/MoleculeEditorOverlays';
import MoleculeEditorSection from '@/components/organisms/molecular-editor/MoleculeEditorSection';
import useMoleculeEditorActions from '@/components/organisms/molecular-editor/useMoleculeEditorActions';
import {
  BOND_ORDER_OPTIONS,
  DEFAULT_CANVAS_VIEWPORT,
  DEFAULT_EDITOR_NOTICE,
  EMPTY_MOLECULE,
  isTextEditingElement,
  VIEW_OPTIONS,
} from '@/components/organisms/molecular-editor/moleculeEditorConfig';
import useMoleculeEditorLayout from '@/components/organisms/molecular-editor/useMoleculeEditorLayout';
import {
  cloneMoleculeModel,
  normalizeSnapshotSelectedAtomId,
  type SavedEditorDraft,
} from '@/components/organisms/molecular-editor/moleculeEditorSession';
import {
  resolveInteractiveViewBox,
} from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import useCanvasInteractions from '@/components/organisms/molecular-editor/useCanvasInteractions';
import useMoleculePaletteController from '@/components/organisms/molecular-editor/useMoleculePaletteController';
import useMoleculeEditorSession from '@/components/organisms/molecular-editor/useMoleculeEditorSession';
import useMoleculeEditorShortcuts from '@/components/organisms/molecular-editor/useMoleculeEditorShortcuts';
import useMoleculeEditorState from '@/components/organisms/molecular-editor/useMoleculeEditorState';
import useMoleculeEditorSectionProps from '@/components/organisms/molecular-editor/useMoleculeEditorSectionProps';
import useSavedMoleculeEditorWorkflow from '@/components/organisms/molecular-editor/useSavedMoleculeEditorWorkflow';
import type {
  SaveMoleculeInput,
  SavedMolecule,
} from '@/shared/types/molecule';
import type { ChemicalElement } from '@/shared/types/element';

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
  const {
    activeSavedMoleculeId,
    activeView,
    bondOrder,
    canvasViewport,
    clearPendingCanvasPlacementRef,
    clearTransientEditorStateRef,
    editorNotice,
    focusedComponentIndex,
    isFloatingSaveShortcutExpanded,
    isFormulaPanelOpen,
    isImportModalOpen,
    isToolRailCollapsed,
    molecule,
    moleculeEducationalDescription,
    moleculeName,
    nomenclatureFallback,
    onCloseImportModal,
    onOpenImportModal,
    onSetActiveView,
    onSetBondOrder,
    selectedAtomId,
    setActiveSavedMoleculeId,
    setActiveView,
    setBondOrder,
    setCanvasViewport,
    setEditorNotice,
    setFocusedComponentIndex,
    setIsFloatingSaveShortcutExpanded,
    setIsFormulaPanelOpen,
    setIsImportModalOpen,
    setIsToolRailCollapsed,
    setMolecule,
    setMoleculeEducationalDescription,
    setMoleculeName,
    setNomenclatureFallback,
    setSelectedAtomId,
    svgRef,
  } = useMoleculeEditorState();

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

  const {
    currentSaveLabel,
    hasCheckedPendingSavedMolecule,
    hasCurrentSavedSelection,
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
  } = useSavedMoleculeEditorWorkflow({
    activeSavedMoleculeId,
    applyEditorSnapshot,
    buildSaveMoleculeInput,
    closeImportModal: onCloseImportModal,
    collapseFloatingSaveShortcut: () => setIsFloatingSaveShortcutExpanded(false),
    clearHistory,
    formula,
    isSavedMoleculesLoading,
    moleculeName,
    normalizedSavedMolecules,
    onCreateSavedMolecule,
    onDeleteSavedMolecule,
    onUpdateSavedMolecule,
    pageMode,
    setActiveSavedMoleculeId,
    setMoleculeEducationalDescription,
    setMoleculeName,
    setNomenclatureFallback,
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
  }, [
    clearPendingCanvasPlacement,
    clearPendingCanvasPlacementRef,
    clearTransientEditorState,
    clearTransientEditorStateRef,
  ]);

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
  const editorSectionProps = useMoleculeEditorSectionProps({
    activeElementMaxBondSlots,
    activeElementSymbol: activeElement?.symbol ?? null,
    activeView,
    bondOrder,
    bondOrderOptions: BOND_ORDER_OPTIONS,
    bottomNoticeRef,
    canRedo,
    canUndo,
    canvasFrameClassName,
    canvasFrameRef,
    canvasPanelClassName,
    canvasPanelStyle,
    collapsedToolRailSectionClassName,
    compactBottomNoticeClassName,
    compactBottomOverlayClassName,
    compactDisplayedEditorNotice,
    compositionRows,
    effectiveToolRailCollapsed,
    expandedToolRailSectionClassName,
    filteredElements,
    floatingSaveShortcutInnerStyle,
    floatingSaveShortcutPanelStyle,
    floatingSaveShortcutTriggerStyle,
    focusedComponentIndex: resolvedFocusedComponentIndex,
    formulaDisplayValue,
    formulaPanelStyle,
    formulaStatsRows,
    goToNextPaletteElement,
    goToPreviousPaletteElement,
    hasActivePaletteFilter,
    importButtonClassName,
    interactiveViewBox,
    isFloatingSaveShortcutExpanded,
    isFormulaPanelOpen,
    isLandscapeCompactCanvas,
    isPaletteMoving,
    isPalettePointerActive,
    isPaletteSearchOpen,
    isSaveModalOpen,
    isSimplifiedView,
    molecule,
    moleculeComponents,
    onAddSelectedElement,
    onAtomPointerDown,
    onCanvasPointerCancel,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
    onCanvasWheel,
    onClearPaletteSearch,
    onClearSelection,
    onClosePaletteSearch,
    onFocusComponent,
    onFloatingSaveShortcutExpandedChange: setIsFloatingSaveShortcutExpanded,
    onItemRef: onPaletteItemRef,
    onOpenImportModal: () => onOpenImportModal(onCloseSaveModal),
    onOpenSaveModal,
    onPalettePointerCancel,
    onPalettePointerDown,
    onPalettePointerMove,
    onPalettePointerUp,
    onPaletteScroll,
    onPaletteSearchChange,
    onRedo,
    onRemoveSelectedAtom,
    onResetCanvasView,
    onResetMolecule,
    onSetActiveView,
    onSetBondOrder,
    onToggleCollapsed: () => setIsToolRailCollapsed((current) => !current),
    onToggleFormulaPanel: () => setIsFormulaPanelOpen((current) => !current),
    onTogglePaletteSearch,
    onUndo,
    onZoomIn,
    onZoomOut,
    overlayRef: topOverlayRef,
    overlayClassName: topOverlayClassName,
    paletteEdgePadding,
    paletteQuery,
    paletteRowClassName,
    paletteSearchButtonClassName,
    paletteSearchInnerStyle,
    paletteSearchPanelStyle,
    paletteSearchRailRef,
    paletteSearchRailStyle,
    paletteSearchShellClassName,
    paletteSearchTriggerStyle,
    paletteViewportRef,
    paletteViewportWrapperClassName,
    resolvedCenterPaletteIndex,
    resolvedEditorNotice,
    resolvedExpandedPaletteIndex,
    responsiveLayoutWidth,
    searchInputRef,
    selectedAtomId,
    shouldShowComponentFocusRail,
    shouldShowFloatingSaveShortcut,
    shouldShowToolRail,
    showExpandedToolRailContent,
    simplifiedViewStyle,
    summaryAtomCount: summary.atomCount,
    svgRef,
    toolRailBodyClassName,
    toolRailCollapsedWidthClassName,
    toolRailExpandedWidthClassName,
    toolRailStyle,
    topControlsBlockClassName,
    topControlsLeadingGroupClassName,
    topControlsRef,
    topControlsRowClassName,
    viewModeButtonClassName,
    viewModeTabsClassName,
    viewOptions: VIEW_OPTIONS,
    zoomControlsClassName,
    zoomControlsVisibilityClassName,
    zoomPercent,
  });

  return (
    <section className="flex min-h-0 flex-col gap-3 overflow-visible pb-4" style={editorSectionStyle}>
      {isEditorPage ? <MoleculeEditorSection {...editorSectionProps} /> : null}

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

      <MoleculeEditorOverlays
        feedback={galleryFeedback}
        importModalProps={{
          isOpen: isImportModalOpen,
          elements,
          onClose: onCloseImportModal,
          onImport: onImportExternalMolecule,
        }}
        pageMode={pageMode}
        saveModalProps={{
          context: isGalleryPage ? 'gallery' : 'editor',
          isOpen: isSaveModalOpen,
          hasLinkedSelection: hasCurrentSavedSelection,
          currentSaveLabel,
          moleculeTitle: moleculeName,
          educationalDescription: moleculeEducationalDescription,
          formula: formulaDisplayValue,
          nomenclature: systematicNameDisplayValue,
          atomCount: focusedSummary.atomCount,
          bondCount: focusedSummary.bondCount,
          componentCount: moleculeComponents.length,
          focusedComponentLabel:
            moleculeComponents.length > 1
              ? `Mol ${resolvedFocusedComponentIndex + 1} / ${moleculeComponents.length}`
              : null,
          isMutating: isSavedMoleculesMutating,
          onClose: onCloseSaveModal,
          onMoleculeTitleChange: setMoleculeName,
          onEducationalDescriptionChange: setMoleculeEducationalDescription,
          onSaveAsNew: onSaveAsNewMolecule,
          onUpdateSelected: onUpdateCurrentSavedMolecule,
          onDetachSelection: onDetachSavedMolecule,
          onDeleteSelected: onDeleteCurrentSavedMolecule,
        }}
      />
    </section>
  );
}

export default memo(MolecularEditor);
