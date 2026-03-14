'use client';

import { useCallback } from 'react';
import type { WheelEvent as ReactWheelEvent } from 'react';

import {
  resolveInteractiveViewBox,
  resolveScaledViewBoxMetrics,
  resolveViewBox,
} from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import type {
  CanvasViewport,
  MoleculeEditorViewportActions,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';

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

function clampCanvasScale(scale: number): number {
  return Math.min(3, Math.max(0.5, scale));
}

function resolveViewportCenter(
  model: UseMoleculeEditorActionsOptions<unknown>['molecule'],
  viewport: CanvasViewport,
  frameAspectRatio?: number,
) {
  const viewBox = resolveInteractiveViewBox(model, viewport, frameAspectRatio);

  return {
    x: viewBox.x + viewBox.width / 2,
    y: viewBox.y + viewBox.height / 2,
  };
}

function zoomCanvasViewport(
  model: UseMoleculeEditorActionsOptions<unknown>['molecule'],
  currentViewport: CanvasViewport,
  nextScale: number,
  anchorPoint: { x: number; y: number },
  frameAspectRatio?: number,
): CanvasViewport {
  const safeScale = clampCanvasScale(nextScale);
  const baseViewBox = resolveViewBox(model);
  const currentViewBox = resolveInteractiveViewBox(model, currentViewport, frameAspectRatio);
  const ratioX =
    currentViewBox.width === 0 ? 0.5 : (anchorPoint.x - currentViewBox.x) / currentViewBox.width;
  const ratioY =
    currentViewBox.height === 0 ? 0.5 : (anchorPoint.y - currentViewBox.y) / currentViewBox.height;
  const nextWidth = baseViewBox.width / safeScale;
  const nextHeight = baseViewBox.height / safeScale;
  const nextX = anchorPoint.x - ratioX * nextWidth;
  const nextY = anchorPoint.y - ratioY * nextHeight;
  const baseCenterX = baseViewBox.x + baseViewBox.width / 2;
  const baseCenterY = baseViewBox.y + baseViewBox.height / 2;

  return {
    offsetX: nextX + nextWidth / 2 - baseCenterX,
    offsetY: nextY + nextHeight / 2 - baseCenterY,
    scale: safeScale,
  };
}

type UseMoleculeEditorViewportActionsOptions = Pick<
  UseMoleculeEditorActionsOptions<unknown>,
  | 'activeView'
  | 'canvasFrameAspectRatio'
  | 'canvasFrameSize'
  | 'canvasViewport'
  | 'defaultCanvasViewport'
  | 'molecule'
  | 'moleculeComponents'
  | 'setCanvasViewport'
  | 'setEditorNotice'
  | 'setFocusedComponentIndex'
  | 'setSelectedAtomId'
>;

export default function useMoleculeEditorViewportActions({
  activeView,
  canvasFrameAspectRatio,
  canvasFrameSize,
  canvasViewport,
  defaultCanvasViewport,
  molecule,
  moleculeComponents,
  setCanvasViewport,
  setEditorNotice,
  setFocusedComponentIndex,
  setSelectedAtomId,
}: UseMoleculeEditorViewportActionsOptions): MoleculeEditorViewportActions {
  const onFocusComponent = useCallback(
    (componentIndex: number) => {
      const component = moleculeComponents[componentIndex];

      if (component === undefined) {
        return;
      }

      setFocusedComponentIndex(componentIndex);
      setSelectedAtomId(null);
      setEditorNotice(`Mol ${componentIndex + 1} focused.`);

      const nextViewportMetrics = resolveScaledViewBoxMetrics(
        molecule,
        canvasViewport.scale,
        canvasFrameAspectRatio,
      );

      setCanvasViewport((currentViewport) => ({
        ...currentViewport,
        offsetX: component.center.x - nextViewportMetrics.centerX,
        offsetY: component.center.y - nextViewportMetrics.centerY,
      }));
    },
    [
      canvasFrameAspectRatio,
      canvasViewport.scale,
      molecule,
      moleculeComponents,
      setCanvasViewport,
      setEditorNotice,
      setFocusedComponentIndex,
      setSelectedAtomId,
    ],
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
            canvasFrameSize.width > 0 && canvasFrameSize.height > 0
              ? canvasFrameSize.width / canvasFrameSize.height
              : undefined,
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
    [activeView, canvasFrameSize.height, canvasFrameSize.width, canvasViewport, molecule, setCanvasViewport],
  );

  const onZoomOut = useCallback(() => {
    const frameAspectRatio =
      canvasFrameSize.width > 0 && canvasFrameSize.height > 0
        ? canvasFrameSize.width / canvasFrameSize.height
        : undefined;
    const anchorPoint = resolveViewportCenter(molecule, canvasViewport, frameAspectRatio);

    const nextViewport = zoomCanvasViewport(
      molecule,
      canvasViewport,
      canvasViewport.scale / 1.15,
      anchorPoint,
      frameAspectRatio,
    );

    setCanvasViewport(nextViewport);
  }, [canvasFrameSize.height, canvasFrameSize.width, canvasViewport, molecule, setCanvasViewport]);

  const onZoomIn = useCallback(() => {
    const frameAspectRatio =
      canvasFrameSize.width > 0 && canvasFrameSize.height > 0
        ? canvasFrameSize.width / canvasFrameSize.height
        : undefined;
    const anchorPoint = resolveViewportCenter(molecule, canvasViewport, frameAspectRatio);

    const nextViewport = zoomCanvasViewport(
      molecule,
      canvasViewport,
      canvasViewport.scale * 1.15,
      anchorPoint,
      frameAspectRatio,
    );

    setCanvasViewport(nextViewport);
  }, [canvasFrameSize.height, canvasFrameSize.width, canvasViewport, molecule, setCanvasViewport]);

  const onResetCanvasView = useCallback(() => {
    setCanvasViewport(defaultCanvasViewport);
    setEditorNotice('Canvas view reset.');
  }, [defaultCanvasViewport, setCanvasViewport, setEditorNotice]);

  return {
    onCanvasWheel,
    onFocusComponent,
    onResetCanvasView,
    onZoomIn,
    onZoomOut,
  };
}
