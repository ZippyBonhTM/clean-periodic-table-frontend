import { chemistryBalanceTextEn } from '@/components/templates/chemistryBalanceText.en';
import { chemistryBalanceTextPt } from '@/components/templates/chemistryBalanceText.pt';
import type { ChemistryBalanceExample } from '@/components/templates/chemistryBalanceExamples';
import type { BalanceChemicalEquationStage } from '@/shared/chemistry/analysis';
import type { BalancedReactionAnalysis } from '@/shared/chemistry/rules';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const CHEMISTRY_BALANCE_TEXT_BY_LOCALE = {
  'en-US': chemistryBalanceTextEn,
  'pt-BR': chemistryBalanceTextPt,
} as const;

type WidenChemistryBalanceTextLiterals<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<WidenChemistryBalanceTextLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenChemistryBalanceTextLiterals<T[Key]> }
        : T;

export type ChemistryBalanceTextCatalog = WidenChemistryBalanceTextLiterals<
  typeof chemistryBalanceTextEn
>;

type ChemistryBalanceMetadataStatus = keyof ChemistryBalanceTextCatalog['analysis']['metadata'];
type EquationBalanceHistoryStatus = 'balanced' | BalanceChemicalEquationStage;
type AlignmentStatus = 'aligned' | 'partial' | 'different';

export function getChemistryBalanceText(locale: AppLocale): ChemistryBalanceTextCatalog {
  return CHEMISTRY_BALANCE_TEXT_BY_LOCALE[locale];
}

export function formatChemistryBalanceReactionType(
  text: ChemistryBalanceTextCatalog,
  reactionType: BalancedReactionAnalysis['reactionType'],
): string {
  return text.common.reactionTypes[reactionType] ?? reactionType;
}

export function formatChemistryBalanceComparisonType(
  text: ChemistryBalanceTextCatalog,
  value: string | null,
): string {
  if (value === null || value.trim().length === 0) {
    return text.common.unknown;
  }

  const normalizedValue = value.trim().toLowerCase().replace(/[_\s]+/g, '-') as keyof ChemistryBalanceTextCatalog['common']['reactionTypes'];

  if (normalizedValue in text.common.reactionTypes) {
    return text.common.reactionTypes[normalizedValue];
  }

  return value
    .split(/[-_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatChemistryBalanceExampleCategory(
  text: ChemistryBalanceTextCatalog,
  category: ChemistryBalanceExample['category'],
): string {
  return text.examples.categories[category] ?? category;
}

export function getChemistryBalanceMetadataMessage(
  text: ChemistryBalanceTextCatalog,
  metadataStatus: ChemistryBalanceMetadataStatus,
): string {
  return text.analysis.metadata[metadataStatus];
}

export function formatChemistryBalanceHistoryStatus(
  text: ChemistryBalanceTextCatalog,
  status: EquationBalanceHistoryStatus,
): string {
  if (status === 'balanced') {
    return text.common.balanced;
  }

  return status;
}

export function formatChemistryBalanceHistoryDate(
  text: ChemistryBalanceTextCatalog,
  savedAt: string,
): string {
  const date = new Date(savedAt);

  if (Number.isNaN(date.getTime())) {
    return text.common.recent;
  }

  return new Intl.DateTimeFormat(text.history.locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatChemistryBalanceCoefficientDelta(
  text: ChemistryBalanceTextCatalog,
  inputCoefficient: number,
  balancedCoefficient: number,
): string {
  if (inputCoefficient === balancedCoefficient) {
    return text.common.unchanged;
  }

  return `${inputCoefficient} -> ${balancedCoefficient}`;
}

export function formatChemistryBalanceValidity(
  text: ChemistryBalanceTextCatalog,
  value: boolean | null,
): string {
  if (value === null) {
    return text.common.unknown;
  }

  return value ? text.common.yes : text.common.no;
}

export function formatChemistryBalanceScoreDelta(
  text: ChemistryBalanceTextCatalog,
  localScore: number,
  remoteScore: number | null,
): string {
  if (remoteScore === null) {
    return text.common.notAvailable;
  }

  return `${Math.abs(localScore - remoteScore)} pts`;
}

export function formatChemistryBalanceAlignment(
  text: ChemistryBalanceTextCatalog,
  status: AlignmentStatus,
): string {
  switch (status) {
    case 'aligned':
      return text.analysisComparison.aligned;
    case 'partial':
      return text.analysisComparison.partial;
    case 'different':
    default:
      return text.analysisComparison.different;
  }
}
