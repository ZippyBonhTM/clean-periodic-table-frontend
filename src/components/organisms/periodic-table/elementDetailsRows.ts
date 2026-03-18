import type { ChemicalElement } from '@/shared/types/element';
import type { PeriodicTableTextCatalog } from '@/components/organisms/periodic-table/periodicTableText';
import {
  formatAtomicMass,
} from '@/shared/utils/elementPresentation';
import {
  formatElementCategoryLabel,
  formatElementPhaseLabel,
} from '@/components/organisms/periodic-table/periodicTableText';

import type { ElementMetaRow } from './elementDetails.types';
import { formatNullableValue } from './elementDetailsText';

type ElementDetailsFieldLabels = PeriodicTableTextCatalog['details']['fields'];
type ElementDetailsCommonLabels = Pick<PeriodicTableTextCatalog['common'], 'yes' | 'no'>;

export function buildElementRows(
  element: ChemicalElement,
  text: PeriodicTableTextCatalog,
  fieldLabels: ElementDetailsFieldLabels,
  commonLabels: ElementDetailsCommonLabels,
): ElementMetaRow[] {
  const ionizationEnergies = Array.isArray(element.ionization_energies)
    ? element.ionization_energies
    : [];
  const shells = Array.isArray(element.shells) ? element.shells : [];
  const nullableValueText = {
    fallbackText: fieldLabels.notInformed,
    yesText: commonLabels.yes,
    noText: commonLabels.no,
  };

  return [
    { key: 'name', label: fieldLabels.name, value: formatNullableValue(element.name, nullableValueText) },
    { key: 'symbol', label: fieldLabels.symbol, value: formatNullableValue(element.symbol, nullableValueText) },
    { key: 'atomicNumber', label: fieldLabels.atomicNumber, value: String(element.number) },
    { key: 'atomicMass', label: fieldLabels.atomicMass, value: formatAtomicMass(element.atomic_mass) },
    { key: 'category', label: fieldLabels.category, value: formatElementCategoryLabel(text, element.category, fieldLabels.notInformed) },
    { key: 'phase', label: fieldLabels.phase, value: formatElementPhaseLabel(text, element.phase, fieldLabels.notInformed) },
    { key: 'group', label: fieldLabels.group, value: String(element.group) },
    { key: 'period', label: fieldLabels.period, value: String(element.period) },
    { key: 'block', label: fieldLabels.block, value: formatNullableValue(element.block, nullableValueText) },
    { key: 'appearance', label: fieldLabels.appearance, value: formatNullableValue(element.appearance, nullableValueText) },
    { key: 'density', label: fieldLabels.density, value: formatNullableValue(element.density, nullableValueText) },
    { key: 'boilingPoint', label: fieldLabels.boilingPoint, value: formatNullableValue(element.boil, nullableValueText) },
    { key: 'meltingPoint', label: fieldLabels.meltingPoint, value: formatNullableValue(element.melt, nullableValueText) },
    { key: 'molarHeat', label: fieldLabels.molarHeat, value: formatNullableValue(element.molar_heat, nullableValueText) },
    { key: 'electronAffinity', label: fieldLabels.electronAffinity, value: formatNullableValue(element.electron_affinity, nullableValueText) },
    {
      key: 'electronegativityPauling',
      label: fieldLabels.electronegativityPauling,
      value: formatNullableValue(element.electronegativity_pauling, nullableValueText),
    },
    {
      key: 'electronConfiguration',
      label: fieldLabels.electronConfiguration,
      value: formatNullableValue(element.electron_configuration, nullableValueText),
    },
    {
      key: 'electronConfigSemantic',
      label: fieldLabels.electronConfigSemantic,
      value: formatNullableValue(element.electron_configuration_semantic, nullableValueText),
    },
    {
      key: 'ionizationEnergies',
      label: fieldLabels.ionizationEnergies,
      value: ionizationEnergies.length === 0 ? fieldLabels.notInformed : ionizationEnergies.join(', '),
    },
    { key: 'shells', label: fieldLabels.shells, value: shells.length === 0 ? fieldLabels.notInformed : shells.join(', ') },
    { key: 'discoveredBy', label: fieldLabels.discoveredBy, value: formatNullableValue(element.discovered_by, nullableValueText) },
    { key: 'namedBy', label: fieldLabels.namedBy, value: formatNullableValue(element.named_by, nullableValueText) },
    { key: 'cpkHex', label: fieldLabels.cpkHex, value: formatNullableValue(element['cpk-hex'], nullableValueText) },
    { key: 'tablePositionX', label: fieldLabels.tablePositionX, value: String(element.xpos) },
    { key: 'tablePositionY', label: fieldLabels.tablePositionY, value: String(element.ypos) },
    { key: 'widePositionX', label: fieldLabels.widePositionX, value: String(element.wxpos) },
    { key: 'widePositionY', label: fieldLabels.widePositionY, value: String(element.wypos) },
    { key: 'imageTitle', label: fieldLabels.imageTitle, value: formatNullableValue(element.image?.title, nullableValueText) },
    { key: 'imageAttribution', label: fieldLabels.imageAttribution, value: formatNullableValue(element.image?.attribution, nullableValueText) },
    { key: 'summary', label: fieldLabels.summary, value: formatNullableValue(element.summary, nullableValueText) },
  ];
}

export function buildCardOptimizedRows(rows: ElementMetaRow[]): ElementMetaRow[] {
  const pinnedTopLabels = new Set([
    'name',
    'symbol',
    'atomicNumber',
    'atomicMass',
    'category',
    'phase',
    'group',
    'period',
    'block',
  ]);
  const pinnedBottomLabels = new Set(['ionizationEnergies']);

  const pinnedTop: ElementMetaRow[] = [];
  const compactRows: ElementMetaRow[] = [];
  const expansiveRows: ElementMetaRow[] = [];
  const pinnedBottom: ElementMetaRow[] = [];

  for (const row of rows) {
    if (pinnedTopLabels.has(row.key)) {
      pinnedTop.push(row);
      continue;
    }
    if (pinnedBottomLabels.has(row.key)) {
      pinnedBottom.push(row);
      continue;
    }

    const normalizedValue = row.value.trim();
    const visualWeight = Math.max(row.label.length, normalizedValue.length);
    const isExpansive =
      visualWeight >= 22 || normalizedValue.includes(',') || normalizedValue.includes(';');

    if (isExpansive) {
      expansiveRows.push(row);
      continue;
    }

    compactRows.push(row);
  }

  return [...pinnedTop, ...compactRows, ...expansiveRows, ...pinnedBottom];
}
