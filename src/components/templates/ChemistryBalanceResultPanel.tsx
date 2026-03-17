'use client';

import Panel from '@/components/atoms/Panel';
import useChemistryBalanceText from '@/components/templates/useChemistryBalanceText';
import type { BalanceChemicalEquationFlowResult } from '@/shared/chemistry/analysis';

type ChemistryBalanceResultPanelProps = {
  result: BalanceChemicalEquationFlowResult;
};

function ChemistryBalanceResultPanel({
  result,
}: ChemistryBalanceResultPanelProps) {
  const { text } = useChemistryBalanceText();

  return (
    <Panel className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {text.workspace.resultEyebrow}
          </p>
          <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
            {text.workspace.resultTitle}
          </h2>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
            result.ok
              ? 'border-[rgba(16,185,129,0.45)] bg-[rgba(16,185,129,0.14)] text-[var(--text-strong)]'
              : 'border-[rgba(245,158,11,0.45)] bg-[rgba(245,158,11,0.14)] text-[var(--text-strong)]'
          }`}
        >
          {result.ok ? text.common.balanced : result.stage}
        </span>
      </div>

      {result.ok ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-soft)] px-4 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {text.workspace.formattedLabel}
            </p>
            <p className="mt-2 break-words text-lg font-black text-[var(--text-strong)] sm:text-xl">
              {result.value.formatted}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {text.workspace.termsLabel}
              </p>
              <p className="mt-1 text-lg font-black text-[var(--text-strong)]">
                {result.value.equation.termCount}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {text.workspace.elementsLabel}
              </p>
              <p className="mt-1 text-lg font-black text-[var(--text-strong)]">
                {result.value.reaction.elementSymbols.length}
              </p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {text.workspace.vectorLabel}
              </p>
              <p className="mt-1 text-lg font-black text-[var(--text-strong)]">
                [{result.value.balancedReaction.coefficientVector.join(', ')}]
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.08)] px-4 py-4">
          <p className="text-sm font-semibold text-[var(--text-strong)]">
            {text.workspace.failurePrefix} <code>{result.stage}</code>
            {text.workspace.failureSuffix}
          </p>
          <ul className="space-y-2 text-sm leading-6 text-[var(--text-muted)]">
            {result.issues.map((issue, index) => (
              <li
                key={`${issue.stage}-${issue.code}-${index}`}
                className="rounded-xl bg-black/5 px-3 py-2"
              >
                <span className="font-semibold text-[var(--text-strong)]">{issue.code}</span>
                : {issue.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

export default ChemistryBalanceResultPanel;
