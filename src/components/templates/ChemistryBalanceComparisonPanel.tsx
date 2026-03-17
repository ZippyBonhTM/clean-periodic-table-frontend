'use client';

import Panel from '@/components/atoms/Panel';
import type { BalanceChemicalEquationFlowValue } from '@/shared/chemistry/analysis';

type ChemistryBalanceComparisonPanelProps = {
  value: BalanceChemicalEquationFlowValue | null;
};

type ParticipantComparison = {
  side: 'reactant' | 'product';
  label: string;
  inputCoefficient: number;
  balancedCoefficient: number;
};

function buildParticipantComparisons(
  value: BalanceChemicalEquationFlowValue,
): ParticipantComparison[] {
  const reactantComparisons = value.balancedReaction.reactants.map((participant) => ({
    side: 'reactant' as const,
    label: participant.formula.normalized,
    inputCoefficient: participant.inputCoefficient ?? 1,
    balancedCoefficient: participant.coefficient,
  }));

  const productComparisons = value.balancedReaction.products.map((participant) => ({
    side: 'product' as const,
    label: participant.formula.normalized,
    inputCoefficient: participant.inputCoefficient ?? 1,
    balancedCoefficient: participant.coefficient,
  }));

  return [...reactantComparisons, ...productComparisons];
}

function formatCoefficientDelta(
  inputCoefficient: number,
  balancedCoefficient: number,
): string {
  if (inputCoefficient === balancedCoefficient) {
    return 'unchanged';
  }

  return `${inputCoefficient} -> ${balancedCoefficient}`;
}

function ChemistryBalanceComparisonPanel({
  value,
}: ChemistryBalanceComparisonPanelProps) {
  if (value === null) {
    return (
      <Panel className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Comparison
          </p>
          <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
            Input vs Balanced
          </h2>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          This panel becomes available after the equation balances successfully.
        </div>
      </Panel>
    );
  }

  const comparisons = buildParticipantComparisons(value);

  return (
    <Panel className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Comparison
        </p>
        <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
          Input vs Balanced
        </h2>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Original
          </p>
          <p className="mt-2 break-words text-sm font-semibold text-[var(--text-strong)] sm:text-base">
            {value.equation.normalized}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-soft)] px-4 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Balanced
          </p>
          <p className="mt-2 break-words text-sm font-semibold text-[var(--text-strong)] sm:text-base">
            {value.formatted}
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {comparisons.map((comparison) => (
          <li
            key={`${comparison.side}-${comparison.label}`}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {comparison.side}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-strong)]">
                  {comparison.label}
                </p>
              </div>
              <span className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {formatCoefficientDelta(
                  comparison.inputCoefficient,
                  comparison.balancedCoefficient,
                )}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default ChemistryBalanceComparisonPanel;
