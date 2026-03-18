'use client';

import Button from '@/components/atoms/Button';
import NoTranslateText from '@/components/atoms/NoTranslateText';
import Panel from '@/components/atoms/Panel';
import {
  getChemistryBalanceExamples,
} from '@/components/templates/chemistryBalanceExamples';
import {
  formatChemistryBalanceExampleCategory,
} from '@/components/templates/chemistryBalanceText';
import useChemistryBalanceText from '@/components/templates/useChemistryBalanceText';

type ChemistryBalanceExamplesPanelProps = {
  onSelect: (equation: string) => void;
};

function ChemistryBalanceExamplesPanel({
  onSelect,
}: ChemistryBalanceExamplesPanelProps) {
  const { text } = useChemistryBalanceText();
  const examples = getChemistryBalanceExamples(text);

  return (
    <Panel className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {text.examples.eyebrow}
        </p>
        <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
          {text.examples.title}
        </h2>
        {text.examples.description.length > 0 ? (
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            {text.examples.description}
          </p>
        ) : null}
      </div>

      <ul className="space-y-3">
        {examples.map((example) => (
          <li
            key={`${example.category}-${example.equation}`}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <span className="inline-flex rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  {formatChemistryBalanceExampleCategory(text, example.category)}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-strong)]">{example.title}</h3>
                  <NoTranslateText
                    as="p"
                    className="mt-1 break-words text-sm font-semibold text-[var(--accent-strong)]"
                  >
                    {example.equation}
                  </NoTranslateText>
                </div>
                <p className="text-sm leading-6 text-[var(--text-muted)]">{example.description}</p>
              </div>

              <Button
                variant="secondary"
                size="md"
                className="shrink-0"
                onClick={() => onSelect(example.equation)}
              >
                {text.examples.use}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export default ChemistryBalanceExamplesPanel;
