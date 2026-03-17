'use client';

import Button from '@/components/atoms/Button';
import Panel from '@/components/atoms/Panel';
import {
  CHEMISTRY_BALANCE_EXAMPLES,
  type ChemistryBalanceExample,
} from '@/components/templates/chemistryBalanceExamples';

type ChemistryBalanceExamplesPanelProps = {
  onSelect: (equation: string) => void;
};

function formatCategoryLabel(category: ChemistryBalanceExample['category']): string {
  switch (category) {
    case 'combustion':
      return 'Combustion';
    case 'synthesis':
      return 'Synthesis';
    case 'decomposition':
      return 'Decomposition';
    case 'ionic':
      return 'Ionic';
    default:
      return category;
  }
}

function ChemistryBalanceExamplesPanel({
  onSelect,
}: ChemistryBalanceExamplesPanelProps) {
  return (
    <Panel className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Guided Examples
        </p>
        <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
          Try a Category
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
          These examples are grouped by common reaction patterns so we can inspect the local solver
          and heuristics from different angles.
        </p>
      </div>

      <ul className="space-y-3">
        {CHEMISTRY_BALANCE_EXAMPLES.map((example) => (
          <li
            key={`${example.category}-${example.equation}`}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <span className="inline-flex rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  {formatCategoryLabel(example.category)}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-strong)]">{example.title}</h3>
                  <p className="mt-1 break-words text-sm font-semibold text-[var(--accent-strong)]">
                    {example.equation}
                  </p>
                </div>
                <p className="text-sm leading-6 text-[var(--text-muted)]">{example.description}</p>
              </div>

              <Button
                variant="secondary"
                size="md"
                className="shrink-0"
                onClick={() => onSelect(example.equation)}
              >
                Use
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default ChemistryBalanceExamplesPanel;
