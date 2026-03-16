'use client';

import { useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';

import {
  DRAG_THRESHOLD_PX,
  toSvgDelta,
  type CanvasInteraction,
  type CanvasViewportLike,
} from '@/components/organisms/molecular-editor/moleculeCanvasInteractionUtils';

type UseCanvasSurfaceMoveHandlerOptions = {
  interactionRef: React.MutableRefObject<CanvasInteraction>;
  setCanvasViewport: React.Dispatch<React.SetStateAction<CanvasViewportLike>>;
  svgRef: RefObject<SVGSVGElement | null>;
};

export default function useCanvasSurfaceMoveHandler({
  interactionRef,
  setCanvasViewport,
  svgRef,
}: UseCanvasSurfaceMoveHandlerOptions) {
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

  return {
    onCanvasPointerMove,
  };
}
