'use client';

import Panel from '@/components/atoms/Panel';
import ChemistryBalanceAnalysisComparisonOverview from '@/components/templates/ChemistryBalanceAnalysisComparisonOverview';
import useChemistryBalanceText from '@/components/templates/useChemistryBalanceText';
import type { ChemistryBalanceRemoteAnalysisState } from '@/components/templates/chemistryBalanceRemoteAnalysis.types';
import type { BalancedReactionAnalysis } from '@/shared/chemistry/rules';
import {
  buildConfidenceSentence,
  formatAlignmentStatus,
  resolveAlignmentTone,
  resolveClassificationAlignment,
  resolveConfidenceAlignment,
} from '@/components/templates/chemistryBalanceAnalysisComparison.utils';

type ChemistryBalanceAnalysisComparisonPanelProps = {
  localAnalysis: BalancedReactionAnalysis | null;
  remoteAnalysis: ChemistryBalanceRemoteAnalysisState;
};

function ChemistryBalanceAnalysisComparisonPanel({
  localAnalysis,
  remoteAnalysis,
}: ChemistryBalanceAnalysisComparisonPanelProps) {
  const { text } = useChemistryBalanceText();

  if (localAnalysis === null || remoteAnalysis.status !== 'available') {
    return (
      <Panel className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {text.analysisComparison.eyebrow}
          </p>
          <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
            {text.analysisComparison.title}
          </h2>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          {text.analysisComparison.unavailable}
        </div>
      </Panel>
    );
  }

  const classificationAlignment = resolveClassificationAlignment(
    localAnalysis.reactionType,
    remoteAnalysis.value.classification,
  );
  const confidenceAlignment = resolveConfidenceAlignment(
    localAnalysis.likelyPlausible,
    remoteAnalysis.value.valid,
  );

  return (
    <Panel className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {text.analysisComparison.eyebrow}
        </p>
        <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
          {text.analysisComparison.title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
          {text.analysisComparison.description}
        </p>
      </div>

      <ChemistryBalanceAnalysisComparisonOverview
        localAnalysis={localAnalysis}
        remoteAnalysis={remoteAnalysis}
        classificationAlignment={classificationAlignment}
      />

      <div
        className={`rounded-2xl border px-4 py-4 ${resolveAlignmentTone(confidenceAlignment)}`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {text.analysisComparison.confidenceAlignmentLabel}
        </p>
        <p className="mt-1 text-base font-black text-[var(--text-strong)]">
          {formatAlignmentStatus(text, confidenceAlignment)}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          {buildConfidenceSentence(text, localAnalysis, remoteAnalysis)}
        </p>
      </div>
    </Panel>
  );
}

export default ChemistryBalanceAnalysisComparisonPanel;
