import { tokenStatusTextEn } from '@/components/molecules/tokenStatusText.en';
import { tokenStatusTextPt } from '@/components/molecules/tokenStatusText.pt';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const TOKEN_STATUS_TEXT_BY_LOCALE = {
  'en-US': tokenStatusTextEn,
  'pt-BR': tokenStatusTextPt,
} as const;

type WidenTokenStatusLiterals<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<WidenTokenStatusLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenTokenStatusLiterals<T[Key]> }
        : T;

export type TokenStatusTextCatalog = WidenTokenStatusLiterals<typeof tokenStatusTextEn>;

export function getTokenStatusText(locale: AppLocale): TokenStatusTextCatalog {
  return TOKEN_STATUS_TEXT_BY_LOCALE[locale];
}
