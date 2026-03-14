'use client';

import { useMemo } from 'react';
import type { ComponentProps, CSSProperties, RefObject } from 'react';

import MoleculeEditorCanvasPanel from '@/components/organisms/molecular-editor/MoleculeEditorCanvasPanel';
import MoleculeEditorSection from '@/components/organisms/molecular-editor/MoleculeEditorSection';
import MoleculePaletteRail from '@/components/organisms/molecular-editor/MoleculePaletteRail';
import MoleculeSummaryPanel from '@/components/organisms/molecular-editor/MoleculeSummaryPanel';
import type { SavedMoleculeEditorState } from '@/shared/types/molecule';
import type { MoleculeComponent, MoleculeModel } from '@/shared/utils/moleculeEditor';

type EditorViewMode = SavedMoleculeEditorState['activeView'];
type BondOrder = 1 | 2 | 3;

type CompositionRow = {
  symbol: string;
  name: string;
  count: number;
};

type FormulaRow = ComponentProps<typeof MoleculeSummaryPanel>['rows'][number];
type PaletteRailProps = ComponentProps<typeof MoleculePaletteRail>;

type UseMoleculeEditorSectionPropsOptions = {
  activeElementMaxBondSlots: number | null;
  activeElementSymbol: string | null;
  activeView: EditorViewMode;
  bondOrder: BondOrder;
  bondOrderOptions: Array<{ order: BondOrder; label: string }>;
  bottomNoticeRef: RefObject<HTMLDivElement | null>;
  canRedo: boolean;
  canUndo: boolean;
  canvasFrameClassName: string;
  canvasFrameRef: RefObject<HTMLDivElement | null>;
  canvasPanelClassName: string;
  canvasPanelStyle: CSSProperties;
  collapsedToolRailSectionClassName: string;
  compactBottomNoticeClassName: string;
  compactBottomOverlayClassName: string;
  compactDisplayedEditorNotice: string | null;
  compositionRows: CompositionRow[];
  effectiveToolRailCollapsed: boolean;
  expandedToolRailSectionClassName: string;
  filteredElements: PaletteRailProps['elements'];
  floatingSaveShortcutInnerStyle: CSSProperties;
  floatingSaveShortcutPanelStyle: CSSProperties;
  floatingSaveShortcutTriggerStyle: CSSProperties;
  focusedComponentIndex: number;
  formulaDisplayValue: string;
  formulaPanelStyle: CSSProperties;
  formulaStatsRows: FormulaRow[];
  goToNextPaletteElement: () => void;
  goToPreviousPaletteElement: () => void;
  hasActivePaletteFilter: boolean;
  importButtonClassName: string;
  interactiveViewBox: ComponentProps<typeof MoleculeEditorCanvasPanel>['interactiveViewBox'];
  isFloatingSaveShortcutExpanded: boolean;
  isFormulaPanelOpen: boolean;
  isLandscapeCompactCanvas: boolean;
  isPaletteMoving: boolean;
  isPalettePointerActive: boolean;
  isPaletteSearchOpen: boolean;
  isSaveModalOpen: boolean;
  isSimplifiedView: boolean;
  molecule: MoleculeModel;
  moleculeComponents: MoleculeComponent[];
  onAddSelectedElement: () => void;
  onAtomPointerDown: ComponentProps<typeof MoleculeEditorCanvasPanel>['onAtomPointerDown'];
  onCanvasPointerCancel: ComponentProps<typeof MoleculeEditorCanvasPanel>['onCanvasPointerCancel'];
  onCanvasPointerDown: ComponentProps<typeof MoleculeEditorCanvasPanel>['onCanvasPointerDown'];
  onCanvasPointerMove: ComponentProps<typeof MoleculeEditorCanvasPanel>['onCanvasPointerMove'];
  onCanvasPointerUp: ComponentProps<typeof MoleculeEditorCanvasPanel>['onCanvasPointerUp'];
  onCanvasWheel: ComponentProps<typeof MoleculeEditorCanvasPanel>['onCanvasWheel'];
  onClearPaletteSearch: () => void;
  onClearSelection: () => void;
  onClosePaletteSearch: () => void;
  onFocusComponent: (componentIndex: number) => void;
  onFloatingSaveShortcutExpandedChange: (value: boolean) => void;
  onItemRef: PaletteRailProps['onItemRef'];
  onOpenImportModal: () => void;
  onOpenSaveModal: () => void;
  onPalettePointerCancel: PaletteRailProps['onPalettePointerCancel'];
  onPalettePointerDown: PaletteRailProps['onPalettePointerDown'];
  onPalettePointerMove: PaletteRailProps['onPalettePointerMove'];
  onPalettePointerUp: PaletteRailProps['onPalettePointerUp'];
  onPaletteScroll: PaletteRailProps['onPaletteScroll'];
  onPaletteSearchChange: (value: string) => void;
  onRedo: () => void;
  onRemoveSelectedAtom: () => void;
  onResetCanvasView: () => void;
  onResetMolecule: () => void;
  onSetActiveView: (nextView: EditorViewMode) => void;
  onSetBondOrder: (order: BondOrder) => void;
  onToggleCollapsed: () => void;
  onToggleFormulaPanel: () => void;
  onTogglePaletteSearch: () => void;
  onUndo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  overlayRef: RefObject<HTMLDivElement | null>;
  overlayClassName: string;
  paletteEdgePadding: number;
  paletteQuery: string;
  paletteRowClassName: string;
  paletteSearchButtonClassName: string;
  paletteSearchInnerStyle: CSSProperties;
  paletteSearchPanelStyle: CSSProperties;
  paletteSearchRailRef: RefObject<HTMLDivElement | null>;
  paletteSearchRailStyle: CSSProperties;
  paletteSearchShellClassName: string;
  paletteSearchTriggerStyle: CSSProperties;
  paletteViewportRef: RefObject<HTMLDivElement | null>;
  paletteViewportWrapperClassName: string;
  resolvedCenterPaletteIndex: number;
  resolvedEditorNotice: string | null;
  resolvedExpandedPaletteIndex: number;
  responsiveLayoutWidth: number;
  searchInputRef: RefObject<HTMLInputElement | null>;
  selectedAtomId: string | null;
  shouldShowComponentFocusRail: boolean;
  shouldShowFloatingSaveShortcut: boolean;
  shouldShowToolRail: boolean;
  showExpandedToolRailContent: boolean;
  simplifiedViewStyle: CSSProperties;
  summaryAtomCount: number;
  svgRef: RefObject<SVGSVGElement | null>;
  toolRailBodyClassName: string;
  toolRailCollapsedWidthClassName: string;
  toolRailExpandedWidthClassName: string;
  toolRailStyle: CSSProperties;
  topControlsBlockClassName: string;
  topControlsLeadingGroupClassName: string;
  topControlsRef: RefObject<HTMLDivElement | null>;
  topControlsRowClassName: string;
  viewModeButtonClassName: string;
  viewModeTabsClassName: string;
  viewOptions: Array<{ mode: EditorViewMode; label: string }>;
  zoomControlsClassName: string;
  zoomControlsVisibilityClassName: string;
  zoomPercent: number;
};

export default function useMoleculeEditorSectionProps({
  activeElementMaxBondSlots,
  activeElementSymbol,
  activeView,
  bondOrder,
  bondOrderOptions,
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
  focusedComponentIndex,
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
  onFloatingSaveShortcutExpandedChange,
  onItemRef,
  onOpenImportModal,
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
  onToggleCollapsed,
  onToggleFormulaPanel,
  onTogglePaletteSearch,
  onUndo,
  onZoomIn,
  onZoomOut,
  overlayRef,
  overlayClassName,
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
  summaryAtomCount,
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
  viewOptions,
  zoomControlsClassName,
  zoomControlsVisibilityClassName,
  zoomPercent,
}: UseMoleculeEditorSectionPropsOptions): ComponentProps<typeof MoleculeEditorSection> {
  return useMemo(
    () => ({
      topControlsBlockClassName,
      topControlsRef,
      topBarProps: {
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
        viewOptions,
        zoomControlsClassName,
        zoomControlsVisibilityClassName,
        zoomPercent,
      },
      showComponentFocusRail: shouldShowComponentFocusRail,
      componentFocusRailProps: {
        components: moleculeComponents,
        focusedComponentIndex,
        isCompact: isLandscapeCompactCanvas,
        onFocusComponent,
      },
      canvasPanelProps: {
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
        focusedComponentIndex,
        formulaDisplayValue,
        formulaPanelProps: {
          isCompact: isLandscapeCompactCanvas,
          isOpen: isFormulaPanelOpen,
          rows: formulaStatsRows,
          style: formulaPanelStyle,
          onToggle: onToggleFormulaPanel,
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
          overlayRef,
          overlayClassName,
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
          onItemRef,
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
          activeElementSymbol,
          bondOrder,
          bondOrderOptions,
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
          onFloatingSaveShortcutExpandedChange,
          onOpenSaveModal,
          onRedo,
          onRemoveSelectedAtom,
          onResetMolecule,
          onSetBondOrder,
          onToggleCollapsed,
          onUndo,
          selectedAtomId,
          shouldShowFloatingSaveShortcut,
          shouldShowToolRail,
          showExpandedToolRailContent,
          summaryAtomCount,
          toolRailBodyClassName,
          toolRailCollapsedWidthClassName,
          toolRailExpandedWidthClassName,
          toolRailStyle,
        },
      },
    }),
    [
      activeElementMaxBondSlots,
      activeElementSymbol,
      activeView,
      bondOrder,
      bondOrderOptions,
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
      focusedComponentIndex,
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
      onFloatingSaveShortcutExpandedChange,
      onItemRef,
      onOpenImportModal,
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
      onToggleCollapsed,
      onToggleFormulaPanel,
      onTogglePaletteSearch,
      onUndo,
      onZoomIn,
      onZoomOut,
      overlayRef,
      overlayClassName,
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
      summaryAtomCount,
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
      viewOptions,
      zoomControlsClassName,
      zoomControlsVisibilityClassName,
      zoomPercent,
    ],
  );
}
