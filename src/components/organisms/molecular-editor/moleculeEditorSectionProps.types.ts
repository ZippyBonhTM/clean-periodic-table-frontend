'use client';

import type { CSSProperties, RefObject } from 'react';

import type { CanvasPanelProps } from '@/components/organisms/molecular-editor/moleculeEditorCanvasPanelProps.types';
import type {
  BondOrder,
  CompositionRow,
  EditorViewMode,
  FormulaRow,
  PaletteRailProps,
} from '@/components/organisms/molecular-editor/moleculeEditorPanelShared.types';
import type { MoleculeComponent, MoleculeModel } from '@/shared/utils/moleculeEditor';

export type UseMoleculeEditorSectionPropsOptions = {
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
  interactiveViewBox: CanvasPanelProps['interactiveViewBox'];
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
  onAtomPointerDown: CanvasPanelProps['onAtomPointerDown'];
  onCanvasPointerCancel: CanvasPanelProps['onCanvasPointerCancel'];
  onCanvasPointerDown: CanvasPanelProps['onCanvasPointerDown'];
  onCanvasPointerMove: CanvasPanelProps['onCanvasPointerMove'];
  onCanvasPointerUp: CanvasPanelProps['onCanvasPointerUp'];
  onCanvasWheel: CanvasPanelProps['onCanvasWheel'];
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

export type UseMoleculeEditorTopBarPropsOptions = Pick<
  UseMoleculeEditorSectionPropsOptions,
  | 'activeView'
  | 'importButtonClassName'
  | 'isLandscapeCompactCanvas'
  | 'isSimplifiedView'
  | 'onOpenImportModal'
  | 'onResetCanvasView'
  | 'onSetActiveView'
  | 'onZoomIn'
  | 'onZoomOut'
  | 'responsiveLayoutWidth'
  | 'topControlsLeadingGroupClassName'
  | 'topControlsRowClassName'
  | 'viewModeButtonClassName'
  | 'viewModeTabsClassName'
  | 'viewOptions'
  | 'zoomControlsClassName'
  | 'zoomControlsVisibilityClassName'
  | 'zoomPercent'
>;

export type UseMoleculeEditorToolRailPropsOptions = Pick<
  UseMoleculeEditorSectionPropsOptions,
  | 'activeElementMaxBondSlots'
  | 'activeElementSymbol'
  | 'bondOrder'
  | 'bondOrderOptions'
  | 'canRedo'
  | 'canUndo'
  | 'collapsedToolRailSectionClassName'
  | 'effectiveToolRailCollapsed'
  | 'expandedToolRailSectionClassName'
  | 'floatingSaveShortcutInnerStyle'
  | 'floatingSaveShortcutPanelStyle'
  | 'floatingSaveShortcutTriggerStyle'
  | 'isFloatingSaveShortcutExpanded'
  | 'isLandscapeCompactCanvas'
  | 'isSaveModalOpen'
  | 'onAddSelectedElement'
  | 'onClearSelection'
  | 'onFloatingSaveShortcutExpandedChange'
  | 'onOpenSaveModal'
  | 'onRedo'
  | 'onRemoveSelectedAtom'
  | 'onResetMolecule'
  | 'onSetBondOrder'
  | 'onToggleCollapsed'
  | 'onUndo'
  | 'selectedAtomId'
  | 'shouldShowFloatingSaveShortcut'
  | 'shouldShowToolRail'
  | 'showExpandedToolRailContent'
  | 'summaryAtomCount'
  | 'toolRailBodyClassName'
  | 'toolRailCollapsedWidthClassName'
  | 'toolRailExpandedWidthClassName'
  | 'toolRailStyle'
>;
