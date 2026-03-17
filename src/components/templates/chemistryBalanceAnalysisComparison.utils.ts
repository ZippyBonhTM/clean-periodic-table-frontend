import {
  formatChemistryBalanceAlignment,
  formatChemistryBalanceScoreDelta,
  formatChemistryBalanceValidity,
  type ChemistryBalanceTextCatalog,
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
  text: ChemistryBalanceTextCatalog,
  localAnalysis: BalancedReactionAnalysis,
  remoteAnalysis: Extract<ChemistryBalanceRemoteAnalysisState, { status: 'available' }>,
): string {
  const localConfidence = localAnalysis.likelyPlausible
    ? text.analysisComparison.positive
    : text.analysisComparison.cautious;

  const remoteValidity = formatChemistryBalanceValidity(text, remoteAnalysis.value.valid).toLowerCase();

  return `${text.analysisComparison.confidenceSentencePrefix} ${localConfidence} ${text.analysisComparison.confidenceSentenceMiddle} ${remoteValidity}.`;
}

export function buildClassificationDeltaLabel(
  text: ChemistryBalanceTextCatalog,
  localAnalysis: BalancedReactionAnalysis,
  remoteAnalysis: Extract<ChemistryBalanceRemoteAnalysisState, { status: 'available' }>,
): string {
  return `${text.analysisComparison.deltaPrefix} ${formatChemistryBalanceScoreDelta(
    text,
    localAnalysis.score,
    remoteAnalysis.value.score,
  )}`;
}

export function buildRemoteValidityLabel(
  text: ChemistryBalanceTextCatalog,
  remoteAnalysis: Extract<ChemistryBalanceRemoteAnalysisState, { status: 'available' }>,
): string {
  return `${text.analysisComparison.remoteValidPrefix} ${formatChemistryBalanceValidity(
    text,
    remoteAnalysis.value.valid,
  )}`;
}

export function formatAlignmentStatus(
  text: ChemistryBalanceTextCatalog,
  status: AlignmentStatus,
): string {
  return formatChemistryBalanceAlignment(text, status);
}
