import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ArticlePrivateListWorkspace from '@/components/templates/ArticlePrivateListWorkspace';
import { getArticlePrivateListText } from '@/components/templates/articlePrivateListText';
import {
  getArticleFeatureStage,
  isArticleFeatureEnabled,
} from '@/shared/config/articleFeature';
import { buildLocalizedArticlePrivateListPath } from '@/shared/articles/articleRouting';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildAbsoluteAppUrl } from '@/shared/seo/appSite';

type LocalizedArticlePrivateListPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedArticlePrivateListPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  const text = getArticlePrivateListText(resolvedLocale);
  const canonicalUrl = buildAbsoluteAppUrl(buildLocalizedArticlePrivateListPath(resolvedLocale));

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

export default async function LocalizedArticlePrivateListPage({
  params,
}: LocalizedArticlePrivateListPageProps) {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    notFound();
  }

  const featureStage = getArticleFeatureStage();

  if (!isArticleFeatureEnabled(featureStage)) {
    notFound();
  }

  return (
    <ArticlePrivateListWorkspace
      locale={resolvedLocale}
      featureStage={featureStage}
    />
  );
}

