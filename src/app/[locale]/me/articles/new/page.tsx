import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ArticleEditorWorkspace from '@/components/templates/ArticleEditorWorkspace';
import { getArticleEditorText } from '@/components/templates/articleEditorText';
import { resolveServerArticleStageAccessGate } from '@/shared/admin/serverAdminAccess';
import {
  getArticleFeatureStage,
  isArticleFeatureEnabled,
} from '@/shared/config/articleFeature';
import { buildLocalizedArticleEditorCreatePath } from '@/shared/articles/articleRouting';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildAbsoluteAppUrl } from '@/shared/seo/appSite';

type LocalizedArticleEditorCreatePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedArticleEditorCreatePageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  const text = getArticleEditorText(resolvedLocale);
  const canonicalUrl = buildAbsoluteAppUrl(buildLocalizedArticleEditorCreatePath(resolvedLocale));

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
}: LocalizedArticleEditorCreatePageProps) {
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
    notFound();
  }

  return (
    <ArticleEditorWorkspace
      locale={resolvedLocale}
      featureStage={featureStage}
    />
  );
}
