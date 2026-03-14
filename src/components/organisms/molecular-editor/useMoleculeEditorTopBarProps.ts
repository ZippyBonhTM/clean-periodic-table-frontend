'use client';

import { useMemo } from 'react';

import type { TopBarProps, UseMoleculeEditorTopBarPropsOptions } from '@/components/organisms/molecular-editor/moleculeEditorSectionProps.types';

export default function useMoleculeEditorTopBarProps({
  activeView,
  importButtonClassName,
  isLandscapeCompactCanvas,
  isSimplifiedView,
  onOpenImportModal,
  onResetCanvasView,
  onSetActiveView,
  onZoomIn,
  onZoomOut,
  responsiveLayoutWidth,
  topControlsLeadingGroupClassName,
  topControlsRowClassName,
  viewModeButtonClassName,
  viewModeTabsClassName,
  viewOptions,
  zoomControlsClassName,
  zoomControlsVisibilityClassName,
  zoomPercent,
}: UseMoleculeEditorTopBarPropsOptions): TopBarProps {
  return useMemo(
    () => ({
      activeView,
      importButtonClassName,
      isLandscapeCompactCanvas,
      isSimplifiedView,
      onOpenImportModal,
      onResetCanvasView,
      onSetActiveView,
      onZoomIn,
      onZoomOut,
      responsiveLayoutWidth,
      topControlsLeadingGroupClassName,
      topControlsRowClassName,
      viewModeButtonClassName,
      viewModeTabsClassName,
      viewOptions,
      zoomControlsClassName,
      zoomControlsVisibilityClassName,
      zoomPercent,
    }),
    [
      activeView,
      importButtonClassName,
      isLandscapeCompactCanvas,
      isSimplifiedView,
      onOpenImportModal,
      onResetCanvasView,
      onSetActiveView,
      onZoomIn,
      onZoomOut,
      responsiveLayoutWidth,
      topControlsLeadingGroupClassName,
      topControlsRowClassName,
      viewModeButtonClassName,
      viewModeTabsClassName,
      viewOptions,
      zoomControlsClassName,
      zoomControlsVisibilityClassName,
      zoomPercent,
    ],
  );
}
