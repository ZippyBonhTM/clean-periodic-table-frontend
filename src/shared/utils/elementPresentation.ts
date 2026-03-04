import type { ChemicalElement } from '@/shared/types/element';

type CategoryColor = {
  label: string;
  rgb: string;
};

const CATEGORY_COLORS: Array<{ keywords: string[]; color: CategoryColor }> = [
  {
    keywords: ['alkali metal'],
    color: { label: 'alkali metal', rgb: '251,146,60' },
  },
  {
    keywords: ['alkaline earth metal'],
    color: { label: 'alkaline earth metal', rgb: '253,224,71' },
  },
  {
    keywords: ['transition metal'],
    color: { label: 'transition metal', rgb: '56,189,248' },
  },
  {
    keywords: ['post-transition metal'],
    color: { label: 'post-transition metal', rgb: '244,114,182' },
  },
  {
    keywords: ['metalloid'],
    color: { label: 'metalloid', rgb: '34,197,94' },
  },
  {
    keywords: ['diatomic nonmetal', 'polyatomic nonmetal', 'nonmetal'],
    color: { label: 'nonmetal', rgb: '45,212,191' },
  },
  {
    keywords: ['halogen'],
    color: { label: 'halogen', rgb: '129,140,248' },
  },
  {
    keywords: ['noble gas'],
    color: { label: 'noble gas', rgb: '192,132,252' },
  },
  {
    keywords: ['lanthanide'],
    color: { label: 'lanthanide', rgb: '248,113,113' },
  },
  {
    keywords: ['actinide'],
    color: { label: 'actinide', rgb: '236,72,153' },
  },
  {
    keywords: ['unknown'],
    color: { label: 'unknown', rgb: '148,163,184' },
  },
];

const DEFAULT_COLOR: CategoryColor = {
  label: 'other',
  rgb: '148,163,184',
};

function resolveCategoryColor(category: string): CategoryColor {
  const normalized = category.toLowerCase();

  const matched = CATEGORY_COLORS.find((entry) => {
    return entry.keywords.some((keyword) => normalized.includes(keyword));
  });

  return matched?.color ?? DEFAULT_COLOR;
}

function isElementRadioactive(element: ChemicalElement): boolean {
  if (element.number === 43 || element.number === 61) {
    return true;
  }

  return element.number >= 84;
}

function formatAtomicMass(atomicMass: number): string {
  if (!Number.isFinite(atomicMass)) {
    return 'n/a';
  }

  if (atomicMass >= 100) {
    return atomicMass.toFixed(1);
  }

  return atomicMass.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
}

function matchesElementQuery(element: ChemicalElement, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return true;
  }

  return (
    element.name.toLowerCase().includes(normalizedQuery) ||
    element.symbol.toLowerCase().includes(normalizedQuery) ||
    element.category.toLowerCase().includes(normalizedQuery) ||
    element.phase.toLowerCase().includes(normalizedQuery) ||
    element.block.toLowerCase().includes(normalizedQuery) ||
    String(element.number).includes(normalizedQuery)
  );
}

function sortElements(
  elements: ChemicalElement[],
  sortBy: 'number' | 'name' | 'mass' | 'symbol',
): ChemicalElement[] {
  const cloned = [...elements];

  switch (sortBy) {
    case 'name':
      return cloned.sort((first, second) => first.name.localeCompare(second.name));
    case 'mass':
      return cloned.sort((first, second) => first.atomic_mass - second.atomic_mass);
    case 'symbol':
      return cloned.sort((first, second) => first.symbol.localeCompare(second.symbol));
    case 'number':
    default:
      return cloned.sort((first, second) => first.number - second.number);
  }
}

export {
  formatAtomicMass,
  isElementRadioactive,
  matchesElementQuery,
  resolveCategoryColor,
  sortElements,
};
export type { CategoryColor };
