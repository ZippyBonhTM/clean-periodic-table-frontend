'use client';

import {
  chemistryBalanceText,
  formatChemistryBalanceComparisonType,
} from '@/components/templates/chemistryBalanceText';
import type { ChemistryBalanceRemoteAnalysisState } from '@/components/templates/chemistryBalanceRemoteAnalysis.types';
import type { BalancedReactionAnalysis } from '@/shared/chemistry/rules';
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
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {chemistryBalanceText.analysisComparison.localLabel}
        </p>
        <p className="mt-1 text-base font-black text-[var(--text-strong)]">
          {formatChemistryBalanceComparisonType(localAnalysis.reactionType)}
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Score {localAnalysis.score}/100</p>
        <p className="text-sm text-[var(--text-muted)]">
          {chemistryBalanceText.analysisComparison.plausibleLabel}:{' '}
          {localAnalysis.likelyPlausible
            ? chemistryBalanceText.common.yes
            : chemistryBalanceText.analysis.needsReview}
        </p>
      </div>

      <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {chemistryBalanceText.analysisComparison.remoteLabel}
        </p>
        <p className="mt-1 text-base font-black text-[var(--text-strong)]">
          {formatChemistryBalanceComparisonType(remoteAnalysis.value.classification)}
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Score {remoteAnalysis.value.score ?? chemistryBalanceText.common.notAvailable}
        </p>
        <p className="text-sm text-[var(--text-muted)]">{buildRemoteValidityLabel(remoteAnalysis)}</p>
      </div>

      <div
        className={`rounded-2xl border px-4 py-3 ${resolveAlignmentTone(classificationAlignment)}`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {chemistryBalanceText.analysisComparison.classificationLabel}
        </p>
        <p className="mt-1 text-base font-black text-[var(--text-strong)]">
          {formatAlignmentStatus(classificationAlignment)}
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {buildClassificationDeltaLabel(localAnalysis, remoteAnalysis)}
        </p>
      </div>
    </div>
  );
}

export default ChemistryBalanceAnalysisComparisonOverview;
