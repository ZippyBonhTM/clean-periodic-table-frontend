import { APP_LOCALE_SEGMENT_BY_LOCALE } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const ARTICLE_FEED_PATHNAME = '/articles';

function buildLocalizedArticleFeedPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ARTICLE_FEED_PATHNAME}`;
}

function buildLocalizedArticleDetailPath(locale: AppLocale, slug: string): string {
  const normalizedSlug = slug.trim().replace(/^\/+|\/+$/g, '');
  return `${buildLocalizedArticleFeedPath(locale)}/${encodeURIComponent(normalizedSlug)}`;
}

export {
  ARTICLE_FEED_PATHNAME,
  buildLocalizedArticleDetailPath,
  buildLocalizedArticleFeedPath,
};
