'use client';

import Panel from '@/components/atoms/Panel';
import type { ChemistryBalanceRemoteAnalysisState } from '@/components/templates/chemistryBalanceRemoteAnalysis.types';
import type { BalancedReactionAnalysis } from '@/shared/chemistry/rules';

type ChemistryBalanceAnalysisComparisonPanelProps = {
  localAnalysis: BalancedReactionAnalysis | null;
  remoteAnalysis: ChemistryBalanceRemoteAnalysisState;
};

type AlignmentStatus = 'aligned' | 'partial' | 'different';

function normalizeComparisonLabel(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  return value.trim().toLowerCase().replace(/[_\s]+/g, '-');
}

function formatTypeLabel(value: string | null): string {
  if (value === null || value.trim().length === 0) {
    return 'Unknown';
  }

  return value
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveClassificationAlignment(
  localType: BalancedReactionAnalysis['reactionType'],
  remoteClassification: string | null,
): AlignmentStatus {
  const normalizedLocal = normalizeComparisonLabel(localType);
  const normalizedRemote = normalizeComparisonLabel(remoteClassification);

  if (normalizedRemote === null || normalizedLocal === null || normalizedLocal === 'unknown') {
    return 'partial';
  }

  if (
    normalizedLocal === normalizedRemote ||
    normalizedLocal.includes(normalizedRemote) ||
    normalizedRemote.includes(normalizedLocal)
  ) {
    return 'aligned';
  }

  return 'different';
}

function resolveConfidenceAlignment(
  localPlausible: boolean,
  remoteValid: boolean | null,
): AlignmentStatus {
  if (remoteValid === null) {
    return 'partial';
  }

  return localPlausible === remoteValid ? 'aligned' : 'different';
}

function resolveAlignmentTone(status: AlignmentStatus): string {
  if (status === 'aligned') {
    return 'border-[rgba(16,185,129,0.45)] bg-[rgba(16,185,129,0.14)]';
  }

  if (status === 'partial') {
    return 'border-[rgba(96,165,250,0.35)] bg-[rgba(96,165,250,0.12)]';
  }

  return 'border-[rgba(245,158,11,0.45)] bg-[rgba(245,158,11,0.14)]';
}

function formatScoreDelta(
  localScore: number,
  remoteScore: number | null,
): string {
  if (remoteScore === null) {
    return 'N/A';
  }

  return `${Math.abs(localScore - remoteScore)} pts`;
}

function formatValidity(value: boolean | null): string {
  if (value === null) {
    return 'Unknown';
  }

  return value ? 'Yes' : 'No';
}

function formatAlignmentLabel(status: AlignmentStatus): string {
  switch (status) {
    case 'aligned':
      return 'Aligned';
    case 'partial':
      return 'Partial';
    case 'different':
    default:
      return 'Different';
  }
}

function ChemistryBalanceAnalysisComparisonPanel({
  localAnalysis,
  remoteAnalysis,
}: ChemistryBalanceAnalysisComparisonPanelProps) {
  if (localAnalysis === null || remoteAnalysis.status !== 'available') {
    return (
      <Panel className="space-y-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Comparison
          </p>
          <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
            Local vs Remote
          </h2>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-overlay-faint)] px-4 py-4 text-sm leading-6 text-[var(--text-muted)]">
          This comparison becomes available when the local analysis succeeds and remote enrichment
          returns a result.
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
          Comparison
        </p>
        <h2 className="text-lg font-black text-[var(--text-strong)] sm:text-xl">
          Local vs Remote
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
          This panel helps us compare the client-first heuristic reading with the optional Chemical
          Engine enrichment.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Local
          </p>
          <p className="mt-1 text-base font-black text-[var(--text-strong)]">
            {formatTypeLabel(localAnalysis.reactionType)}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Score {localAnalysis.score}/100
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Plausible: {localAnalysis.likelyPlausible ? 'Yes' : 'Needs review'}
          </p>
        </div>

        <div className="rounded-2xl bg-[var(--surface-overlay-faint)] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Remote
          </p>
          <p className="mt-1 text-base font-black text-[var(--text-strong)]">
            {formatTypeLabel(remoteAnalysis.value.classification)}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Score {remoteAnalysis.value.score ?? 'N/A'}
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Valid: {formatValidity(remoteAnalysis.value.valid)}
          </p>
        </div>

        <div
          className={`rounded-2xl border px-4 py-3 ${resolveAlignmentTone(classificationAlignment)}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
            Classification
          </p>
          <p className="mt-1 text-base font-black text-[var(--text-strong)]">
            {formatAlignmentLabel(classificationAlignment)}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Delta: {formatScoreDelta(localAnalysis.score, remoteAnalysis.value.score)}
          </p>
        </div>
      </div>

      <div
        className={`rounded-2xl border px-4 py-4 ${resolveAlignmentTone(confidenceAlignment)}`}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Confidence Alignment
        </p>
        <p className="mt-1 text-base font-black text-[var(--text-strong)]">
          {formatAlignmentLabel(confidenceAlignment)}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
          Local plausibility is{' '}
          <span className="font-semibold text-[var(--text-strong)]">
            {localAnalysis.likelyPlausible ? 'positive' : 'cautious'}
          </span>{' '}
          while the remote engine validity is{' '}
          <span className="font-semibold text-[var(--text-strong)]">
            {formatValidity(remoteAnalysis.value.valid).toLowerCase()}
          </span>
          .
        </p>
      </div>
    </Panel>
  );
}

export default ChemistryBalanceAnalysisComparisonPanel;
