import { articleDetailTextEn } from '@/components/templates/articleDetailText.en';
import { articleDetailTextPt } from '@/components/templates/articleDetailText.pt';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const ARTICLE_DETAIL_TEXT_BY_LOCALE = {
  'en-US': articleDetailTextEn,
  'pt-BR': articleDetailTextPt,
} as const;

type WidenArticleDetailTextLiterals<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<WidenArticleDetailTextLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenArticleDetailTextLiterals<T[Key]> }
        : T;

export type ArticleDetailTextCatalog = WidenArticleDetailTextLiterals<typeof articleDetailTextEn>;

export function getArticleDetailText(locale: AppLocale): ArticleDetailTextCatalog {
  return ARTICLE_DETAIL_TEXT_BY_LOCALE[locale];
}

