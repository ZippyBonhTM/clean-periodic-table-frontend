import { memo } from 'react';

import ElementTile from '@/components/molecules/ElementTile';
import type { ChemicalElement } from '@/shared/types/element';

type CompactPeriodicViewProps = {
  elements: ChemicalElement[];
  onElementOpen: (element: ChemicalElement) => void;
};

function CompactPeriodicView({ elements, onElementOpen }: CompactPeriodicViewProps) {
  return (
    <section className="surface-panel rounded-2xl border border-[var(--border-subtle)] p-3 md:p-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {elements.map((element) => (
          <div key={element.symbol} className="tile-enter render-lazy">
            <ElementTile element={element} density="regular" onOpen={onElementOpen} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default memo(CompactPeriodicView);
