'use client';

import { useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';

import type {
  CanvasInteraction,
  CanvasViewportLike,
} from '@/components/organisms/molecular-editor/moleculeCanvasInteractionUtils';
import { findAtom, type MoleculeModel } from '@/shared/utils/moleculeEditor';

type UseCanvasAtomPointerHandlerOptions = {
  canvasViewport: CanvasViewportLike;
  clearPendingCanvasPlacement: () => void;
  interactionRef: React.MutableRefObject<CanvasInteraction>;
  molecule: MoleculeModel;
  svgRef: RefObject<SVGSVGElement | null>;
};

export default function useCanvasAtomPointerHandler({
  canvasViewport,
  clearPendingCanvasPlacement,
  interactionRef,
  molecule,
  svgRef,
}: UseCanvasAtomPointerHandlerOptions) {
  const onAtomPointerDown = useCallback(
    (atomId: string, event: ReactPointerEvent<SVGGElement>) => {
      const atom = findAtom(molecule, atomId);

      if (atom === null) {
        return;
      }

      const svg = svgRef.current;

      if (svg === null) {
        return;
      }

      svg.setPointerCapture(event.pointerId);
      clearPendingCanvasPlacement();

      interactionRef.current = {
        type: 'atom-press',
        pointerId: event.pointerId,
        atomId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startOffsetX: canvasViewport.offsetX,
        startOffsetY: canvasViewport.offsetY,
        mode: event.ctrlKey ? 'pan' : 'select',
        moved: false,
      };
    },
    [canvasViewport.offsetX, canvasViewport.offsetY, clearPendingCanvasPlacement, interactionRef, molecule, svgRef],
  );

  return {
    onAtomPointerDown,
  };
}
