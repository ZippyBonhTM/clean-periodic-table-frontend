import { notFoundTextEn } from '@/components/templates/notFoundText.en';
import { notFoundTextPt } from '@/components/templates/notFoundText.pt';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

type WidenNotFoundTextLiterals<T> =
  T extends string
    ? string
    : T extends ReadonlyArray<infer Item>
      ? ReadonlyArray<WidenNotFoundTextLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenNotFoundTextLiterals<T[Key]> }
        : T;

export type NotFoundTextCatalog = WidenNotFoundTextLiterals<typeof notFoundTextEn>;

export function getNotFoundText(locale: AppLocale): NotFoundTextCatalog {
  return locale === 'pt-BR' ? notFoundTextPt : notFoundTextEn;
}
