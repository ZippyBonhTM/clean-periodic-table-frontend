import { APP_LOCALE_SEGMENT_BY_LOCALE } from '@/shared/i18n/appLocaleRouting';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import { buildArticleFeedBrowseSearchParams } from '@/shared/articles/articleFeedFilters';
import { buildArticlePrivateListSearchParams } from '@/shared/articles/articlePrivateListFilters';

const ARTICLE_FEED_PATHNAME = '/articles';
const ARTICLE_PRIVATE_LIST_PATHNAME = '/me/articles';
const ARTICLE_EDITOR_CREATE_PATHNAME = '/me/articles/new';

function buildLocalizedArticleFeedPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ARTICLE_FEED_PATHNAME}`;
}

function buildLocalizedArticleFeedBrowsePath(
  locale: AppLocale,
  input: {
    query?: string | null;
    hashtag?: string | null;
  } = {},
): string {
  const basePath = buildLocalizedArticleFeedPath(locale);
  const searchParams = buildArticleFeedBrowseSearchParams(input);
  const search = searchParams.toString();

  return search.length > 0 ? `${basePath}?${search}` : basePath;
}

function buildLocalizedArticlePrivateListPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ARTICLE_PRIVATE_LIST_PATHNAME}`;
}

function buildLocalizedArticlePrivateListBrowsePath(
  locale: AppLocale,
  input: {
    status?: 'all' | 'draft' | 'published' | 'archived' | null;
    query?: string | null;
  } = {},
): string {
  const basePath = buildLocalizedArticlePrivateListPath(locale);
  const searchParams = buildArticlePrivateListSearchParams(input);
  const search = searchParams.toString();

  return search.length > 0 ? `${basePath}?${search}` : basePath;
}

function buildLocalizedArticleEditorCreatePath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${ARTICLE_EDITOR_CREATE_PATHNAME}`;
}

function buildLocalizedArticleEditorPath(locale: AppLocale, articleId: string): string {
  const normalizedArticleId = articleId.trim().replace(/^\/+|\/+$/g, '');
  return `${buildLocalizedArticlePrivateListPath(locale)}/${encodeURIComponent(normalizedArticleId)}`;
}

function buildLocalizedArticleDetailPath(locale: AppLocale, slug: string): string {
  const normalizedSlug = slug.trim().replace(/^\/+|\/+$/g, '');
  return `${buildLocalizedArticleFeedPath(locale)}/${encodeURIComponent(normalizedSlug)}`;
}

export {
  ARTICLE_EDITOR_CREATE_PATHNAME,
  ARTICLE_FEED_PATHNAME,
  ARTICLE_PRIVATE_LIST_PATHNAME,
  buildLocalizedArticleDetailPath,
  buildLocalizedArticleEditorCreatePath,
  buildLocalizedArticleEditorPath,
  buildLocalizedArticleFeedBrowsePath,
  buildLocalizedArticleFeedPath,
  buildLocalizedArticlePrivateListBrowsePath,
  buildLocalizedArticlePrivateListPath,
};
