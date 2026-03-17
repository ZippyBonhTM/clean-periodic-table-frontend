'use client';

import Panel from '@/components/atoms/Panel';
import { chemistryBalanceText } from '@/components/templates/chemistryBalanceText';

function ChemistryBalancePipelinePanel() {
  return (
    <Panel className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {chemistryBalanceText.pipeline.eyebrow}
        </p>
        <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
          {chemistryBalanceText.pipeline.title}
        </h2>
      </div>
      <ol className="space-y-3 text-sm leading-6 text-[var(--text-muted)]">
        {chemistryBalanceText.pipeline.steps.map((step) => (
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
