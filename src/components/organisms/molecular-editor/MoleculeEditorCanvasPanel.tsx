'use client';

import type {
  CSSProperties,
  ComponentProps,
  PointerEvent as ReactPointerEvent,
  RefObject,
  WheelEvent as ReactWheelEvent,
} from 'react';

import EditorCanvas from '@/components/organisms/molecular-editor/MoleculeEditorCanvas';
import MoleculeEditorBottomNotice from '@/components/organisms/molecular-editor/MoleculeEditorBottomNotice';
import MoleculeEditorToolRail from '@/components/organisms/molecular-editor/MoleculeEditorToolRail';
import MoleculePaletteRail from '@/components/organisms/molecular-editor/MoleculePaletteRail';
import MoleculePaletteSearchRail from '@/components/organisms/molecular-editor/MoleculePaletteSearchRail';
import MoleculeSimplifiedCanvasView from '@/components/organisms/molecular-editor/MoleculeSimplifiedCanvasView';
import MoleculeSummaryPanel from '@/components/molecules/chemistry/MoleculeSummaryPanel';
import type { SavedMoleculeEditorState } from '@/shared/types/molecule';
import type { MoleculeModel } from '@/shared/utils/moleculeEditor';

type EditorViewMode = SavedMoleculeEditorState['activeView'];

type CompositionRow = {
  symbol: string;
  name: string;
  count: number;
};

type MoleculeEditorCanvasPanelProps = {
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
  focusedComponentIndex: number;
  formulaDisplayValue: string;
  formulaPanelProps: ComponentProps<typeof MoleculeSummaryPanel>;
  interactiveViewBox: ComponentProps<typeof EditorCanvas>['viewBox'];
  isLandscapeCompactCanvas: boolean;
  isPaletteSearchOpen: boolean;
  isSimplifiedView: boolean;
  molecule: MoleculeModel;
  moleculeComponentsCount: number;
  onAtomPointerDown: (atomId: string, event: ReactPointerEvent<SVGGElement>) => void;
  onCanvasPointerCancel: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerDown: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerMove: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerUp: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasWheel: (event: ReactWheelEvent<SVGSVGElement>) => void;
  onClearPaletteSearch: () => void;
  onClosePaletteSearch: () => void;
  onPaletteSearchChange: (value: string) => void;
  onTogglePaletteSearch: () => void;
  paletteQuery: string;
  paletteRailProps: ComponentProps<typeof MoleculePaletteRail>;
  paletteSearchButtonClassName: string;
  paletteSearchInnerStyle: CSSProperties;
  paletteSearchPanelStyle: CSSProperties;
  paletteSearchRailRef: RefObject<HTMLDivElement | null>;
  paletteSearchRailStyle: CSSProperties;
  paletteSearchShellClassName: string;
  paletteSearchTriggerStyle: CSSProperties;
  resolvedEditorNotice: string | null;
  searchInputRef: RefObject<HTMLInputElement | null>;
  shouldShowActivePaletteFilter: boolean;
  svgRef: RefObject<SVGSVGElement | null>;
  simplifiedViewStyle: CSSProperties;
  toolRailProps: ComponentProps<typeof MoleculeEditorToolRail>;
};

export default function MoleculeEditorCanvasPanel({
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
  formulaPanelProps,
  interactiveViewBox,
  isLandscapeCompactCanvas,
  isPaletteSearchOpen,
  isSimplifiedView,
  molecule,
  moleculeComponentsCount,
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
  paletteRailProps,
  paletteSearchButtonClassName,
  paletteSearchInnerStyle,
  paletteSearchPanelStyle,
  paletteSearchRailRef,
  paletteSearchRailStyle,
  paletteSearchShellClassName,
  paletteSearchTriggerStyle,
  resolvedEditorNotice,
  searchInputRef,
  shouldShowActivePaletteFilter,
  simplifiedViewStyle,
  svgRef,
  toolRailProps,
}: MoleculeEditorCanvasPanelProps) {
  return (
    <div className={canvasPanelClassName} style={canvasPanelStyle}>
      <MoleculePaletteRail {...paletteRailProps} />

      <MoleculePaletteSearchRail
        isLandscapeCompactCanvas={isLandscapeCompactCanvas}
        isPaletteSearchOpen={isPaletteSearchOpen}
        onClearPaletteSearch={onClearPaletteSearch}
        onClosePaletteSearch={onClosePaletteSearch}
        onPaletteSearchChange={onPaletteSearchChange}
        onTogglePaletteSearch={onTogglePaletteSearch}
        paletteQuery={paletteQuery}
        paletteSearchButtonClassName={paletteSearchButtonClassName}
        paletteSearchInnerStyle={paletteSearchInnerStyle}
        paletteSearchPanelStyle={paletteSearchPanelStyle}
        paletteSearchRailRef={paletteSearchRailRef}
        paletteSearchRailStyle={paletteSearchRailStyle}
        paletteSearchShellClassName={paletteSearchShellClassName}
        paletteSearchTriggerStyle={paletteSearchTriggerStyle}
        searchInputRef={searchInputRef}
        shouldShowActivePaletteFilter={shouldShowActivePaletteFilter}
      />

      <MoleculeEditorToolRail {...toolRailProps} />

      <div ref={canvasFrameRef} className={canvasFrameClassName}>
        {isSimplifiedView ? (
          <MoleculeSimplifiedCanvasView
            compositionRows={compositionRows}
            focusedComponentIndex={focusedComponentIndex}
            formulaDisplayValue={formulaDisplayValue}
            moleculeComponentsCount={moleculeComponentsCount}
            simplifiedViewStyle={simplifiedViewStyle}
          />
        ) : (
          <EditorCanvas
            model={molecule}
            mode={activeView}
            viewBox={interactiveViewBox}
            selectedAtomId={toolRailProps.selectedAtomId}
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

      <MoleculeEditorBottomNotice
        bottomNoticeRef={bottomNoticeRef}
        compactBottomNoticeClassName={compactBottomNoticeClassName}
        compactBottomOverlayClassName={compactBottomOverlayClassName}
        compactDisplayedEditorNotice={compactDisplayedEditorNotice}
        isSimplifiedView={isSimplifiedView}
        resolvedEditorNotice={resolvedEditorNotice}
      />

      {isSimplifiedView ? null : <MoleculeSummaryPanel {...formulaPanelProps} />}
    </div>
  );
}
