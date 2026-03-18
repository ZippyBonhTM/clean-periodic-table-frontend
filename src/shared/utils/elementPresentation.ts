import type { ChemicalElement } from '@/shared/types/element';

type ElementCategoryKey =
  | 'alkaliMetal'
  | 'alkalineEarthMetal'
  | 'transitionMetal'
  | 'postTransitionMetal'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'nobleGas'
  | 'lanthanide'
  | 'actinide'
  | 'unknown'
  | 'other';

type CategoryColor = {
  key: ElementCategoryKey;
  rgb: string;
};

const CATEGORY_COLORS: Array<{ keywords: string[]; color: CategoryColor }> = [
  {
    keywords: ['alkali metal'],
    color: { key: 'alkaliMetal', rgb: '251,146,60' },
  },
  {
    keywords: ['alkaline earth metal'],
    color: { key: 'alkalineEarthMetal', rgb: '253,224,71' },
  },
  {
    keywords: ['transition metal'],
    color: { key: 'transitionMetal', rgb: '56,189,248' },
  },
  {
    keywords: ['post-transition metal'],
    color: { key: 'postTransitionMetal', rgb: '244,114,182' },
  },
  {
    keywords: ['metalloid'],
    color: { key: 'metalloid', rgb: '34,197,94' },
  },
  {
    keywords: ['diatomic nonmetal', 'polyatomic nonmetal', 'nonmetal'],
    color: { key: 'nonmetal', rgb: '45,212,191' },
  },
  {
    keywords: ['halogen'],
    color: { key: 'halogen', rgb: '129,140,248' },
  },
  {
    keywords: ['noble gas'],
    color: { key: 'nobleGas', rgb: '192,132,252' },
  },
  {
    keywords: ['lanthanide'],
    color: { key: 'lanthanide', rgb: '248,113,113' },
  },
  {
    keywords: ['actinide'],
    color: { key: 'actinide', rgb: '236,72,153' },
  },
  {
    keywords: ['unknown'],
    color: { key: 'unknown', rgb: '148,163,184' },
  },
];

const DEFAULT_COLOR: CategoryColor = {
  key: 'other',
  rgb: '148,163,184',
};

function resolveElementCategoryKey(category: string): ElementCategoryKey {
  const normalized = category.toLowerCase();

  const matched = CATEGORY_COLORS.find((entry) => {
    return entry.keywords.some((keyword) => normalized.includes(keyword));
  });

  return matched?.color.key ?? DEFAULT_COLOR.key;
}

function resolveCategoryColor(category: string): CategoryColor {
  const key = resolveElementCategoryKey(category);
  const matched = CATEGORY_COLORS.find((entry) => entry.color.key === key);

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
  return resolveElementQueryRank(element, query) >= 0;
}

function resolveElementQueryRank(element: ChemicalElement, query: string): number {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length === 0) {
    return 0;
  }

  const normalizedName = element.name.toLowerCase();
  const normalizedSymbol = element.symbol.toLowerCase();
  const normalizedCategory = element.category.toLowerCase();
  const normalizedPhase = element.phase.toLowerCase();
  const normalizedBlock = element.block.toLowerCase();
  const normalizedNumber = String(element.number);

  if (normalizedSymbol === normalizedQuery) {
    return 0;
  }

  if (normalizedSymbol.startsWith(normalizedQuery)) {
    return 1;
  }

  if (normalizedNumber === normalizedQuery) {
    return 2;
  }

  if (normalizedName === normalizedQuery) {
    return 3;
  }

  if (normalizedName.startsWith(normalizedQuery)) {
    return 4;
  }

  if (normalizedSymbol.includes(normalizedQuery)) {
    return 5;
  }

  if (normalizedName.includes(normalizedQuery)) {
    return 6;
  }

  if (normalizedCategory.includes(normalizedQuery)) {
    return 7;
  }

  if (normalizedPhase.includes(normalizedQuery)) {
    return 8;
  }

  if (normalizedBlock.includes(normalizedQuery)) {
    return 9;
  }

  if (normalizedNumber.includes(normalizedQuery)) {
    return 10;
  }

  return -1;
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
  resolveElementQueryRank,
  resolveElementCategoryKey,
  resolveCategoryColor,
  sortElements,
};
export type { CategoryColor, ElementCategoryKey };
