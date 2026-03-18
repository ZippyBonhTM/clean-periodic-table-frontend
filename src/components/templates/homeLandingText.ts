import { homeLandingTextEn } from '@/components/templates/homeLandingText.en';
import { homeLandingTextPt } from '@/components/templates/homeLandingText.pt';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const HOME_LANDING_TEXT_BY_LOCALE = {
  'en-US': homeLandingTextEn,
  'pt-BR': homeLandingTextPt,
} as const;

type WidenHomeLandingTextLiterals<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<WidenHomeLandingTextLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenHomeLandingTextLiterals<T[Key]> }
        : T;

export type HomeLandingTextCatalog = WidenHomeLandingTextLiterals<typeof homeLandingTextEn>;

export function getHomeLandingText(locale: AppLocale): HomeLandingTextCatalog {
  return HOME_LANDING_TEXT_BY_LOCALE[locale];
}
