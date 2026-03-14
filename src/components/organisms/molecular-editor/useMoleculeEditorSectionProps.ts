'use client';

import { useMemo } from 'react';

import useMoleculeEditorCanvasPanelProps from '@/components/organisms/molecular-editor/useMoleculeEditorCanvasPanelProps';
import useMoleculeEditorToolRailProps from '@/components/organisms/molecular-editor/useMoleculeEditorToolRailProps';
import useMoleculeEditorTopBarProps from '@/components/organisms/molecular-editor/useMoleculeEditorTopBarProps';
import type {
  MoleculeEditorSectionProps,
  UseMoleculeEditorSectionPropsOptions,
} from '@/components/organisms/molecular-editor/moleculeEditorSectionProps.types';

export default function useMoleculeEditorSectionProps({
  focusedComponentIndex,
  moleculeComponents,
  shouldShowComponentFocusRail,
  topControlsBlockClassName,
  topControlsRef,
  ...options
}: UseMoleculeEditorSectionPropsOptions): MoleculeEditorSectionProps {
  const topBarProps = useMoleculeEditorTopBarProps(options);
  const toolRailProps = useMoleculeEditorToolRailProps(options);
  const canvasPanelProps = useMoleculeEditorCanvasPanelProps({
    ...options,
    focusedComponentIndex,
    moleculeComponents,
    toolRailProps,
  });

  const componentFocusRailProps = useMemo(
    () => ({
      components: moleculeComponents,
      focusedComponentIndex,
      isCompact: options.isLandscapeCompactCanvas,
      onFocusComponent: options.onFocusComponent,
    }),
    [
      focusedComponentIndex,
      moleculeComponents,
      options.isLandscapeCompactCanvas,
      options.onFocusComponent,
    ],
  );

  return useMemo(
    () => ({
      topControlsBlockClassName,
      topControlsRef,
      topBarProps,
      showComponentFocusRail: shouldShowComponentFocusRail,
      componentFocusRailProps,
      canvasPanelProps,
    }),
    [
      canvasPanelProps,
      componentFocusRailProps,
      shouldShowComponentFocusRail,
      topBarProps,
      topControlsBlockClassName,
      topControlsRef,
    ],
  );
}
