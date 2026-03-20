import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ArticleEditorWorkspace from '@/components/templates/ArticleEditorWorkspace';
import { getArticleEditorText } from '@/components/templates/articleEditorText';
import {
  getArticleFeatureStage,
  isArticleFeatureEnabled,
} from '@/shared/config/articleFeature';
import { buildLocalizedArticleEditorPath } from '@/shared/articles/articleRouting';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildAbsoluteAppUrl } from '@/shared/seo/appSite';

type LocalizedArticleEditorPageProps = {
  params: Promise<{
    locale: string;
    articleId: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedArticleEditorPageProps): Promise<Metadata> {
  const { locale, articleId } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  const text = getArticleEditorText(resolvedLocale);
  const canonicalUrl = buildAbsoluteAppUrl(
    buildLocalizedArticleEditorPath(resolvedLocale, articleId),
  );

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

export default async function Page({
  params,
}: LocalizedArticleEditorPageProps) {
  const { locale, articleId } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    notFound();
  }

  const normalizedArticleId = articleId.trim();

  if (normalizedArticleId.length === 0) {
    notFound();
  }

  const featureStage = getArticleFeatureStage();

  if (!isArticleFeatureEnabled(featureStage)) {
    notFound();
  }

  return (
    <ArticleEditorWorkspace
      locale={resolvedLocale}
      featureStage={featureStage}
      articleId={normalizedArticleId}
    />
  );
}
