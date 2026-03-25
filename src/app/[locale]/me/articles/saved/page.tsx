import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ArticleAccessRecoveryWorkspace from '@/components/templates/ArticleAccessRecoveryWorkspace';
import ArticleSavedListWorkspace from '@/components/templates/ArticleSavedListWorkspace';
import { getArticleSavedListText } from '@/components/templates/articleSavedListText';
import { resolveServerArticleStageAccessGate } from '@/shared/admin/serverAdminAccess';
import {
  buildLocalizedArticleSavedListPath,
} from '@/shared/articles/articleRouting';
import {
  getArticleFeatureStage,
  isArticleFeatureEnabled,
} from '@/shared/config/articleFeature';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildAbsoluteAppUrl } from '@/shared/seo/appSite';

type LocalizedArticleSavedListPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedArticleSavedListPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  const text = getArticleSavedListText(resolvedLocale);
  const canonicalUrl = buildAbsoluteAppUrl(buildLocalizedArticleSavedListPath(resolvedLocale));

  return {
    title: `${text.title} | Clean Periodic Table`,
    description: text.description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function LocalizedArticleSavedListPage({
  params,
}: LocalizedArticleSavedListPageProps) {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    notFound();
  }

  const featureStage = getArticleFeatureStage();

  if (!isArticleFeatureEnabled(featureStage)) {
    notFound();
  }

  const articleAccess = await resolveServerArticleStageAccessGate(featureStage);

  if (articleAccess === null) {
    notFound();
  }

  if (articleAccess.resolution === 'recoverable') {
    return <ArticleAccessRecoveryWorkspace locale={resolvedLocale} />;
  }

  return <ArticleSavedListWorkspace locale={resolvedLocale} featureStage={featureStage} />;
}
