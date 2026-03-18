import { appFooterTextEn } from '@/components/shared/footer/appFooterText.en';
import { appFooterTextPt } from '@/components/shared/footer/appFooterText.pt';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const APP_FOOTER_TEXT_BY_LOCALE = {
  'en-US': appFooterTextEn,
  'pt-BR': appFooterTextPt,
} as const;

type WidenAppFooterTextLiterals<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<WidenAppFooterTextLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenAppFooterTextLiterals<T[Key]> }
        : T;

export type AppFooterTextCatalog = WidenAppFooterTextLiterals<typeof appFooterTextEn>;

export function getAppFooterText(locale: AppLocale): AppFooterTextCatalog {
  return APP_FOOTER_TEXT_BY_LOCALE[locale];
}
