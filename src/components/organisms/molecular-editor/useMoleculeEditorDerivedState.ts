'use client';

import { useMemo } from 'react';

import useMolecularEditorText from '@/components/organisms/molecular-editor/useMolecularEditorText';
import {
  formatMolecularEditorComponentLabel,
} from '@/components/organisms/molecular-editor/molecularEditorText';
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
  const text = useMolecularEditorText();
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
  const formulaDisplayValue = focusedSummary.atomCount === 0 ? text.common.notAvailable : focusedFormula;
  const systematicNameDisplayValue =
    focusedSummary.atomCount === 0 ? text.common.notAvailable : (resolvedNomenclatureValue ?? text.common.unavailable);
  const compactSystematicNameDisplayValue = systematicNameDisplayValue;
  const formulaStatsRows = useMemo(() => {
    const baseRows = [
      {
        label: text.summary.nomenclatureShort,
        compactLabel: text.summary.nomenclatureShort,
        title: text.summary.nomenclature,
        value: systematicNameDisplayValue,
        compactValue: compactSystematicNameDisplayValue,
      },
      {
        label: text.summary.formula,
        compactLabel: text.summary.formula,
        value: formulaDisplayValue,
      },
      {
        label: text.summary.atoms,
        compactLabel: text.summary.atoms,
        value: String(focusedSummary.atomCount),
      },
      {
        label: text.summary.bonds,
        compactLabel: text.summary.bonds,
        value: String(focusedSummary.bondCount),
      },
      {
        label: text.summary.slots,
        compactLabel: text.summary.slots,
        value: String(focusedSummary.totalBondOrder),
      },
    ];

    if (moleculeComponents.length <= 1) {
      return baseRows;
    }

    return [
      {
        label: text.summary.componentShort,
        compactLabel: text.summary.componentShort,
        title: text.summary.component,
        value: `${formatMolecularEditorComponentLabel(text, resolvedFocusedComponentIndex)} / ${moleculeComponents.length}`,
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
    text,
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
