'use client';

import {
  formatChemistryBalanceComparisonType,
} from '@/components/templates/chemistryBalanceText';
import type { ChemistryBalanceRemoteAnalysisState } from '@/components/templates/chemistryBalanceRemoteAnalysis.types';
import type { BalancedReactionAnalysis } from '@/shared/chemistry/rules';
import useChemistryBalanceText from '@/components/templates/useChemistryBalanceText';
import {
  type AlignmentStatus,
  buildClassificationDeltaLabel,
  buildRemoteValidityLabel,
  formatAlignmentStatus,
  resolveAlignmentTone,
} from '@/components/templates/chemistryBalanceAnalysisComparison.utils';

type ChemistryBalanceAnalysisComparisonOverviewProps = {
  localAnalysis: BalancedReactionAnalysis;
  remoteAnalysis: Extract<ChemistryBalanceRemoteAnalysisState, { status: 'available' }>;
  classificationAlignment: AlignmentStatus;
};

function ChemistryBalanceAnalysisComparisonOverview({
  localAnalysis,
  remoteAnalysis,
  classificationAlignment,
}: ChemistryBalanceAnalysisComparisonOverviewProps) {
  const { text } = useChemistryBalanceText();

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {text.analysisComparison.localLabel}
        </p>
        <p className="mt-1 text-base font-black text-[var(--text-strong)]">
          {formatChemistryBalanceComparisonType(text, localAnalysis.reactionType)}
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {text.analysis.scoreLabel} {localAnalysis.score}/100
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          {text.analysisComparison.plausibleLabel}:{' '}
          {localAnalysis.likelyPlausible
            ? text.common.yes
            : text.analysis.needsReview}
        </p>
      </div>

      <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {text.analysisComparison.remoteLabel}
        </p>
        <p className="mt-1 text-base font-black text-[var(--text-strong)]">
          {formatChemistryBalanceComparisonType(text, remoteAnalysis.value.classification)}
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {text.analysis.scoreLabel} {remoteAnalysis.value.score ?? text.common.notAvailable}
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          {buildRemoteValidityLabel(text, remoteAnalysis)}
        </p>
      </div>

      <div
        className={`rounded-2xl border px-4 py-3 ${resolveAlignmentTone(classificationAlignment)}`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {text.analysisComparison.classificationLabel}
        </p>
        <p className="mt-1 text-base font-black text-[var(--text-strong)]">
          {formatAlignmentStatus(text, classificationAlignment)}
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {buildClassificationDeltaLabel(text, localAnalysis, remoteAnalysis)}
        </p>
      </div>
    </div>
  );
}

export default ChemistryBalanceAnalysisComparisonOverview;
