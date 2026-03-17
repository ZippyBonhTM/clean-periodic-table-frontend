'use client';

import Panel from '@/components/atoms/Panel';
import ChemistryBalanceAnalysisComparisonOverview from '@/components/templates/ChemistryBalanceAnalysisComparisonOverview';
import {
  chemistryBalanceText,
} from '@/components/templates/chemistryBalanceText';
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
  if (localAnalysis === null || remoteAnalysis.status !== 'available') {
    return (
      <Panel className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            {chemistryBalanceText.analysisComparison.eyebrow}
          </p>
          <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
            {chemistryBalanceText.analysisComparison.title}
          </h2>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          {chemistryBalanceText.analysisComparison.unavailable}
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
          {chemistryBalanceText.analysisComparison.eyebrow}
        </p>
        <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
          {chemistryBalanceText.analysisComparison.title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
          {chemistryBalanceText.analysisComparison.description}
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
          {chemistryBalanceText.analysisComparison.confidenceAlignmentLabel}
        </p>
        <p className="mt-1 text-base font-black text-[var(--text-strong)]">
          {formatAlignmentStatus(confidenceAlignment)}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          {buildConfidenceSentence(localAnalysis, remoteAnalysis)}
        </p>
      </div>
    </Panel>
  );
}

export default ChemistryBalanceAnalysisComparisonPanel;
