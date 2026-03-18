import { authTextEn } from '@/components/organisms/auth/authText.en';
import { authTextPt } from '@/components/organisms/auth/authText.pt';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const AUTH_TEXT_BY_LOCALE = {
  'en-US': authTextEn,
  'pt-BR': authTextPt,
} as const;

type WidenAuthTextLiterals<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<WidenAuthTextLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenAuthTextLiterals<T[Key]> }
        : T;

export type AuthTextCatalog = WidenAuthTextLiterals<typeof authTextEn>;

export function getAuthText(locale: AppLocale): AuthTextCatalog {
  return AUTH_TEXT_BY_LOCALE[locale];
}
