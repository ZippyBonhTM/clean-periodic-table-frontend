import type { ChemistryBalanceExample } from '@/components/templates/chemistryBalanceExamples';
import type { BalanceChemicalEquationStage } from '@/shared/chemistry/analysis';
import type { BalancedReactionAnalysis } from '@/shared/chemistry/rules';

export const chemistryBalanceText = {
  common: {
    yes: 'Yes',
    no: 'No',
    unknown: 'Unknown',
    notAvailable: 'N/A',
    balanced: 'Balanced',
    recent: 'Recent',
    unchanged: 'unchanged',
  },
  workspace: {
    eyebrow: 'Client-First Chemistry',
    title: 'Balance Equation',
    description:
      'This page uses the local chemistry pipeline only: equation parsing, reaction creation, matrix balancing, and deterministic formatting.',
    equationLabel: 'Equation',
    equationPlaceholder: 'H2 + O2 -> H2O',
    submit: 'Balance locally',
    clear: 'Clear',
    resultEyebrow: 'Result',
    resultTitle: 'Balanced Output',
    formattedLabel: 'Formatted',
    termsLabel: 'Terms',
    elementsLabel: 'Elements',
    vectorLabel: 'Vector',
    failurePrefix: 'The equation could not be balanced at the local',
    failureSuffix: 'stage.',
  },
  comparison: {
    eyebrow: 'Comparison',
    title: 'Input vs Balanced',
    unavailable:
      'This panel becomes available after the equation balances successfully.',
    originalLabel: 'Original',
    balancedLabel: 'Balanced',
    reactantLabel: 'reactant',
    productLabel: 'product',
  },
  analysis: {
    eyebrow: 'Heuristics',
    title: 'Reaction Analysis',
    noResult:
      'Heuristic analysis runs after the equation is parsed and balanced successfully.',
    typeLabel: 'Type',
    scoreLabel: 'Score',
    plausibilityLabel: 'Plausibility',
    plausible: 'Likely plausible',
    needsReview: 'Needs review',
    noNotices: 'No heuristic notices were raised for this balanced reaction.',
    metadata: {
      loading: 'Loading Element DB metadata to enrich heuristics.',
      ready: 'Heuristics are enriched with Element DB metadata.',
      unavailable: 'Element DB metadata is unavailable right now. Using local heuristics only.',
      inactive: 'Local heuristics are active. Login enables Element DB enrichment when available.',
    },
  },
  engine: {
    eyebrow: 'Optional Engine',
    title: 'Remote Enrichment',
    description:
      'Local balance and heuristics stay primary. This optional step asks the backend Chemical Engine for extra validation when enabled.',
    toggleLabel: 'Remote',
    retry: 'Retry remote check',
    off:
      'Remote enrichment is currently off. The page is using client-only chemistry.',
    idle:
      'Remote enrichment will run the next time a balanced equation is submitted.',
    loadingPrefix: 'Asking the optional Chemical Engine to enrich',
    failedTitle: 'Remote enrichment did not complete.',
    classificationLabel: 'Classification',
    scoreLabel: 'Score',
    validLabel: 'Valid',
    noNotices:
      'The optional Chemical Engine returned no additional notices for this equation.',
  },
  analysisComparison: {
    eyebrow: 'Comparison',
    title: 'Local vs Remote',
    unavailable:
      'This comparison becomes available when the local analysis succeeds and remote enrichment returns a result.',
    description:
      'This panel helps us compare the client-first heuristic reading with the optional Chemical Engine enrichment.',
    localLabel: 'Local',
    remoteLabel: 'Remote',
    plausibleLabel: 'Plausible',
    classificationLabel: 'Classification',
    confidenceAlignmentLabel: 'Confidence Alignment',
    aligned: 'Aligned',
    partial: 'Partial',
    different: 'Different',
    deltaPrefix: 'Delta:',
    remoteValidPrefix: 'Valid:',
    confidenceSentencePrefix: 'Local plausibility is',
    confidenceSentenceMiddle: 'while the remote engine validity is',
    positive: 'positive',
    cautious: 'cautious',
  },
  history: {
    eyebrow: 'History',
    title: 'Recent Equations',
    clear: 'Clear history',
    empty:
      'Recent equations will appear here after you balance them locally.',
    localFailureSummary: 'The equation could not be balanced locally.',
    locale: 'en-US',
  },
  examples: {
    eyebrow: 'Guided Examples',
    title: 'Try a Category',
    description:
      'These examples are grouped by common reaction patterns so we can inspect the local solver and heuristics from different angles.',
    use: 'Use',
    categories: {
      combustion: 'Combustion',
      synthesis: 'Synthesis',
      decomposition: 'Decomposition',
      ionic: 'Ionic',
    },
  },
  pipeline: {
    eyebrow: 'Pipeline',
    title: 'Local Stages',
    steps: [
      {
        title: '1. Equation parse',
        description:
          'separates arrow, terms, coefficients, phases, and structural notation.',
      },
      {
        title: '2. Reaction creation',
        description: 'converts terms into structured participants with parsed formulas.',
      },
      {
        title: '3. Matrix balancing',
        description:
          'builds the stoichiometric matrix, solves the null-space, and normalizes coefficients.',
      },
      {
        title: '4. Heuristic analysis',
        description:
          'applies lightweight local rules and optionally enriches them with Element DB metadata.',
      },
      {
        title: '5. Deterministic formatting',
        description: 'returns a stable text result for display.',
      },
    ],
  },
} as const;

type ChemistryBalanceMetadataStatus = keyof typeof chemistryBalanceText.analysis.metadata;
type EquationBalanceHistoryStatus = 'balanced' | BalanceChemicalEquationStage;

type AlignmentStatus = 'aligned' | 'partial' | 'different';

export function formatChemistryBalanceReactionType(
  reactionType: BalancedReactionAnalysis['reactionType'],
): string {
  return reactionType
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatChemistryBalanceComparisonType(value: string | null): string {
  if (value === null || value.trim().length === 0) {
    return chemistryBalanceText.common.unknown;
  }

  return value
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatChemistryBalanceExampleCategory(
  category: ChemistryBalanceExample['category'],
): string {
  return chemistryBalanceText.examples.categories[category] ?? category;
}

export function getChemistryBalanceMetadataMessage(
  metadataStatus: ChemistryBalanceMetadataStatus,
): string {
  return chemistryBalanceText.analysis.metadata[metadataStatus];
}

export function formatChemistryBalanceHistoryStatus(
  status: EquationBalanceHistoryStatus,
): string {
  if (status === 'balanced') {
    return chemistryBalanceText.common.balanced;
  }

  return status;
}

export function formatChemistryBalanceHistoryDate(savedAt: string): string {
  const date = new Date(savedAt);

  if (Number.isNaN(date.getTime())) {
    return chemistryBalanceText.common.recent;
  }

  return new Intl.DateTimeFormat(chemistryBalanceText.history.locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatChemistryBalanceCoefficientDelta(
  inputCoefficient: number,
  balancedCoefficient: number,
): string {
  if (inputCoefficient === balancedCoefficient) {
    return chemistryBalanceText.common.unchanged;
  }

  return `${inputCoefficient} -> ${balancedCoefficient}`;
}

export function formatChemistryBalanceValidity(value: boolean | null): string {
  if (value === null) {
    return chemistryBalanceText.common.unknown;
  }

  return value ? chemistryBalanceText.common.yes : chemistryBalanceText.common.no;
}

export function formatChemistryBalanceScoreDelta(
  localScore: number,
  remoteScore: number | null,
): string {
  if (remoteScore === null) {
    return chemistryBalanceText.common.notAvailable;
  }

  return `${Math.abs(localScore - remoteScore)} pts`;
}

export function formatChemistryBalanceAlignment(status: AlignmentStatus): string {
  switch (status) {
    case 'aligned':
      return chemistryBalanceText.analysisComparison.aligned;
    case 'partial':
      return chemistryBalanceText.analysisComparison.partial;
    case 'different':
    default:
      return chemistryBalanceText.analysisComparison.different;
  }
}
