import { memo, useMemo } from 'react';

import type { ChemicalElement } from '@/shared/types/element';

import CategoryPeriodicGroupCard from './CategoryPeriodicGroupCard';
import { groupElementsByCategory } from './categoryPeriodicView.utils';

type CategoryPeriodicViewProps = {
  elements: ChemicalElement[];
  onElementOpen: (element: ChemicalElement) => void;
};

function CategoryPeriodicView({ elements, onElementOpen }: CategoryPeriodicViewProps) {
  const groupedByCategory = useMemo(() => {
    return groupElementsByCategory(elements);
  }, [elements]);

  return (
    <section className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groupedByCategory.map(({ category, elements: groupedElements }) => (
          <CategoryPeriodicGroupCard
            key={category}
            category={category}
            elements={groupedElements}
            onElementOpen={onElementOpen}
          />
        ))}
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Category view keeps elements agnostic from fixed coordinates and emphasizes family comparison.
      </p>
    </section>
  );
}

export default memo(CategoryPeriodicView);
