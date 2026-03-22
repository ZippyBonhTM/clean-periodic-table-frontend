import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ArticleFeedWorkspace from '@/components/templates/ArticleFeedWorkspace';
import { getArticleFeedText } from '@/components/templates/articleFeedText';
import { listPublicArticleFeedServer } from '@/shared/api/articleServerApi';
import { requireAdminForInternalArticleStage } from '@/shared/admin/serverAdminAccess';
import { resolveArticleFeedBrowseFilters } from '@/shared/articles/articleFeedFilters';
import {
  getArticleFeatureStage,
  isArticleFeatureEnabled,
  isArticleFeaturePublic,
} from '@/shared/config/articleFeature';
import { buildLocalizedArticleFeedPath } from '@/shared/articles/articleRouting';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildAbsoluteAppUrl } from '@/shared/seo/appSite';

type LocalizedArticleFeedPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string | string[];
    tag?: string | string[];
  }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: LocalizedArticleFeedPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedFilters = resolveArticleFeedBrowseFilters(await searchParams);
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  const text = getArticleFeedText(resolvedLocale);
  const featureStage = getArticleFeatureStage();
  const localizedPath = buildLocalizedArticleFeedPath(resolvedLocale);
  const canonicalUrl = buildAbsoluteAppUrl(localizedPath);
  const isPublic = isArticleFeaturePublic(featureStage);
  const isIndexable = isPublic && resolvedFilters.mode === 'feed';
  const title =
    resolvedFilters.mode === 'search'
      ? `${text.filters.searchingFor}: ${resolvedFilters.query} | Clean Periodic Table`
      : resolvedFilters.mode === 'hashtag'
        ? `${text.filters.hashtag}: #${resolvedFilters.hashtag} | Clean Periodic Table`
        : `${text.title} | Clean Periodic Table`;

  return {
    title,
    description: text.description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: buildAbsoluteAppUrl(buildLocalizedArticleFeedPath('en-US')),
        pt: buildAbsoluteAppUrl(buildLocalizedArticleFeedPath('pt-BR')),
      },
    },
    robots: isIndexable
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: false,
    },
    openGraph: {
      title,
      description: text.description,
      siteName: 'Clean Periodic Table',
      locale: resolvedLocale,
      type: 'website',
      url: canonicalUrl,
    },
  };
}

export default async function LocalizedArticleFeedPage({
  params,
  searchParams,
}: LocalizedArticleFeedPageProps) {
  const { locale } = await params;
  const resolvedFilters = resolveArticleFeedBrowseFilters(await searchParams);
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    notFound();
  }

  const featureStage = getArticleFeatureStage();

  if (!isArticleFeatureEnabled(featureStage)) {
    notFound();
  }

  await requireAdminForInternalArticleStage(featureStage);

  const { feed, isAvailable, errorMessage } = await listPublicArticleFeedServer({
    limit: 12,
    query: resolvedFilters.query,
    hashtag: resolvedFilters.hashtag,
  });

  return (
    <ArticleFeedWorkspace
      locale={resolvedLocale}
      featureStage={featureStage}
      initialFeed={feed}
      initialBrowseMode={resolvedFilters.mode}
      initialQuery={resolvedFilters.query}
      initialHashtag={resolvedFilters.hashtag}
      isFeedAvailable={isAvailable}
      initialErrorMessage={errorMessage}
    />
  );
}
