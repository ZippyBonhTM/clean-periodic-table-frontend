'use client';

import { useCallback, useRef } from 'react';
import type { RefObject } from 'react';

import {
  type CanvasInteraction,
  type CanvasViewportLike,
  type EditorViewMode,
} from '@/components/organisms/molecular-editor/moleculeCanvasInteractionUtils';
import useCanvasAtomPointerHandler from '@/components/organisms/molecular-editor/useCanvasAtomPointerHandler';
import useCanvasPlacementQueue from '@/components/organisms/molecular-editor/useCanvasPlacementQueue';
import useCanvasSurfacePointerHandlers from '@/components/organisms/molecular-editor/useCanvasSurfacePointerHandlers';
import type { MoleculeModel } from '@/shared/utils/moleculeEditor';

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

  const {
    onCanvasPointerCancel,
    onCanvasPointerDown,
    onCanvasPointerMove,
    onCanvasPointerUp,
  } = useCanvasSurfacePointerHandlers({
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
  });

  const { onAtomPointerDown } = useCanvasAtomPointerHandler({
    canvasViewport,
    clearPendingCanvasPlacement,
    interactionRef,
    molecule,
    svgRef,
  });

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
