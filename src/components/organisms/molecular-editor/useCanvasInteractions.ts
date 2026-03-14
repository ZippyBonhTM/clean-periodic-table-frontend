'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';

import { findAtom, type MoleculeModel } from '@/shared/utils/moleculeEditor';

type EditorViewMode = 'editor' | 'structural' | 'simplified' | 'stick';

type CanvasViewportLike = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

type CanvasInteraction =
  | {
      type: 'idle';
    }
  | {
      type: 'canvas-press';
      pointerId: number;
      startClientX: number;
      startClientY: number;
      startPoint: {
        x: number;
        y: number;
      };
      startOffsetX: number;
      startOffsetY: number;
      canPan: boolean;
      moved: boolean;
    }
  | {
      type: 'atom-press';
      pointerId: number;
      atomId: string;
      startClientX: number;
      startClientY: number;
      startOffsetX: number;
      startOffsetY: number;
      mode: 'select' | 'pan';
      moved: boolean;
    };

const DRAG_THRESHOLD_PX = 6;
const CANVAS_DOUBLE_PRESS_DELAY_MS = 320;
const CANVAS_DOUBLE_PRESS_DISTANCE_PX = 18;

function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
  const rect = svg.getBoundingClientRect();
  const viewBox = svg.viewBox.baseVal;

  return {
    x: viewBox.x + ((clientX - rect.left) / rect.width) * viewBox.width,
    y: viewBox.y + ((clientY - rect.top) / rect.height) * viewBox.height,
  };
}

function toSvgDelta(
  svg: SVGSVGElement,
  viewBox: { width: number; height: number },
  deltaClientX: number,
  deltaClientY: number,
) {
  const rect = svg.getBoundingClientRect();

  return {
    x: (deltaClientX / rect.width) * viewBox.width,
    y: (deltaClientY / rect.height) * viewBox.height,
  };
}

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
  const selectedAtomIdRef = useRef<string | null>(null);
  const pendingCanvasPlacementRef = useRef<{
    timestamp: number;
    clientX: number;
    clientY: number;
    pointerType: string;
  } | null>(null);
  const pendingCanvasSelectionClearTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    selectedAtomIdRef.current = selectedAtomId;
  }, [selectedAtomId]);

  const clearPendingCanvasSelectionClearTimeout = useCallback(() => {
    if (pendingCanvasSelectionClearTimeoutRef.current !== null) {
      window.clearTimeout(pendingCanvasSelectionClearTimeoutRef.current);
      pendingCanvasSelectionClearTimeoutRef.current = null;
    }
  }, []);

  const clearPendingCanvasPlacement = useCallback(() => {
    pendingCanvasPlacementRef.current = null;
    clearPendingCanvasSelectionClearTimeout();
  }, [clearPendingCanvasSelectionClearTimeout]);

  useEffect(() => {
    return () => {
      clearPendingCanvasSelectionClearTimeout();
    };
  }, [clearPendingCanvasSelectionClearTimeout]);

  const clearTransientEditorState = useCallback(() => {
    clearPendingCanvasPlacement();
    interactionRef.current = { type: 'idle' };
  }, [clearPendingCanvasPlacement]);

  const queueCanvasPlacement = useCallback(
    (point: { x: number; y: number }, pointerType: string, clientX: number, clientY: number) => {
      const now = performance.now();
      const pendingPlacement = pendingCanvasPlacementRef.current;
      const isRepeatedPlacement =
        pendingPlacement !== null &&
        pendingPlacement.pointerType === pointerType &&
        now - pendingPlacement.timestamp <= CANVAS_DOUBLE_PRESS_DELAY_MS &&
        Math.hypot(clientX - pendingPlacement.clientX, clientY - pendingPlacement.clientY) <=
          CANVAS_DOUBLE_PRESS_DISTANCE_PX;

      if (isRepeatedPlacement) {
        clearPendingCanvasPlacement();
        onCanvasPlacement(point);
        return;
      }

      clearPendingCanvasSelectionClearTimeout();
      pendingCanvasPlacementRef.current = {
        timestamp: now,
        clientX,
        clientY,
        pointerType,
      };

      if (selectedAtomId !== null) {
        const atomIdToClear = selectedAtomId;

        pendingCanvasSelectionClearTimeoutRef.current = window.setTimeout(() => {
          pendingCanvasSelectionClearTimeoutRef.current = null;
          pendingCanvasPlacementRef.current = null;

          if (selectedAtomIdRef.current !== atomIdToClear) {
            return;
          }

          setSelectedAtomId(null);
          setEditorNotice('Selection cleared.');
        }, CANVAS_DOUBLE_PRESS_DELAY_MS);

        setEditorNotice(
          pointerType === 'touch'
            ? 'Double-tap again to attach the active element, or wait to clear the selection.'
            : 'Double-click again to attach the active element, or wait to clear the selection.',
        );
        return;
      }

      setEditorNotice(
        pointerType === 'touch'
          ? 'Double-tap the canvas to place the active element.'
          : 'Double-click the canvas to place the active element.',
      );
    },
    [
      clearPendingCanvasPlacement,
      clearPendingCanvasSelectionClearTimeout,
      onCanvasPlacement,
      selectedAtomId,
      setEditorNotice,
      setSelectedAtomId,
    ],
  );

  const onCanvasPointerDown = useCallback(
    (event: ReactPointerEvent<SVGSVGElement>) => {
      if (activeView === 'simplified') {
        return;
      }

      if (event.pointerType === 'mouse' && event.button !== 0) {
        return;
      }

      if (selectedAtomIdRef.current !== null && pendingCanvasPlacementRef.current !== null) {
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
    [activeView, canvasViewport.offsetX, canvasViewport.offsetY, clearPendingCanvasSelectionClearTimeout],
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
