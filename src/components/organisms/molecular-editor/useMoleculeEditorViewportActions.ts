'use client';

import useMoleculeEditorCanvasViewportActions from '@/components/organisms/molecular-editor/useMoleculeEditorCanvasViewportActions';
import useMoleculeEditorFocusComponentAction from '@/components/organisms/molecular-editor/useMoleculeEditorFocusComponentAction';
import type {
  MoleculeEditorViewportActions,
  UseMoleculeEditorActionsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorActions.types';

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
  const { onFocusComponent } = useMoleculeEditorFocusComponentAction({
    canvasFrameAspectRatio,
    canvasViewport,
    molecule,
    moleculeComponents,
    setCanvasViewport,
    setEditorNotice,
    setFocusedComponentIndex,
    setSelectedAtomId,
  });

  const { onCanvasWheel, onResetCanvasView, onZoomIn, onZoomOut } = useMoleculeEditorCanvasViewportActions({
    activeView,
    canvasFrameSize,
    canvasViewport,
    defaultCanvasViewport,
    molecule,
    setCanvasViewport,
    setEditorNotice,
  });

  return {
    onCanvasWheel,
    onFocusComponent,
    onResetCanvasView,
    onZoomIn,
    onZoomOut,
  };
}
