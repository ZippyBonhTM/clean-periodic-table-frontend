'use client';

import { useCallback } from 'react';
import type { WheelEvent as ReactWheelEvent } from 'react';

import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
import type {
  MoleculeEditorViewportActions,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';
import {
  clampCanvasScale,
  resolveViewportCenter,
  toSvgDelta,
  toSvgPoint,
  zoomCanvasViewport,
} from '@/components/organisms/molecular-editor/moleculeEditorViewport.utils';

type UseMoleculeEditorCanvasViewportActionsOptions = Pick<
  UseMoleculeEditorActionsOptions<unknown>,
  | 'activeView'
  | 'canvasFrameSize'
  | 'canvasViewport'
  | 'defaultCanvasViewport'
  | 'molecule'
  | 'setCanvasViewport'
  | 'setEditorNotice'
>;

export default function useMoleculeEditorCanvasViewportActions({
  activeView,
  canvasFrameSize,
  canvasViewport,
  defaultCanvasViewport,
  molecule,
  setCanvasViewport,
  setEditorNotice,
}: UseMoleculeEditorCanvasViewportActionsOptions): Pick<
  MoleculeEditorViewportActions,
  'onCanvasWheel' | 'onResetCanvasView' | 'onZoomIn' | 'onZoomOut'
> {
  const text = useMolecularEditorText();

  const resolveFrameAspectRatio = useCallback(
    () =>
      canvasFrameSize.width > 0 && canvasFrameSize.height > 0
        ? canvasFrameSize.width / canvasFrameSize.height
        : undefined,
    [canvasFrameSize.height, canvasFrameSize.width],
  );

  const onCanvasWheel = useCallback(
    (event: ReactWheelEvent<SVGSVGElement>) => {
      if (activeView === 'simplified') {
        return;
      }

      event.preventDefault();

      if (event.shiftKey) {
        const nextScale = clampCanvasScale(
          canvasViewport.scale * (event.deltaY > 0 ? 1 / 1.15 : 1.15),
        );

        if (nextScale === canvasViewport.scale) {
          return;
        }

        const anchorPoint = toSvgPoint(event.currentTarget, event.clientX, event.clientY);
        setCanvasViewport(
          zoomCanvasViewport(
            molecule,
            canvasViewport,
            nextScale,
            anchorPoint,
            resolveFrameAspectRatio(),
          ),
        );
        return;
      }

      const delta = toSvgDelta(event.currentTarget, event.currentTarget.viewBox.baseVal, event.deltaX, event.deltaY);
      setCanvasViewport((current) => ({
        ...current,
        offsetX: current.offsetX + delta.x,
        offsetY: current.offsetY + delta.y,
      }));
    },
    [activeView, canvasViewport, molecule, resolveFrameAspectRatio, setCanvasViewport],
  );

  const onZoomOut = useCallback(() => {
    const frameAspectRatio = resolveFrameAspectRatio();
    const anchorPoint = resolveViewportCenter(molecule, canvasViewport, frameAspectRatio);

    setCanvasViewport(
      zoomCanvasViewport(
        molecule,
        canvasViewport,
        canvasViewport.scale / 1.15,
        anchorPoint,
        frameAspectRatio,
      ),
    );
  }, [canvasViewport, molecule, resolveFrameAspectRatio, setCanvasViewport]);

  const onZoomIn = useCallback(() => {
    const frameAspectRatio = resolveFrameAspectRatio();
    const anchorPoint = resolveViewportCenter(molecule, canvasViewport, frameAspectRatio);

    setCanvasViewport(
      zoomCanvasViewport(
        molecule,
        canvasViewport,
        canvasViewport.scale * 1.15,
        anchorPoint,
        frameAspectRatio,
      ),
    );
  }, [canvasViewport, molecule, resolveFrameAspectRatio, setCanvasViewport]);

  const onResetCanvasView = useCallback(() => {
    setCanvasViewport(defaultCanvasViewport);
    setEditorNotice(text.notices.canvasViewReset);
  }, [defaultCanvasViewport, setCanvasViewport, setEditorNotice, text.notices.canvasViewReset]);

  return {
    onCanvasWheel,
    onResetCanvasView,
    onZoomIn,
    onZoomOut,
  };
}
