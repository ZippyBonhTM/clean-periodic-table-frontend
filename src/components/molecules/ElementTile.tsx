import { memo } from 'react';

import type { ChemicalElement } from '@/shared/types/element';
import {
  formatAtomicMass,
  isElementRadioactive,
  resolveCategoryColor,
} from '@/shared/utils/elementPresentation';

type ElementTileMode = 'default' | 'classic';

type ElementTileProps = {
  element: ChemicalElement;
  density?: 'compact' | 'regular';
  mode?: ElementTileMode;
  onOpen?: (element: ChemicalElement) => void;
};

const compactMassFormatter = new Intl.NumberFormat('en-US', {
  maximumSignificantDigits: 4,
});

function compactPhase(phase: unknown): string {
  if (typeof phase !== 'string') {
    return 'n/a';
  }

  const normalizedPhase = phase.trim().toLowerCase();

  if (normalizedPhase.includes('solid')) {
    return 'Solid';
  }

  if (normalizedPhase.includes('liquid')) {
    return 'Liquid';
  }

  if (normalizedPhase.includes('gas')) {
    return 'Gas';
  }

  if (normalizedPhase.length > 8) {
    return normalizedPhase.slice(0, 8);
  }

  return phase.trim();
}

function compactAtomicMass(atomicMass: unknown): string {
  if (typeof atomicMass !== 'number' || !Number.isFinite(atomicMass)) {
    return 'n/a';
  }

  return compactMassFormatter.format(atomicMass);
}

function ElementTile({ element, density = 'regular', mode = 'default', onOpen }: ElementTileProps) {
  const color = resolveCategoryColor(element.category);
  const isRadioactive = isElementRadioactive(element);
  const isCompact = density === 'compact';
  const compactPhaseLabel = compactPhase(element.phase);
  const compactMassLabel = compactAtomicMass(element.atomic_mass);
  const symbolLength = element.symbol.trim().length;
  const nameLength = element.name.trim().length;
  const symbolClassName =
    symbolLength > 1
      ? 'element-classic-tile__symbol element-classic-tile__symbol--multi'
      : 'element-classic-tile__symbol element-classic-tile__symbol--single';
  const nameClassName =
    nameLength > 14
      ? 'element-classic-tile__name element-classic-tile__name--very-long'
      : nameLength > 10
        ? 'element-classic-tile__name element-classic-tile__name--long'
        : 'element-classic-tile__name';
  const massChipClassName =
    compactMassLabel.length > 6
      ? 'element-classic-tile__chip element-classic-tile__chip--compact'
      : 'element-classic-tile__chip';
  const phaseChipClassName =
    compactPhaseLabel.length > 6
      ? 'element-classic-tile__chip element-classic-tile__chip--compact'
      : 'element-classic-tile__chip';

  if (mode === 'classic') {
    return (
      <button
        type="button"
        onClick={() => onOpen?.(element)}
        className={`element-classic-tile relative h-full w-full overflow-hidden border text-left text-[var(--text-strong)] transition-transform duration-200 hover:-translate-y-0.5 ${
          onOpen !== undefined ? 'cursor-pointer' : 'cursor-default'
        }`}
        aria-label={`Open details of ${element.name}`}
        title={`${element.name} (${element.symbol})`}
        disabled={onOpen === undefined}
        style={{
          background: `linear-gradient(145deg, rgba(${color.rgb}, 0.2), rgba(${color.rgb}, 0.05) 58%, rgba(6, 12, 25, 0.34))`,
          borderColor: `rgba(${color.rgb}, 0.7)`,
          boxShadow: `0 0 0 1px var(--neon-border), 0 0 8px rgba(${color.rgb}, 0.18)`,
        }}
      >
        <div className="element-classic-tile__content">
          <div className="element-classic-tile__top">
            <span className="element-classic-tile__number">
              {element.number}
            </span>
            {isRadioactive ? (
              <span
                className="element-classic-tile__radio"
                title="Radioactive"
                aria-label="Radioactive element"
              >
                ☢
              </span>
            ) : (
              <span className="element-classic-tile__radio element-classic-tile__radio--hidden" aria-hidden="true">
                ☢
              </span>
            )}
          </div>

          <div className="element-classic-tile__core">
            <p className={symbolClassName} title={element.symbol}>
              {element.symbol}
            </p>
            <p className={nameClassName} title={element.name}>
              {element.name}
            </p>
          </div>

          <div className="element-classic-tile__stats">
            <span className={massChipClassName} title={compactMassLabel}>
              {compactMassLabel}
            </span>
            <span className={phaseChipClassName} title={compactPhaseLabel}>
              {compactPhaseLabel}
            </span>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen?.(element)}
      className={`relative h-full w-full overflow-hidden rounded-xl border text-left text-[var(--text-strong)] transition-transform duration-200 hover:-translate-y-0.5 ${
        onOpen !== undefined ? 'cursor-pointer' : 'cursor-default'
      } ${isCompact ? 'p-2' : 'p-3'}`}
      aria-label={`Open details of ${element.name}`}
      title={`${element.name} (${element.symbol})`}
      disabled={onOpen === undefined}
      style={{
        background: `linear-gradient(145deg, rgba(${color.rgb}, 0.2), rgba(${color.rgb}, 0.05) 58%, rgba(6, 12, 25, 0.34))`,
        borderColor: `rgba(${color.rgb}, 0.65)`,
        boxShadow: `0 0 0 1px var(--neon-border), 0 0 8px rgba(${color.rgb}, 0.2)`,
      }}
    >
      <span className="pointer-events-none absolute inset-0" />
      <div className="relative flex items-start justify-between gap-2">
        <span className="rounded-md border border-white/20 bg-black/20 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
          {element.number}
        </span>

        {isRadioactive ? (
          <span className="rounded-md border border-rose-400/70 bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-rose-300">
            Radioactive
          </span>
        ) : null}
      </div>

      <div className={`relative ${isCompact ? 'mt-1' : 'mt-2'}`}>
        <p className={`font-black tracking-tight ${isCompact ? 'text-xl' : 'text-2xl'}`}>{element.symbol}</p>
        <h3 className={`font-semibold leading-tight ${isCompact ? 'text-xs' : 'text-sm'}`}>{element.name}</h3>
      </div>

      <div className={`relative mt-2 flex items-center justify-between gap-2 text-[10px] ${isCompact ? '' : 'text-[11px]'}`}>
        <span className="rounded-md bg-black/20 px-1.5 py-0.5 text-[var(--text-muted)]">{color.label}</span>
        <span className="font-semibold text-[var(--text-strong)]">{formatAtomicMass(element.atomic_mass)}</span>
      </div>
    </button>
  );
}

export default memo(ElementTile);
