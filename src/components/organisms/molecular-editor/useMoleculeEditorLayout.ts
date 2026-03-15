'use client';

import { useMemo } from 'react';
import type { RefObject } from 'react';

import resolveMoleculeEditorLayoutStyles from '@/components/organisms/molecular-editor/moleculeEditorLayoutStyles';
import useMoleculeEditorMeasurements from '@/components/organisms/molecular-editor/useMoleculeEditorMeasurements';
import type { SavedMoleculeEditorState } from '@/shared/types/molecule';

type EditorViewMode = SavedMoleculeEditorState['activeView'];

type UseMoleculeEditorLayoutOptions = {
  activeView: EditorViewMode;
  componentCount: number;
  isFloatingSaveShortcutExpanded: boolean;
  isFormulaPanelOpen: boolean;
  isPaletteSearchOpen: boolean;
  isToolRailCollapsed: boolean;
  pageMode: 'editor' | 'gallery';
  paletteSearchRailRef: RefObject<HTMLDivElement | null>;
  resolvedEditorNotice: string | null;
};

export default function useMoleculeEditorLayout({
  activeView,
  componentCount,
  isFloatingSaveShortcutExpanded,
  isFormulaPanelOpen,
  isPaletteSearchOpen,
  isToolRailCollapsed,
  pageMode,
  paletteSearchRailRef,
  resolvedEditorNotice,
}: UseMoleculeEditorLayoutOptions) {
  const {
    bottomNoticeHeight,
    bottomNoticeRef,
    canvasFrameRef,
    canvasFrameSize,
    paletteSearchRailHeight,
    topControlsHeight,
    topControlsRef,
    topOverlayHeight,
    topOverlayRef,
  } = useMoleculeEditorMeasurements({
    activeView,
    paletteSearchRailRef,
  });

  return useMemo(() => {
    return {
      bottomNoticeRef,
      canvasFrameRef,
      canvasFrameSize,
      topControlsRef,
      topOverlayRef,
      ...resolveMoleculeEditorLayoutStyles({
        activeView,
        bottomNoticeHeight,
        canvasFrameSize,
        componentCount,
        isFloatingSaveShortcutExpanded,
        isFormulaPanelOpen,
        isPaletteSearchOpen,
        isToolRailCollapsed,
        pageMode,
        paletteSearchRailHeight,
        resolvedEditorNotice,
        topControlsHeight,
        topOverlayHeight,
      }),
    };
  }, [
    activeView,
    bottomNoticeHeight,
    bottomNoticeRef,
    canvasFrameRef,
    canvasFrameSize,
    componentCount,
    isFloatingSaveShortcutExpanded,
    isFormulaPanelOpen,
    isPaletteSearchOpen,
    isToolRailCollapsed,
    pageMode,
    resolvedEditorNotice,
    topControlsHeight,
    topControlsRef,
    topOverlayHeight,
    paletteSearchRailHeight,
    topOverlayRef,
  ]);
}
