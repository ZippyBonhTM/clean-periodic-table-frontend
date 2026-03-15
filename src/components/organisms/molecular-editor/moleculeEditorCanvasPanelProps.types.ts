'use client';

import type { ComponentProps, CSSProperties, RefObject } from 'react';

import type MoleculeEditorCanvasPanel from '@/components/organisms/molecular-editor/MoleculeEditorCanvasPanel';
import type {
  CompositionRow,
  EditorViewMode,
  FormulaRow,
  PaletteRailProps,
  ToolRailProps,
} from '@/components/organisms/molecular-editor/moleculeEditorPanelShared.types';
import type { MoleculeComponent, MoleculeModel } from '@/shared/utils/moleculeEditor';

export type CanvasPanelProps = ComponentProps<typeof MoleculeEditorCanvasPanel>;

export type UseMoleculeEditorCanvasPanelPropsOptions = {
  activeView: EditorViewMode;
  bottomNoticeRef: RefObject<HTMLDivElement | null>;
  canvasFrameClassName: string;
  canvasFrameRef: RefObject<HTMLDivElement | null>;
  canvasPanelClassName: string;
  canvasPanelStyle: CSSProperties;
  compactBottomNoticeClassName: string;
  compactBottomOverlayClassName: string;
  compactDisplayedEditorNotice: string | null;
  compositionRows: CompositionRow[];
  filteredElements: PaletteRailProps['elements'];
  focusedComponentIndex: number;
  formulaDisplayValue: string;
  formulaPanelStyle: CSSProperties;
  formulaStatsRows: FormulaRow[];
  goToNextPaletteElement: () => void;
  goToPreviousPaletteElement: () => void;
  hasActivePaletteFilter: boolean;
  interactiveViewBox: CanvasPanelProps['interactiveViewBox'];
  isFormulaPanelOpen: boolean;
  isLandscapeCompactCanvas: boolean;
  isPaletteMoving: boolean;
  isPalettePointerActive: boolean;
  isPaletteSearchOpen: boolean;
  isSimplifiedView: boolean;
  molecule: MoleculeModel;
  moleculeComponents: MoleculeComponent[];
  onAtomPointerDown: CanvasPanelProps['onAtomPointerDown'];
  onCanvasPointerCancel: CanvasPanelProps['onCanvasPointerCancel'];
  onCanvasPointerDown: CanvasPanelProps['onCanvasPointerDown'];
  onCanvasPointerMove: CanvasPanelProps['onCanvasPointerMove'];
  onCanvasPointerUp: CanvasPanelProps['onCanvasPointerUp'];
  onCanvasWheel: CanvasPanelProps['onCanvasWheel'];
  onClearPaletteSearch: () => void;
  onClosePaletteSearch: () => void;
  onItemRef: PaletteRailProps['onItemRef'];
  onPalettePointerCancel: PaletteRailProps['onPalettePointerCancel'];
  onPalettePointerDown: PaletteRailProps['onPalettePointerDown'];
  onPalettePointerMove: PaletteRailProps['onPalettePointerMove'];
  onPalettePointerUp: PaletteRailProps['onPalettePointerUp'];
  onPaletteScroll: PaletteRailProps['onPaletteScroll'];
  onPaletteSearchChange: (value: string) => void;
  onToggleFormulaPanel: () => void;
  onTogglePaletteSearch: () => void;
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
  searchInputRef: RefObject<HTMLInputElement | null>;
  simplifiedViewStyle: CSSProperties;
  svgRef: RefObject<SVGSVGElement | null>;
  toolRailProps: ToolRailProps;
};

export type UseMoleculeFormulaPanelPropsOptions = Pick<
  UseMoleculeEditorCanvasPanelPropsOptions,
  'formulaPanelStyle' | 'formulaStatsRows' | 'isFormulaPanelOpen' | 'isLandscapeCompactCanvas' | 'onToggleFormulaPanel'
>;

export type UseMoleculePaletteRailPropsOptions = Pick<
  UseMoleculeEditorCanvasPanelPropsOptions,
  | 'filteredElements'
  | 'goToNextPaletteElement'
  | 'goToPreviousPaletteElement'
  | 'isLandscapeCompactCanvas'
  | 'isPaletteMoving'
  | 'isPalettePointerActive'
  | 'onItemRef'
  | 'onPalettePointerCancel'
  | 'onPalettePointerDown'
  | 'onPalettePointerMove'
  | 'onPalettePointerUp'
  | 'onPaletteScroll'
  | 'overlayClassName'
  | 'overlayRef'
  | 'paletteEdgePadding'
  | 'paletteRowClassName'
  | 'paletteViewportRef'
  | 'paletteViewportWrapperClassName'
  | 'resolvedCenterPaletteIndex'
  | 'resolvedExpandedPaletteIndex'
>;
