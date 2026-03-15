'use client';

import type {
  CSSProperties,
  ComponentProps,
  PointerEvent as ReactPointerEvent,
  RefObject,
  WheelEvent as ReactWheelEvent,
} from 'react';

import EditorCanvas from '@/components/organisms/molecular-editor/MoleculeEditorCanvas';
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

type MoleculeEditorCanvasStageProps = {
  activeView: EditorViewMode;
  canvasFrameClassName: string;
  canvasFrameRef: RefObject<HTMLDivElement | null>;
  compositionRows: CompositionRow[];
  focusedComponentIndex: number;
  formulaDisplayValue: string;
  formulaPanelProps: ComponentProps<typeof MoleculeSummaryPanel>;
  interactiveViewBox: ComponentProps<typeof EditorCanvas>['viewBox'];
  isSimplifiedView: boolean;
  molecule: MoleculeModel;
  moleculeComponentsCount: number;
  onAtomPointerDown: (atomId: string, event: ReactPointerEvent<SVGGElement>) => void;
  onCanvasPointerCancel: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerDown: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerMove: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerUp: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasWheel: (event: ReactWheelEvent<SVGSVGElement>) => void;
  selectedAtomId: string | null;
  simplifiedViewStyle: CSSProperties;
  svgRef: RefObject<SVGSVGElement | null>;
};

export default function MoleculeEditorCanvasStage({
  activeView,
  canvasFrameClassName,
  canvasFrameRef,
  compositionRows,
  focusedComponentIndex,
  formulaDisplayValue,
  formulaPanelProps,
  interactiveViewBox,
  isSimplifiedView,
  molecule,
  moleculeComponentsCount,
  onAtomPointerDown,
  onCanvasPointerCancel,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onCanvasWheel,
  selectedAtomId,
  simplifiedViewStyle,
  svgRef,
}: MoleculeEditorCanvasStageProps) {
  return (
    <>
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

      {isSimplifiedView ? null : <MoleculeSummaryPanel {...formulaPanelProps} />}
    </>
  );
}
