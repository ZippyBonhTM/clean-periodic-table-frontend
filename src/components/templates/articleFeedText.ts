import { articleFeedTextEn } from '@/components/templates/articleFeedText.en';
import { articleFeedTextPt } from '@/components/templates/articleFeedText.pt';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const ARTICLE_FEED_TEXT_BY_LOCALE = {
  'en-US': articleFeedTextEn,
  'pt-BR': articleFeedTextPt,
} as const;

type WidenArticleFeedTextLiterals<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<WidenArticleFeedTextLiterals<Item>>
      : T extends object
        ? { [Key in keyof T]: WidenArticleFeedTextLiterals<T[Key]> }
        : T;

export type ArticleFeedTextCatalog = WidenArticleFeedTextLiterals<typeof articleFeedTextEn>;

export function getArticleFeedText(locale: AppLocale): ArticleFeedTextCatalog {
  return ARTICLE_FEED_TEXT_BY_LOCALE[locale];
}
