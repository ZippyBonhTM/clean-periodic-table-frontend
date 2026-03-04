import { memo } from 'react';

import type { ChemicalElement } from '@/shared/types/element';
import {
  formatAtomicMass,
  isElementRadioactive,
  resolveCategoryColor,
} from '@/shared/utils/elementPresentation';

type ElementTileProps = {
  element: ChemicalElement;
  density?: 'compact' | 'regular';
};

function ElementTile({ element, density = 'regular' }: ElementTileProps) {
  const color = resolveCategoryColor(element.category);
  const isRadioactive = isElementRadioactive(element);
  const isCompact = density === 'compact';

  return (
    <article
      className={`relative h-full overflow-hidden rounded-xl border text-[var(--text-strong)] transition-transform duration-200 hover:-translate-y-0.5 ${
        isCompact ? 'p-2' : 'p-3'
      }`}
      style={{
        background: `linear-gradient(145deg, rgba(${color.rgb}, 0.2), rgba(${color.rgb}, 0.05) 58%, rgba(6, 12, 25, 0.34))`,
        borderColor: `rgba(${color.rgb}, 0.65)`,
        boxShadow: `0 0 0 1px var(--neon-border), 0 0 14px rgba(${color.rgb}, 0.24)`,
      }}
      title={`${element.name} (${element.symbol})`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-md border border-white/20 bg-black/20 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
          #{element.number}
        </span>

        {isRadioactive ? (
          <span className="rounded-md border border-rose-400/70 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-rose-300">
            Radioactive
          </span>
        ) : null}
      </div>

      <div className={isCompact ? 'mt-1' : 'mt-2'}>
        <p className={`font-black tracking-tight ${isCompact ? 'text-xl' : 'text-2xl'}`}>{element.symbol}</p>
        <h3 className={`font-semibold leading-tight ${isCompact ? 'text-xs' : 'text-sm'}`}>{element.name}</h3>
      </div>

      <div className={`mt-2 flex items-center justify-between gap-2 text-[10px] ${isCompact ? '' : 'text-[11px]'}`}>
        <span className="rounded-md bg-black/20 px-1.5 py-0.5 text-[var(--text-muted)]">{color.label}</span>
        <span className="font-semibold text-[var(--text-strong)]">{formatAtomicMass(element.atomic_mass)}</span>
      </div>
    </article>
  );
}

export default memo(ElementTile);
