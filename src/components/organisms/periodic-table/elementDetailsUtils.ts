import { formatAtomicMass } from '@/shared/utils/elementPresentation';
import type { ChemicalElement } from '@/shared/types/element';

import type { ElementMetaRow } from './elementDetails.types';

const GENERIC_ELEMENT_IMAGE_PATH = '/s/transactinoid.png';

export function normalizeText(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

export function hasDisplayText(value: unknown): boolean {
  return normalizeText(value).length > 0;
}

export function normalizeElementImageUrl(value: unknown): string {
  const normalized = normalizeText(value);

  if (normalized.length === 0) {
    return '';
  }

  if (normalized.toLowerCase().includes(GENERIC_ELEMENT_IMAGE_PATH)) {
    return '';
  }

  return normalized;
}

export function formatNullableValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'Not informed';
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : String(value);
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      return 'Not informed';
    }

    return trimmedValue;
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'object') {
    return 'Not informed';
  }

  return String(value);
}

export function buildElementRows(element: ChemicalElement): ElementMetaRow[] {
  const ionizationEnergies = Array.isArray(element.ionization_energies)
    ? element.ionization_energies
    : [];
  const shells = Array.isArray(element.shells) ? element.shells : [];

  return [
    { label: 'Name', value: formatNullableValue(element.name) },
    { label: 'Symbol', value: formatNullableValue(element.symbol) },
    { label: 'Atomic Number', value: String(element.number) },
    { label: 'Atomic Mass', value: formatAtomicMass(element.atomic_mass) },
    { label: 'Category', value: formatNullableValue(element.category) },
    { label: 'Phase', value: formatNullableValue(element.phase) },
    { label: 'Group', value: String(element.group) },
    { label: 'Period', value: String(element.period) },
    { label: 'Block', value: formatNullableValue(element.block) },
    { label: 'Appearance', value: formatNullableValue(element.appearance) },
    { label: 'Density', value: formatNullableValue(element.density) },
    { label: 'Boiling Point', value: formatNullableValue(element.boil) },
    { label: 'Melting Point', value: formatNullableValue(element.melt) },
    { label: 'Molar Heat', value: formatNullableValue(element.molar_heat) },
    { label: 'Electron Affinity', value: formatNullableValue(element.electron_affinity) },
    {
      label: 'Electronegativity (Pauling)',
      value: formatNullableValue(element.electronegativity_pauling),
    },
    { label: 'Electron Configuration', value: formatNullableValue(element.electron_configuration) },
    {
      label: 'Electron Config (Semantic)',
      value: formatNullableValue(element.electron_configuration_semantic),
    },
    {
      label: 'Ionization Energies',
      value: ionizationEnergies.length === 0 ? 'Not informed' : ionizationEnergies.join(', '),
    },
    { label: 'Shells', value: shells.length === 0 ? 'Not informed' : shells.join(', ') },
    { label: 'Discovered By', value: formatNullableValue(element.discovered_by) },
    { label: 'Named By', value: formatNullableValue(element.named_by) },
    { label: 'CPK Hex', value: formatNullableValue(element['cpk-hex']) },
    { label: 'Table Position X', value: String(element.xpos) },
    { label: 'Table Position Y', value: String(element.ypos) },
    { label: 'Wide Position X', value: String(element.wxpos) },
    { label: 'Wide Position Y', value: String(element.wypos) },
    { label: 'Image Title', value: formatNullableValue(element.image?.title) },
    { label: 'Image Attribution', value: formatNullableValue(element.image?.attribution) },
    { label: 'Summary', value: formatNullableValue(element.summary) },
  ];
}

export function buildCardOptimizedRows(rows: ElementMetaRow[]): ElementMetaRow[] {
  const pinnedTopLabels = new Set([
    'Name',
    'Symbol',
    'Atomic Number',
    'Atomic Mass',
    'Category',
    'Phase',
    'Group',
    'Period',
    'Block',
  ]);
  const pinnedBottomLabels = new Set(['Ionization Energies']);

  const pinnedTop: ElementMetaRow[] = [];
  const compactRows: ElementMetaRow[] = [];
  const expansiveRows: ElementMetaRow[] = [];
  const pinnedBottom: ElementMetaRow[] = [];

  for (const row of rows) {
    if (pinnedTopLabels.has(row.label)) {
      pinnedTop.push(row);
      continue;
    }
    if (pinnedBottomLabels.has(row.label)) {
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
