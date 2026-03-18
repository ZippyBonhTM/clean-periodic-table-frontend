import { periodicTableTextEn } from '@/components/organisms/periodic-table/periodicTableText.en';
import { periodicTableTextPt } from '@/components/organisms/periodic-table/periodicTableText.pt';
import type {
  PeriodicViewMode,
  SortMode,
} from '@/components/organisms/periodic-table/periodicTable.types';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import { resolveElementCategoryKey } from '@/shared/utils/elementPresentation';

const PERIODIC_TABLE_TEXT_BY_LOCALE = {
  'en-US': periodicTableTextEn,
  'pt-BR': periodicTableTextPt,
} as const;

type WidenPeriodicTableTextLiterals<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<WidenPeriodicTableTextLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenPeriodicTableTextLiterals<T[Key]> }
        : T;

export type PeriodicTableTextCatalog = WidenPeriodicTableTextLiterals<
  typeof periodicTableTextEn
>;

export function getPeriodicTableText(locale: AppLocale): PeriodicTableTextCatalog {
  return PERIODIC_TABLE_TEXT_BY_LOCALE[locale];
}

export function getPeriodicViewLabel(
  text: PeriodicTableTextCatalog,
  mode: PeriodicViewMode,
): string {
  return text.viewOptions[mode];
}

export function getPeriodicSortLabel(
  text: PeriodicTableTextCatalog,
  mode: SortMode,
): string {
  return text.sortOptions[mode];
}

export function formatPeriodicElementsSummary(
  text: PeriodicTableTextCatalog,
  visibleElementsCount: number,
  totalElements: number,
): string {
  return `${text.common.showingCountPrefix} ${visibleElementsCount} ${text.common.showingCountMiddle} ${totalElements} ${text.common.showingCountSuffix}.`;
}

export function formatElementImageUnavailableMessage(
  text: PeriodicTableTextCatalog,
  elementName: string,
): string {
  return `${text.details.viewer.elementImage}: ${elementName}. ${text.details.fields.notInformed}.`;
}

export function formatElementImageAlt(
  text: PeriodicTableTextCatalog,
  elementName: string,
): string {
  return `${text.details.viewer.elementImage} - ${elementName}`;
}

export function formatBohrImageAlt(
  text: PeriodicTableTextCatalog,
  elementName: string,
): string {
  return `${text.details.viewer.bohr} - ${elementName}`;
}

export function formatElementModalTitle(
  text: PeriodicTableTextCatalog,
  elementName: string,
  elementSymbol: string,
): string {
  return `${elementName} (${elementSymbol})`;
}

export function formatElementTileOpenLabel(
  text: PeriodicTableTextCatalog,
  elementName: string,
): string {
  return `${text.tile.openDetailsPrefix} ${elementName}`;
}

export function formatElementCategoryLabel(
  text: PeriodicTableTextCatalog,
  category: string | null | undefined,
  fallbackText = text.details.fields.notInformed,
): string {
  if (typeof category !== 'string' || category.trim().length === 0) {
    return fallbackText;
  }

  return text.taxonomy.categories[resolveElementCategoryKey(category)];
}

export function formatElementPhaseLabel(
  text: PeriodicTableTextCatalog,
  phase: string | null | undefined,
  fallbackText = text.details.fields.notInformed,
): string {
  if (typeof phase !== 'string' || phase.trim().length === 0) {
    return fallbackText;
  }

  const normalizedPhase = phase.trim().toLowerCase();

  if (normalizedPhase.includes('solid')) {
    return text.tile.phase.solid;
  }

  if (normalizedPhase.includes('liquid')) {
    return text.tile.phase.liquid;
  }

  if (normalizedPhase.includes('gas')) {
    return text.tile.phase.gas;
  }

  return phase.trim();
}
