import { APP_LOCALE_SEGMENT_BY_LOCALE } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const ARTICLE_FEED_PATHNAME = '/articles';
const ARTICLE_PRIVATE_LIST_PATHNAME = '/me/articles';

function buildLocalizedArticleFeedPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ARTICLE_FEED_PATHNAME}`;
}

function buildLocalizedArticlePrivateListPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ARTICLE_PRIVATE_LIST_PATHNAME}`;
}

function buildLocalizedArticleDetailPath(locale: AppLocale, slug: string): string {
  const normalizedSlug = slug.trim().replace(/^\/+|\/+$/g, '');
  return `${buildLocalizedArticleFeedPath(locale)}/${encodeURIComponent(normalizedSlug)}`;
}

export {
  ARTICLE_FEED_PATHNAME,
  ARTICLE_PRIVATE_LIST_PATHNAME,
  buildLocalizedArticleDetailPath,
  buildLocalizedArticleFeedPath,
  buildLocalizedArticlePrivateListPath,
};
