import {
  chemistryBalanceText,
  formatChemistryBalanceAlignment,
  formatChemistryBalanceScoreDelta,
  formatChemistryBalanceValidity,
} from '@/components/templates/chemistryBalanceText';
import type { ChemistryBalanceRemoteAnalysisState } from '@/components/templates/chemistryBalanceRemoteAnalysis.types';
import type { BalancedReactionAnalysis } from '@/shared/chemistry/rules';

export type AlignmentStatus = 'aligned' | 'partial' | 'different';

function normalizeComparisonLabel(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  return value.trim().toLowerCase().replace(/[_\s]+/g, '-');
}

export function resolveClassificationAlignment(
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

export function resolveConfidenceAlignment(
  localPlausible: boolean,
  remoteValid: boolean | null,
): AlignmentStatus {
  if (remoteValid === null) {
    return 'partial';
  }

  return localPlausible === remoteValid ? 'aligned' : 'different';
}

export function resolveAlignmentTone(status: AlignmentStatus): string {
  if (status === 'aligned') {
    return 'border-[rgba(16,185,129,0.45)] bg-[rgba(16,185,129,0.14)]';
  }

  if (status === 'partial') {
    return 'border-[rgba(96,165,250,0.35)] bg-[rgba(96,165,250,0.12)]';
  }

  return 'border-[rgba(245,158,11,0.45)] bg-[rgba(245,158,11,0.14)]';
}

export function buildConfidenceSentence(
  localAnalysis: BalancedReactionAnalysis,
  remoteAnalysis: Extract<ChemistryBalanceRemoteAnalysisState, { status: 'available' }>,
): string {
  const localConfidence = localAnalysis.likelyPlausible
    ? chemistryBalanceText.analysisComparison.positive
    : chemistryBalanceText.analysisComparison.cautious;

  const remoteValidity = formatChemistryBalanceValidity(remoteAnalysis.value.valid).toLowerCase();

  return `${chemistryBalanceText.analysisComparison.confidenceSentencePrefix} ${localConfidence} ${chemistryBalanceText.analysisComparison.confidenceSentenceMiddle} ${remoteValidity}.`;
}

export function buildClassificationDeltaLabel(
  localAnalysis: BalancedReactionAnalysis,
  remoteAnalysis: Extract<ChemistryBalanceRemoteAnalysisState, { status: 'available' }>,
): string {
  return `${chemistryBalanceText.analysisComparison.deltaPrefix} ${formatChemistryBalanceScoreDelta(
    localAnalysis.score,
    remoteAnalysis.value.score,
  )}`;
}

export function buildRemoteValidityLabel(
  remoteAnalysis: Extract<ChemistryBalanceRemoteAnalysisState, { status: 'available' }>,
): string {
  return `${chemistryBalanceText.analysisComparison.remoteValidPrefix} ${formatChemistryBalanceValidity(
    remoteAnalysis.value.valid,
  )}`;
}

export function formatAlignmentStatus(status: AlignmentStatus): string {
  return formatChemistryBalanceAlignment(status);
}
