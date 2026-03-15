'use client';

import { useMemo } from 'react';

import type { UseMoleculeFormulaPanelPropsOptions } from '@/components/organisms/molecular-editor/moleculeEditorSectionProps.types';

export default function useMoleculeFormulaPanelProps({
  formulaPanelStyle,
  formulaStatsRows,
  isFormulaPanelOpen,
  isLandscapeCompactCanvas,
  onToggleFormulaPanel,
}: UseMoleculeFormulaPanelPropsOptions) {
  return useMemo(
    () => ({
      isCompact: isLandscapeCompactCanvas,
      isOpen: isFormulaPanelOpen,
      rows: formulaStatsRows,
      style: formulaPanelStyle,
      onToggle: onToggleFormulaPanel,
    }),
    [isFormulaPanelOpen, isLandscapeCompactCanvas, formulaPanelStyle, formulaStatsRows, onToggleFormulaPanel],
  );
}
