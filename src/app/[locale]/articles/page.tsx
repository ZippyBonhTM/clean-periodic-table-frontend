import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ArticleFeedWorkspace from '@/components/templates/ArticleFeedWorkspace';
import { getArticleFeedText } from '@/components/templates/articleFeedText';
import { listPublicArticleFeedServer } from '@/shared/api/articleServerApi';
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
};

export async function generateMetadata({
  params,
}: LocalizedArticleFeedPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  const text = getArticleFeedText(resolvedLocale);
  const featureStage = getArticleFeatureStage();
  const localizedPath = buildLocalizedArticleFeedPath(resolvedLocale);
  const canonicalUrl = buildAbsoluteAppUrl(localizedPath);
  const isPublic = isArticleFeaturePublic(featureStage);

  return {
    title: `${text.title} | Clean Periodic Table`,
    description: text.description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: buildAbsoluteAppUrl(buildLocalizedArticleFeedPath('en-US')),
        pt: buildAbsoluteAppUrl(buildLocalizedArticleFeedPath('pt-BR')),
      },
    },
    robots: isPublic
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: false,
        },
    openGraph: {
      title: `${text.title} | Clean Periodic Table`,
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
}: LocalizedArticleFeedPageProps) {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    notFound();
  }

  const featureStage = getArticleFeatureStage();

  if (!isArticleFeatureEnabled(featureStage)) {
    notFound();
  }

  const { feed, isAvailable, errorMessage } = await listPublicArticleFeedServer({
    limit: 12,
  });

  return (
    <ArticleFeedWorkspace
      locale={resolvedLocale}
      featureStage={featureStage}
      initialFeed={feed}
      isFeedAvailable={isAvailable}
      initialErrorMessage={errorMessage}
    />
  );
}

