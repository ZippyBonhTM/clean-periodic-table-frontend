'use client';

import { useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';

import {
  DRAG_THRESHOLD_PX,
  toSvgDelta,
  toSvgPoint,
  type CanvasInteraction,
  type CanvasViewportLike,
  type EditorViewMode,
} from '@/components/organisms/molecular-editor/moleculeCanvasInteractionUtils';

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

  const onCanvasPointerMove = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const interaction = interactionRef.current;

      if (interaction.type === 'idle' || interaction.pointerId !== event.pointerId) {
        return;
      }

      const svg = svgRef.current;

      if (svg === null) {
        return;
      }

      const deltaClientX = event.clientX - interaction.startClientX;
      const deltaClientY = event.clientY - interaction.startClientY;
      const distance = Math.hypot(deltaClientX, deltaClientY);

      if (interaction.type === 'canvas-press') {
        if (!interaction.canPan) {
          if (distance >= DRAG_THRESHOLD_PX && !interaction.moved) {
            interactionRef.current = {
              ...interaction,
              moved: true,
            };
          }

          return;
        }

        if (distance < DRAG_THRESHOLD_PX && !interaction.moved) {
          return;
        }

        event.preventDefault();

        const delta = toSvgDelta(svg, svg.viewBox.baseVal, deltaClientX, deltaClientY);
        interactionRef.current = {
          ...interaction,
          moved: true,
        };

        setCanvasViewport((current) => ({
          ...current,
          offsetX: interaction.startOffsetX - delta.x,
          offsetY: interaction.startOffsetY - delta.y,
        }));
        return;
      }

      if (distance < DRAG_THRESHOLD_PX && !interaction.moved) {
        return;
      }

      const nextMode = interaction.mode === 'pan' || distance >= DRAG_THRESHOLD_PX ? 'pan' : interaction.mode;

      if (nextMode !== 'pan') {
        return;
      }

      event.preventDefault();
      interactionRef.current = {
        ...interaction,
        mode: 'pan',
        moved: true,
      };
      const delta = toSvgDelta(svg, svg.viewBox.baseVal, deltaClientX, deltaClientY);

      setCanvasViewport((current) => ({
        ...current,
        offsetX: interaction.startOffsetX - delta.x,
        offsetY: interaction.startOffsetY - delta.y,
      }));
    },
    [interactionRef, setCanvasViewport, svgRef],
  );

  const onCanvasPointerUp = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      const interaction = interactionRef.current;

      if (interaction.type === 'idle' || interaction.pointerId !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      interactionRef.current = { type: 'idle' };

      if (interaction.type === 'canvas-press') {
        if (!interaction.moved) {
          queueCanvasPlacement(interaction.startPoint, event.pointerType, event.clientX, event.clientY);
        }

        return;
      }

      if (!interaction.moved && interaction.mode === 'select') {
        onAtomActivate(interaction.atomId);
      }
    },
    [interactionRef, onAtomActivate, queueCanvasPlacement],
  );

  const onCanvasPointerCancel = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      clearPendingCanvasPlacement();
      interactionRef.current = { type: 'idle' };
    },
    [clearPendingCanvasPlacement, interactionRef],
  );

  return {
    onCanvasPointerCancel,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
  };
}
