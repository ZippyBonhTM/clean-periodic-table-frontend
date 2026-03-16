'use client';

import { useCallback } from 'react';

import { resolveScaledViewBoxMetrics } from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import type {
  MoleculeEditorViewportActions,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';

type UseMoleculeEditorFocusComponentActionOptions = Pick<
  UseMoleculeEditorActionsOptions<unknown>,
  | 'canvasFrameAspectRatio'
  | 'canvasViewport'
  | 'molecule'
  | 'moleculeComponents'
  | 'setCanvasViewport'
  | 'setEditorNotice'
  | 'setFocusedComponentIndex'
  | 'setSelectedAtomId'
>;

export default function useMoleculeEditorFocusComponentAction({
  canvasFrameAspectRatio,
  canvasViewport,
  molecule,
  moleculeComponents,
  setCanvasViewport,
  setEditorNotice,
  setFocusedComponentIndex,
  setSelectedAtomId,
}: UseMoleculeEditorFocusComponentActionOptions): Pick<
  MoleculeEditorViewportActions,
  'onFocusComponent'
> {
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

  return {
    onFocusComponent,
  };
}
