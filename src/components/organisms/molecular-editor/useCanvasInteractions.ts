'use client';

import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';

import {
  DRAG_THRESHOLD_PX,
  toSvgDelta,
  toSvgPoint,
  type CanvasInteraction,
  type CanvasViewportLike,
  type EditorViewMode,
} from '@/components/organisms/molecular-editor/moleculeCanvasInteractionUtils';
import useCanvasPlacementQueue from '@/components/organisms/molecular-editor/useCanvasPlacementQueue';
import { findAtom, type MoleculeModel } from '@/shared/utils/moleculeEditor';

type UseCanvasInteractionsOptions = {
  activeView: EditorViewMode;
  canvasViewport: CanvasViewportLike;
  molecule: MoleculeModel;
  selectedAtomId: string | null;
  setCanvasViewport: React.Dispatch<React.SetStateAction<CanvasViewportLike>>;
  setEditorNotice: (notice: string) => void;
  setSelectedAtomId: (atomId: string | null) => void;
  svgRef: RefObject<SVGSVGElement | null>;
  onCanvasPlacement: (point: { x: number; y: number }) => void;
  onAtomActivate: (atomId: string) => void;
};

export default function useCanvasInteractions({
  activeView,
  canvasViewport,
  molecule,
  selectedAtomId,
  setCanvasViewport,
  setEditorNotice,
  setSelectedAtomId,
  svgRef,
  onCanvasPlacement,
  onAtomActivate,
}: UseCanvasInteractionsOptions) {
  const interactionRef = useRef<CanvasInteraction>({ type: 'idle' });
  const {
    clearPendingCanvasPlacement,
    clearPendingCanvasSelectionClearTimeout,
    pendingCanvasPlacementRef,
    queueCanvasPlacement,
  } = useCanvasPlacementQueue({
    onCanvasPlacement,
    selectedAtomId,
    setEditorNotice,
    setSelectedAtomId,
  });

  const clearTransientEditorState = useCallback(() => {
    clearPendingCanvasPlacement();
    interactionRef.current = { type: 'idle' };
  }, [clearPendingCanvasPlacement]);

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
    [activeView, canvasViewport.offsetX, canvasViewport.offsetY, clearPendingCanvasSelectionClearTimeout, pendingCanvasPlacementRef, selectedAtomId],
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
    [setCanvasViewport, svgRef],
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
    [onAtomActivate, queueCanvasPlacement],
  );

  const onCanvasPointerCancel = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      clearPendingCanvasPlacement();
      interactionRef.current = { type: 'idle' };
    },
    [clearPendingCanvasPlacement],
  );

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
    [canvasViewport.offsetX, canvasViewport.offsetY, clearPendingCanvasPlacement, molecule, svgRef],
  );

  return {
    clearPendingCanvasPlacement,
    clearTransientEditorState,
    onAtomPointerDown,
    onCanvasPointerCancel,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
  };
}
