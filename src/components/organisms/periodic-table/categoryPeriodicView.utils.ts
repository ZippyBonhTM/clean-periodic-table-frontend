import type { ChemicalElement } from '@/shared/types/element';

export type CategoryGroup = {
  category: string;
  elements: ChemicalElement[];
};

export function groupElementsByCategory(elements: ChemicalElement[]): CategoryGroup[] {
  const grouped = new Map<string, ChemicalElement[]>();

  for (const element of elements) {
    const entry = grouped.get(element.category);

    if (entry === undefined) {
      grouped.set(element.category, [element]);
      continue;
    }

    entry.push(element);
  }

  return [...grouped.entries()]
    .sort((first, second) => first[0].localeCompare(second[0]))
    .map(([category, groupedElements]) => {
      return {
        category,
        elements: groupedElements.sort((first, second) => first.number - second.number),
      };
    });
}
