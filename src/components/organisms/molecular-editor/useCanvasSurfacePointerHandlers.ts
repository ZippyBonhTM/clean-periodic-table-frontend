'use client';

import { useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';

import {
  toSvgPoint,
  type CanvasInteraction,
  type CanvasViewportLike,
  type EditorViewMode,
} from '@/components/organisms/molecular-editor/moleculeCanvasInteractionUtils';
import useCanvasSurfaceMoveHandler from '@/components/organisms/molecular-editor/useCanvasSurfaceMoveHandler';
import useCanvasSurfaceReleaseHandlers from '@/components/organisms/molecular-editor/useCanvasSurfaceReleaseHandlers';

type UseCanvasSurfacePointerHandlersOptions = {
  activeView: EditorViewMode;
  canvasViewport: CanvasViewportLike;
  clearPendingCanvasPlacement: () => void;
  clearPendingCanvasSelectionClearTimeout: () => void;
  interactionRef: React.MutableRefObject<CanvasInteraction>;
  onAtomActivate: (atomId: string) => void;
  pendingCanvasPlacementRef: React.MutableRefObject<{
    timestamp: number;
    clientX: number;
    clientY: number;
    pointerType: string;
  } | null>;
  queueCanvasPlacement: (
    point: { x: number; y: number },
    pointerType: string,
    clientX: number,
    clientY: number,
  ) => void;
  selectedAtomId: string | null;
  setCanvasViewport: React.Dispatch<React.SetStateAction<CanvasViewportLike>>;
  svgRef: RefObject<SVGSVGElement | null>;
};

export default function useCanvasSurfacePointerHandlers({
  activeView,
  canvasViewport,
  clearPendingCanvasPlacement,
  clearPendingCanvasSelectionClearTimeout,
  interactionRef,
  onAtomActivate,
  pendingCanvasPlacementRef,
  queueCanvasPlacement,
  selectedAtomId,
  setCanvasViewport,
  svgRef,
}: UseCanvasSurfacePointerHandlersOptions) {
  const onCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (activeView === 'simplified') {
        return;
      }

      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      if (selectedAtomId !== null && pendingCanvasPlacementRef.current !== null) {
        clearPendingCanvasSelectionClearTimeout();
      }

      event.currentTarget.setPointerCapture(event.pointerId);

      interactionRef.current = {
        type: 'canvas-press',
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPoint: toSvgPoint(event.currentTarget, event.clientX, event.clientY),
        startOffsetX: canvasViewport.offsetX,
        startOffsetY: canvasViewport.offsetY,
        canPan: true,
        moved: false,
      };
    },
    [
      activeView,
      canvasViewport.offsetX,
      canvasViewport.offsetY,
      clearPendingCanvasSelectionClearTimeout,
      interactionRef,
      pendingCanvasPlacementRef,
      selectedAtomId,
    ],
  );

  const { onCanvasPointerMove } = useCanvasSurfaceMoveHandler({
    interactionRef,
    setCanvasViewport,
    svgRef,
  });

  const { onCanvasPointerCancel, onCanvasPointerUp } = useCanvasSurfaceReleaseHandlers({
    clearPendingCanvasPlacement,
    interactionRef,
    onAtomActivate,
    queueCanvasPlacement,
  });

  return {
    onCanvasPointerCancel,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
  };
}
