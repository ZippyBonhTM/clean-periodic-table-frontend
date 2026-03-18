'use client';

import { useCallback } from 'react';

import {
  formatMolecularEditorComponentFocusedNotice,
} from '@/components/organisms/molecular-editor/molecularEditorText';
import { resolveScaledViewBoxMetrics } from '@/components/organisms/molecular-editor/moleculeCanvasViewport';
import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
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
  const text = useMolecularEditorText();

  const onFocusComponent = useCallback(
    (componentIndex: number) => {
      const component = moleculeComponents[componentIndex];

      if (component === undefined) {
        return;
      }

      setFocusedComponentIndex(componentIndex);
      setSelectedAtomId(null);
      setEditorNotice(formatMolecularEditorComponentFocusedNotice(text, componentIndex));

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
      text,
    ],
  );

  return {
    onFocusComponent,
  };
}
