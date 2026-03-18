import { memo } from 'react';

import {
  formatElementModalTitle,
  formatElementTileOpenLabel,
} from '@/components/organisms/periodic-table/periodicTableText';
import usePeriodicTableText from '@/components/organisms/periodic-table/usePeriodicTableText';
import useAppLocale from '@/shared/i18n/useAppLocale';
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

const compactMassFormatterByLocale = {
  'en-US': new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: 4,
  }),
  'pt-BR': new Intl.NumberFormat('pt-BR', {
    maximumSignificantDigits: 4,
  }),
} as const;

function RadioactiveIcon() {
  const bladePath = 'M12 5.4a6.6 6.6 0 0 1 5.2 2.52l-3.46 2a2.62 2.62 0 0 0-1.74-1V5.4Z';

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="element-classic-tile__radio-icon"
    >
      <g transform="translate(12 12) scale(1.58) translate(-12 -12)">
        <path fill="currentColor" d={bladePath} />
        <path fill="currentColor" d={bladePath} transform="rotate(120 12 12)" />
        <path fill="currentColor" d={bladePath} transform="rotate(240 12 12)" />
        <circle cx="12" cy="12" r="1.75" fill="currentColor" />
      </g>
    </svg>
  );
}

function compactPhase(phase: unknown, text: ReturnType<typeof usePeriodicTableText>): string {
  if (typeof phase !== 'string') {
    return text.common.notAvailableShort;
  }

  const normalizedPhase = phase.trim().toLowerCase();

  if (normalizedPhase.includes('solid')) {
    return text.tile.phase.solid;
  }

  if (normalizedPhase.includes('liquid')) {
    return text.tile.phase.liquid;
  }

  if (normalizedPhase.includes('gas')) {
    return text.tile.phase.gas;
  }

  if (normalizedPhase.length > 8) {
    return normalizedPhase.slice(0, 8);
  }

  return phase.trim();
}

function compactAtomicMass(
  atomicMass: unknown,
  locale: ReturnType<typeof useAppLocale>['locale'],
  text: ReturnType<typeof usePeriodicTableText>,
): string {
  if (typeof atomicMass !== 'number' || !Number.isFinite(atomicMass)) {
    return text.common.notAvailableShort;
  }

  return compactMassFormatterByLocale[locale].format(atomicMass);
}

function ElementTile({ element, density = 'regular', mode = 'default', onOpen }: ElementTileProps) {
  const text = usePeriodicTableText();
  const { locale } = useAppLocale();
  const color = resolveCategoryColor(element.category);
  const isRadioactive = isElementRadioactive(element);
  const isCompact = density === 'compact';
  const compactPhaseLabel = compactPhase(element.phase, text);
  const compactMassLabel = compactAtomicMass(element.atomic_mass, locale, text);
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
        aria-label={formatElementTileOpenLabel(text, element.name)}
        title={formatElementModalTitle(text, element.name, element.symbol)}
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
                title={text.details.badges.radioactive}
                aria-label={text.tile.radioactiveElement}
              >
                <RadioactiveIcon />
              </span>
            ) : (
              <span
                className="element-classic-tile__radio element-classic-tile__radio--hidden"
                aria-hidden="true"
              >
                <RadioactiveIcon />
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
      aria-label={formatElementTileOpenLabel(text, element.name)}
      title={formatElementModalTitle(text, element.name, element.symbol)}
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
            {text.details.badges.radioactive}
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
