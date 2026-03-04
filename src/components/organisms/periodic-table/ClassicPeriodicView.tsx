import { memo } from 'react';

import ElementTile from '@/components/molecules/ElementTile';
import type { ChemicalElement } from '@/shared/types/element';

type ClassicPeriodicViewProps = {
  elements: ChemicalElement[];
};

function ClassicPeriodicView({ elements }: ClassicPeriodicViewProps) {
  return (
    <section className="surface-panel rounded-2xl border border-[var(--border-subtle)] p-3 md:p-4">
      <div className="overflow-x-auto pb-2">
        <div
          className="grid min-w-[1060px] grid-cols-18 gap-1.5"
          style={{
            gridTemplateColumns: 'repeat(18, minmax(0, 1fr))',
            gridTemplateRows: 'repeat(10, minmax(0, 92px))',
          }}
        >
          {elements.map((element) => (
            <div
              key={element.symbol}
              style={{
                gridColumn: element.xpos,
                gridRow: element.ypos,
              }}
              className="tile-enter"
            >
              <ElementTile element={element} density="compact" />
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-[var(--text-muted)]">
        Classic layout by periodic position (group x period), including lanthanides and actinides on lower rows.
      </p>
    </section>
  );
}

export default memo(ClassicPeriodicView);
