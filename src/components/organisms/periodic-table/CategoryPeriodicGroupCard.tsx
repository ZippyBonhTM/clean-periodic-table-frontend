import ElementTile from '@/components/molecules/ElementTile';
import {
  formatElementCategoryLabel,
} from '@/components/organisms/periodic-table/periodicTableText';
import usePeriodicTableText from '@/components/organisms/periodic-table/usePeriodicTableText';
import type { ChemicalElement } from '@/shared/types/element';
import { resolveCategoryColor } from '@/shared/utils/elementPresentation';

type CategoryPeriodicGroupCardProps = {
  category: string;
  elements: ChemicalElement[];
  onElementOpen: (element: ChemicalElement) => void;
};

export default function CategoryPeriodicGroupCard({
  category,
  elements,
  onElementOpen,
}: CategoryPeriodicGroupCardProps) {
  const text = usePeriodicTableText();
  const color = resolveCategoryColor(category);
  const localizedCategory = formatElementCategoryLabel(text, category);

  return (
    <article
      className="surface-panel rounded-2xl border p-3"
      style={{
        borderColor: `rgba(${color.rgb}, 0.7)`,
        boxShadow: `0 0 0 1px var(--neon-border), 0 0 14px rgba(${color.rgb}, 0.18)`,
      }}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-strong)]">{localizedCategory}</h3>
        <span className="rounded-md border border-white/15 bg-black/20 px-2 py-1 text-xs text-[var(--text-muted)]">
          {elements.length}
        </span>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {elements.map((element) => (
          <div key={element.symbol} className="render-lazy">
            <ElementTile element={element} density="compact" onOpen={onElementOpen} />
          </div>
        ))}
      </div>
    </article>
  );
}
