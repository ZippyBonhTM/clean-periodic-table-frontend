'use client';

import { useMemo } from 'react';
import type {
  PointerEvent as ReactPointerEvent,
  RefObject,
  WheelEvent as ReactWheelEvent,
} from 'react';

import type { MoleculeModel } from '@/shared/utils/moleculeEditor';

import MoleculeCanvasAtomLayer from '@/components/organisms/molecular-editor/MoleculeCanvasAtomLayer';
import MoleculeCanvasBondLayer from '@/components/organisms/molecular-editor/MoleculeCanvasBondLayer';
import { resolveModelCenter, type EditorViewMode } from '@/components/organisms/molecular-editor/moleculeCanvasRenderUtils';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';

type EditorCanvasProps = {
  model: MoleculeModel;
  mode: EditorViewMode;
  viewBox: { x: number; y: number; width: number; height: number };
  selectedAtomId: string | null;
  svgRef?: RefObject<SVGSVGElement | null>;
  onCanvasPointerDown?: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerMove?: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerUp?: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasPointerCancel?: (event: ReactPointerEvent<SVGSVGElement>) => void;
  onCanvasWheel?: (event: ReactWheelEvent<SVGSVGElement>) => void;
  onAtomPointerDown?: (atomId: string, event: ReactPointerEvent<SVGGElement>) => void;
  interactive?: boolean;
  showGrid?: boolean;
  ariaLabel?: string;
};

export default function EditorCanvas({
  model,
  mode,
  viewBox,
  selectedAtomId,
  svgRef,
  onCanvasPointerDown,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onCanvasPointerCancel,
  onCanvasWheel,
  onAtomPointerDown,
  interactive = true,
  showGrid = true,
  ariaLabel,
}: EditorCanvasProps) {
  const text = useMolecularEditorText();
  const atomById = useMemo(() => {
    return new Map(model.atoms.map((atom) => [atom.id, atom]));
  }, [model.atoms]);
  const modelCenter = useMemo(() => resolveModelCenter(model), [model]);
  const resolvedAriaLabel = ariaLabel ?? text.canvas.ariaLabel;

  return (
    <svg
      ref={svgRef}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      className={`absolute inset-0 h-full w-full select-none ${interactive ? 'touch-none' : 'pointer-events-none'}`}
      style={{ touchAction: interactive ? 'none' : 'auto', userSelect: 'none' }}
      role="img"
      aria-label={resolvedAriaLabel}
      onPointerDown={interactive ? onCanvasPointerDown : undefined}
      onPointerMove={interactive ? onCanvasPointerMove : undefined}
      onPointerUp={interactive ? onCanvasPointerUp : undefined}
      onPointerCancel={interactive ? onCanvasPointerCancel : undefined}
      onWheel={interactive ? onCanvasWheel : undefined}
    >
      {showGrid ? (
        <>
          <defs>
            <pattern id="molecule-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="var(--grid-stroke)" strokeWidth="1" />
            </pattern>
          </defs>

          <rect x={viewBox.x} y={viewBox.y} width={viewBox.width} height={viewBox.height} fill="url(#molecule-grid)" />
        </>
      ) : null}

      <MoleculeCanvasBondLayer
        atomById={atomById}
        mode={mode}
        model={model}
        modelCenter={modelCenter}
      />

      <MoleculeCanvasAtomLayer
        interactive={interactive}
        mode={mode}
        model={model}
        onAtomPointerDown={onAtomPointerDown}
        selectedAtomId={selectedAtomId}
      />
    </svg>
  );
}
