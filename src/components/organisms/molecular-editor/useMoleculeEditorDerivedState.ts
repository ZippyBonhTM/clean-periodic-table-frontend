'use client';

import { useMemo } from 'react';

import type { SavedMolecule } from '@/shared/types/molecule';
import type { ChemicalElement } from '@/shared/types/element';
import {
  buildCompositionRows,
  buildMolecularFormula,
  buildSystematicMoleculeName,
  resolveMaxBondSlots,
  resolveMoleculeComponents,
  summarizeMolecule,
  type MoleculeModel,
} from '@/shared/utils/moleculeEditor';

import {
  normalizeOptionalText,
  normalizeSavedMoleculeRecord,
  resolveMoleculeComponentIndexByAtomId,
} from '@/components/organisms/molecular-editor/moleculeEditorSession';

type UseMoleculeEditorDerivedStateOptions = {
  activeElement: ChemicalElement | null;
  focusedComponentIndex: number;
  molecule: MoleculeModel;
  nomenclatureFallback: string | null;
  savedMolecules: SavedMolecule[];
  selectedAtomId: string | null;
};

export default function useMoleculeEditorDerivedState({
  activeElement,
  focusedComponentIndex,
  molecule,
  nomenclatureFallback,
  savedMolecules,
  selectedAtomId,
}: UseMoleculeEditorDerivedStateOptions) {
  const activeElementMaxBondSlots = activeElement === null ? null : resolveMaxBondSlots(activeElement);
  const summary = useMemo(() => summarizeMolecule(molecule), [molecule]);
  const formula = useMemo(() => buildMolecularFormula(molecule), [molecule]);
  const moleculeComponents = useMemo(() => resolveMoleculeComponents(molecule), [molecule]);
  const selectedComponentIndex = useMemo(
    () => resolveMoleculeComponentIndexByAtomId(moleculeComponents, selectedAtomId),
    [moleculeComponents, selectedAtomId],
  );
  const resolvedFocusedComponentIndex =
    moleculeComponents.length === 0
      ? 0
      : selectedComponentIndex ?? Math.min(Math.max(focusedComponentIndex, 0), moleculeComponents.length - 1);
  const focusedComponent = moleculeComponents[resolvedFocusedComponentIndex] ?? null;
  const focusedComponentModel = focusedComponent?.model ?? molecule;
  const focusedSummary = useMemo(() => summarizeMolecule(focusedComponentModel), [focusedComponentModel]);
  const focusedFormula = useMemo(() => buildMolecularFormula(focusedComponentModel), [focusedComponentModel]);
  const focusedSystematicName = useMemo(
    () => buildSystematicMoleculeName(focusedComponentModel),
    [focusedComponentModel],
  );
  const resolvedNomenclatureValue =
    focusedSystematicName ??
    (moleculeComponents.length === 1 && nomenclatureFallback !== null
      ? normalizeOptionalText(nomenclatureFallback)
      : null);
  const formulaDisplayValue = focusedSummary.atomCount === 0 ? 'N/A' : focusedFormula;
  const systematicNameDisplayValue =
    focusedSummary.atomCount === 0 ? 'N/A' : (resolvedNomenclatureValue ?? 'Unavailable');
  const compactSystematicNameDisplayValue =
    systematicNameDisplayValue === 'Unavailable' ? 'Unavail.' : systematicNameDisplayValue;
  const formulaStatsRows = useMemo(() => {
    const baseRows = [
      {
        label: 'Nomen.',
        compactLabel: 'Nomen.',
        title: 'Nomenclature',
        value: systematicNameDisplayValue,
        compactValue: compactSystematicNameDisplayValue,
      },
      {
        label: 'Formula',
        compactLabel: 'Formula',
        value: formulaDisplayValue,
      },
      {
        label: 'Atoms',
        compactLabel: 'Atoms',
        value: String(focusedSummary.atomCount),
      },
      {
        label: 'Bonds',
        compactLabel: 'Bonds',
        value: String(focusedSummary.bondCount),
      },
      {
        label: 'Slots',
        compactLabel: 'Slots',
        value: String(focusedSummary.totalBondOrder),
      },
    ];

    if (moleculeComponents.length <= 1) {
      return baseRows;
    }

    return [
      {
        label: 'Comp.',
        compactLabel: 'Comp.',
        title: 'Component',
        value: `Mol ${resolvedFocusedComponentIndex + 1} / ${moleculeComponents.length}`,
        compactValue: `${resolvedFocusedComponentIndex + 1}/${moleculeComponents.length}`,
      },
      ...baseRows,
    ];
  }, [
    compactSystematicNameDisplayValue,
    focusedSummary.atomCount,
    focusedSummary.bondCount,
    focusedSummary.totalBondOrder,
    formulaDisplayValue,
    moleculeComponents.length,
    resolvedFocusedComponentIndex,
    systematicNameDisplayValue,
  ]);
  const compositionRows = useMemo(() => buildCompositionRows(focusedComponentModel), [focusedComponentModel]);
  const normalizedSavedMolecules = useMemo(
    () => savedMolecules.map((entry) => normalizeSavedMoleculeRecord(entry)),
    [savedMolecules],
  );

  return {
    activeElementMaxBondSlots,
    compositionRows,
    focusedSummary,
    formula,
    formulaDisplayValue,
    formulaStatsRows,
    moleculeComponents,
    normalizedSavedMolecules,
    resolvedFocusedComponentIndex,
    summary,
    systematicNameDisplayValue,
  };
}
