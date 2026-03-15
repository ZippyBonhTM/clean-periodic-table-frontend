'use client';

import type { ChemicalElement } from '@/shared/types/element';
import { resolveCategoryColor } from '@/shared/utils/elementPresentation';
import { resolveMaxBondSlots } from '@/shared/utils/moleculeEditor';

type MoleculePaletteTileProps = {
  buttonRef?: (node: HTMLButtonElement | null) => void;
  element: ChemicalElement;
  isCentered: boolean;
  isCompact?: boolean;
  isSelected: boolean;
  paletteIndex: number;
};

export default function MoleculePaletteTile({
  buttonRef,
  element,
  isCentered,
  isCompact = false,
  isSelected,
  paletteIndex,
}: MoleculePaletteTileProps) {
  const color = resolveCategoryColor(element.category).rgb;
  const atomicNumberLabel = String(element.number);
  const atomicNumberBadgeClassName = element.number >= 100 ? 'min-w-[18px] text-[6px]' : 'min-w-[16px] text-[7px]';
  const isEmphasized = isSelected || isCentered;
  const selectedTileClassName = isCompact
    ? 'z-20 h-7 w-[4.5rem] scale-[1.01] shadow-[0_8px_16px_rgba(0,0,0,0.16)]'
    : 'z-20 h-10 w-32 scale-[1.01] shadow-[0_10px_20px_rgba(0,0,0,0.18)] sm:h-10 sm:w-33.5 lg:h-11 lg:w-37';
  const centeredTileClassName = isCompact
    ? 'z-10 h-7 w-7 scale-[1.08] opacity-100 shadow-[0_10px_16px_rgba(0,0,0,0.18)]'
    : 'z-10 h-10 w-10 scale-[1.12] opacity-100 shadow-[0_12px_20px_rgba(0,0,0,0.2)] sm:h-10 sm:w-10 lg:h-11 lg:w-11';
  const idleTileClassName = isCompact ? 'h-7 w-7 opacity-88' : 'h-10 w-10 opacity-88 sm:h-10 sm:w-10 lg:h-11 lg:w-11';
  const selectedLeftRailClassName = isCompact ? 'absolute inset-y-0 left-0 w-6' : 'absolute inset-y-0 left-0 w-10 sm:w-10 lg:w-11';
  const selectedLeftContentClassName = isCompact
    ? 'flex h-full items-center justify-center px-0.5 text-center'
    : 'flex h-full flex-col items-center justify-end px-1 pb-1 pt-2.5 text-center';
  const selectedNameClassName = isCompact
    ? 'hidden'
    : 'mt-0.5 max-w-full truncate text-[7px] font-semibold leading-tight text-(--text-muted) sm:text-[7px]';
  const selectedDataPanelClassName = isCompact
    ? 'absolute inset-y-0 left-6 right-0 border-l border-(--border-subtle)/85 bg-(--surface-overlay-subtle) shadow-[-1px_0_0_var(--surface-hairline)]'
    : 'absolute inset-y-0 left-10 right-0 border-l border-(--border-subtle)/85 bg-(--surface-overlay-subtle) shadow-[-1px_0_0_var(--surface-hairline)] sm:left-10 lg:left-11';
  const selectedTableClassName = isCompact
    ? 'h-full w-full table-fixed border-collapse text-[5px] leading-none text-(--text-muted)'
    : 'h-full w-full table-fixed border-collapse text-[7px] leading-none text-(--text-muted) sm:text-[8px] lg:text-[9px]';
  const selectedKeyClassName = isCompact
    ? 'w-[1rem] px-[3px] py-[2px] text-left font-semibold uppercase tracking-[0.02em] text-(--text-muted)'
    : 'w-6 px-1.5 py-0.75 text-left font-semibold uppercase tracking-[0.06em] text-(--text-muted) sm:w-6.5';
  const selectedValueClassName = isCompact
    ? 'truncate px-[3px] py-[2px] text-right font-semibold text-foreground'
    : 'truncate px-1.5 py-0.75 text-right font-semibold text-foreground';
  const idleContentClassName = isCompact
    ? 'flex h-full flex-col items-center justify-end px-0.5 pb-0.5 pt-1.5 text-center'
    : 'flex h-full flex-col items-center justify-end px-1 pb-1 pt-2.5 text-center';
  const idleNameClassName = isCompact
    ? 'mt-0.5 max-w-full truncate text-[5px] font-semibold leading-tight text-(--text-muted)'
    : 'mt-0.5 max-w-full truncate text-[7px] font-semibold leading-tight text-(--text-muted) sm:text-[7px]';

  return (
    <button
      ref={buttonRef}
      type="button"
      data-palette-index={paletteIndex}
      className={`relative shrink-0 overflow-hidden rounded-xl border text-left text-foreground transition-[width,transform,box-shadow,background,opacity] duration-150 ease-out ${
        isSelected ? selectedTileClassName : isCentered ? centeredTileClassName : idleTileClassName
      }`}
      title={`${element.name} (${element.symbol})`}
      style={{
        background: `linear-gradient(145deg, rgba(${color}, ${isEmphasized ? '0.26' : '0.2'}), rgba(${color}, 0.06) 58%, var(--tile-gradient-tail))`,
        borderColor: `rgba(${color}, ${isEmphasized ? '0.82' : '0.6'})`,
        boxShadow: isSelected
          ? `0 0 0 1px var(--neon-border), 0 0 14px rgba(${color}, 0.26)`
          : isCentered
            ? `0 0 0 1px var(--neon-border), 0 0 12px rgba(${color}, 0.2)`
            : `0 0 0 1px var(--neon-border), 0 0 8px rgba(${color}, 0.18)`,
      }}
      aria-label={`Select ${element.name}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 inline-flex items-center justify-center rounded-full border px-1 py-px font-semibold leading-none tabular-nums text-(--text-muted) ${atomicNumberBadgeClassName} ${
          isSelected
            ? 'border-(--border-subtle)/70 bg-(--surface-overlay-badge-strong)'
            : 'border-(--border-subtle)/65 bg-(--surface-overlay-badge)'
        }`}
      >
        {atomicNumberLabel}
      </span>
      {isSelected ? (
        <>
          <div className={selectedLeftRailClassName}>
            <div className={selectedLeftContentClassName}>
              <p
                className={
                  isCompact ? 'text-[11px] font-black leading-none tracking-tight' : 'text-xs font-black leading-none tracking-tight sm:text-sm lg:text-base'
                }
              >
                {element.symbol}
              </p>
              <p className={selectedNameClassName}>{element.name}</p>
            </div>
          </div>

          <div className={selectedDataPanelClassName}>
            <table className={selectedTableClassName}>
              <tbody>
                <tr className="bg-(--surface-row-soft)">
                  <th className={selectedKeyClassName}>Sh</th>
                  <td className={selectedValueClassName}>{element.shells.join('-')}</td>
                </tr>
                <tr className="bg-(--surface-row-strong)">
                  <th className={selectedKeyClassName}>B</th>
                  <td className={selectedValueClassName}>{resolveMaxBondSlots(element)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className={idleContentClassName}>
          <p
            className={
              isCompact ? 'text-[11px] font-black leading-none tracking-tight' : 'text-xs font-black leading-none tracking-tight sm:text-sm lg:text-base'
            }
          >
            {element.symbol}
          </p>
          <p className={idleNameClassName}>{element.name}</p>
        </div>
      )}
    </button>
  );
}
