'use client';

import { useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

import type { CanvasInteraction } from '@/components/organisms/molecular-editor/moleculeCanvasInteractionUtils';

type UseCanvasSurfaceReleaseHandlersOptions = {
  clearPendingCanvasPlacement: () => void;
  interactionRef: React.MutableRefObject<CanvasInteraction>;
  onAtomActivate: (atomId: string) => void;
  queueCanvasPlacement: (
    point: { x: number; y: number },
    pointerType: string,
    clientX: number,
    clientY: number,
  ) => void;
};

export default function useCanvasSurfaceReleaseHandlers({
  clearPendingCanvasPlacement,
  interactionRef,
  onAtomActivate,
  queueCanvasPlacement,
}: UseCanvasSurfaceReleaseHandlersOptions) {
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
    onCanvasPointerUp,
  };
}
