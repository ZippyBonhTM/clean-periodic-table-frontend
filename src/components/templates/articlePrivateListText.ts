import { articlePrivateListTextEn } from '@/components/templates/articlePrivateListText.en';
import { articlePrivateListTextPt } from '@/components/templates/articlePrivateListText.pt';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const ARTICLE_PRIVATE_LIST_TEXT_BY_LOCALE = {
  'en-US': articlePrivateListTextEn,
  'pt-BR': articlePrivateListTextPt,
} as const;

type WidenArticlePrivateListTextLiterals<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<WidenArticlePrivateListTextLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenArticlePrivateListTextLiterals<T[Key]> }
        : T;

export type ArticlePrivateListTextCatalog =
  WidenArticlePrivateListTextLiterals<typeof articlePrivateListTextEn>;

export function getArticlePrivateListText(locale: AppLocale): ArticlePrivateListTextCatalog {
  return ARTICLE_PRIVATE_LIST_TEXT_BY_LOCALE[locale];
}

