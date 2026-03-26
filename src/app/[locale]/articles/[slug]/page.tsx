import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ArticleDetailWorkspace from '@/components/templates/ArticleDetailWorkspace';
import { getArticleDetailText } from '@/components/templates/articleDetailText';
import { getPublicArticleBySlugServer } from '@/shared/api/articleServerApi';
import { resolveServerArticleStageAccessGate } from '@/shared/admin/serverAdminAccess';
import {
  getArticleFeatureStage,
  isArticleFeatureEnabled,
  isArticleFeaturePublic,
} from '@/shared/config/articleFeature';
import { buildLocalizedArticleDetailPath } from '@/shared/articles/articleRouting';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildAbsoluteAppUrl } from '@/shared/seo/appSite';

type LocalizedArticleDetailPageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedArticleDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  const featureStage = getArticleFeatureStage();
  const isFeatureEnabled = isArticleFeatureEnabled(featureStage);
  const text = getArticleDetailText(resolvedLocale);

  if (!isFeatureEnabled) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  if (!isArticleFeaturePublic(featureStage)) {
    return {
      title: `${text.unavailableTitle} | Clean Periodic Table`,
      description: text.unavailableDescription,
      alternates: {
        canonical: buildAbsoluteAppUrl(buildLocalizedArticleDetailPath(resolvedLocale, slug)),
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const result = await getPublicArticleBySlugServer({ slug });
  const canonicalUrl = buildAbsoluteAppUrl(buildLocalizedArticleDetailPath(resolvedLocale, slug));
  const isIndexable =
    result.state === 'available' &&
    isArticleFeaturePublic(featureStage) &&
    result.article.status === 'published' &&
    result.article.visibility === 'public';

  if (result.state !== 'available') {
    return {
      title: `${text.unavailableTitle} | Clean Periodic Table`,
      description: text.unavailableDescription,
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${result.article.title} | Clean Periodic Table`,
    description: result.article.excerpt,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: buildAbsoluteAppUrl(buildLocalizedArticleDetailPath('en-US', slug)),
        pt: buildAbsoluteAppUrl(buildLocalizedArticleDetailPath('pt-BR', slug)),
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
      title: `${result.article.title} | Clean Periodic Table`,
      description: result.article.excerpt,
      siteName: 'Clean Periodic Table',
      locale: resolvedLocale,
      type: 'article',
      url: canonicalUrl,
      images:
        result.article.coverImage === null
          ? undefined
          : [
              {
                url: result.article.coverImage,
                alt: result.article.title,
              },
            ],
    },
  };
}

export default async function LocalizedArticleDetailPage({
  params,
}: LocalizedArticleDetailPageProps) {
  const { locale, slug } = await params;
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

  const result = await getPublicArticleBySlugServer({ slug });

  if (result.state === 'not-found') {
    notFound();
  }

  return (
    <ArticleDetailWorkspace
      locale={resolvedLocale}
      featureStage={featureStage}
      article={result.article}
      isAvailable={result.state === 'available'}
      initialErrorMessage={result.errorMessage}
    />
  );
}
