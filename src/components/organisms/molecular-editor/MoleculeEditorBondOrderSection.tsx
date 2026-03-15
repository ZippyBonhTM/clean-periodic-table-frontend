'use client';

import type { BondOrder } from '@/shared/utils/moleculeEditor';

import { BondOrderIcon } from '@/components/organisms/molecular-editor/moleculeEditorToolRailIcons';

type MoleculeEditorBondOrderSectionProps = {
  activeElementMaxBondSlots: number | null;
  activeElementSymbol: string | null;
  bondOrder: BondOrder;
  bondOrderOptions: Array<{ order: BondOrder; label: string }>;
  collapsedSectionClassName: string;
  expandedSectionClassName: string;
  isCollapsed: boolean;
  onSetBondOrder: (order: BondOrder) => void;
  selectedAtomId: string | null;
  showExpandedContent: boolean;
};

export default function MoleculeEditorBondOrderSection({
  activeElementMaxBondSlots,
  activeElementSymbol,
  bondOrder,
  bondOrderOptions,
  collapsedSectionClassName,
  expandedSectionClassName,
  isCollapsed,
  onSetBondOrder,
  selectedAtomId,
  showExpandedContent,
}: MoleculeEditorBondOrderSectionProps) {
  return (
    <div className={isCollapsed ? collapsedSectionClassName : expandedSectionClassName}>
      {showExpandedContent ? (
        <div className="flex items-center gap-2 px-1">
          <BondOrderIcon />
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-(--text-muted)">Bond Order</p>
        </div>
      ) : null}
      <div className={`grid ${isCollapsed ? 'w-full grid-cols-1 place-items-center gap-2' : 'grid-cols-3 gap-1.5'}`}>
        {bondOrderOptions.map((option) => {
          const isDisabled =
            selectedAtomId === null &&
            activeElementMaxBondSlots !== null &&
            option.order > activeElementMaxBondSlots;
          const disabledTitle =
            activeElementSymbol !== null && activeElementMaxBondSlots !== null
              ? `${activeElementSymbol} commonly supports up to ${activeElementMaxBondSlots} bond slot${
                  activeElementMaxBondSlots === 1 ? '' : 's'
                }.`
              : `${option.label} bond`;

          return (
            <button
              key={option.order}
              type="button"
              onClick={() => onSetBondOrder(option.order)}
              disabled={isDisabled}
              title={isDisabled ? disabledTitle : `${option.label} bond`}
              aria-label={isDisabled ? disabledTitle : `${option.label} bond`}
              className={`border transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                isDisabled
                  ? 'border-(--border-subtle) bg-(--surface-2)/55 text-(--text-muted)'
                  : bondOrder === option.order
                    ? 'border-(--accent) bg-(--accent)/22 text-foreground'
                    : 'border-(--border-subtle) bg-(--surface-2)/70 text-(--text-muted) hover:border-(--accent) hover:text-foreground'
              } ${isCollapsed ? 'mx-auto h-9 w-9 rounded-xl text-sm font-black' : 'h-9 rounded-xl px-0 text-sm font-black'}`}
            >
              {option.order}
            </button>
          );
        })}
      </div>
    </div>
  );
}
