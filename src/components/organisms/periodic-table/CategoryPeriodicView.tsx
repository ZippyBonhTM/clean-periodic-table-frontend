import { memo, useMemo } from 'react';

import ElementTile from '@/components/molecules/ElementTile';
import type { ChemicalElement } from '@/shared/types/element';
import { resolveCategoryColor } from '@/shared/utils/elementPresentation';

type CategoryPeriodicViewProps = {
  elements: ChemicalElement[];
  onElementOpen: (element: ChemicalElement) => void;
};

function CategoryPeriodicView({ elements, onElementOpen }: CategoryPeriodicViewProps) {
  const groupedByCategory = useMemo(() => {
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
  }, [elements]);

  return (
    <section className="space-y-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {groupedByCategory.map(({ category, elements: groupedElements }) => {
          const color = resolveCategoryColor(category);

          return (
            <article
              key={category}
              className="surface-panel rounded-2xl border p-3"
              style={{
                borderColor: `rgba(${color.rgb}, 0.7)`,
                boxShadow: `0 0 0 1px var(--neon-border), 0 0 14px rgba(${color.rgb}, 0.18)`,
              }}
            >
              <header className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold capitalize text-[var(--text-strong)]">{category}</h3>
                <span className="rounded-md border border-white/15 bg-black/20 px-2 py-1 text-xs text-[var(--text-muted)]">
                  {groupedElements.length}
                </span>
              </header>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {groupedElements.map((element) => (
                  <div key={element.symbol} className="render-lazy">
                    <ElementTile element={element} density="compact" onOpen={onElementOpen} />
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Category view keeps elements agnostic from fixed coordinates and emphasizes family comparison.
      </p>
    </section>
  );
}

export default memo(CategoryPeriodicView);
