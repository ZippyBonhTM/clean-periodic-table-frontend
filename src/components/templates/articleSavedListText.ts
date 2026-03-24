import { articleSavedListTextEn } from '@/components/templates/articleSavedListText.en';
import { articleSavedListTextPt } from '@/components/templates/articleSavedListText.pt';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const ARTICLE_SAVED_LIST_TEXT_BY_LOCALE = {
  'en-US': articleSavedListTextEn,
  'pt-BR': articleSavedListTextPt,
} as const;

type WidenArticleSavedListTextLiterals<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<WidenArticleSavedListTextLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenArticleSavedListTextLiterals<T[Key]> }
        : T;

export type ArticleSavedListTextCatalog =
  WidenArticleSavedListTextLiterals<typeof articleSavedListTextEn>;

export function getArticleSavedListText(locale: AppLocale): ArticleSavedListTextCatalog {
  return ARTICLE_SAVED_LIST_TEXT_BY_LOCALE[locale];
}
