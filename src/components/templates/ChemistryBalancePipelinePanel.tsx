'use client';

import Panel from '@/components/atoms/Panel';
import useChemistryBalanceText from '@/components/templates/useChemistryBalanceText';

function ChemistryBalancePipelinePanel() {
  const { text } = useChemistryBalanceText();

  return (
    <Panel className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {text.pipeline.eyebrow}
        </p>
        <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
          {text.pipeline.title}
        </h2>
      </div>
      <ol className="space-y-3 text-sm leading-6 text-[var(--text-muted)]">
        {text.pipeline.steps.map((step) => (
          <li
            key={step.title}
            className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3"
          >
            <span className="font-semibold text-[var(--text-strong)]">{step.title}</span>
            : {step.description}
          </li>
        ))}
      </ol>
    </Panel>
  );
}

export default ChemistryBalancePipelinePanel;
