import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import AdminWorkspace from '@/components/templates/AdminWorkspace';
import { getAdminWorkspaceText } from '@/components/templates/adminWorkspaceText';
import { buildLocalizedAdminPath } from '@/shared/admin/adminRouting';
import { requireServerAdminAccess } from '@/shared/admin/serverAdminAccess';
import { getArticleFeatureStage } from '@/shared/config/articleFeature';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildAbsoluteAppUrl } from '@/shared/seo/appSite';

type LocalizedAdminPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedAdminPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  const text = getAdminWorkspaceText(resolvedLocale);
  const canonicalUrl = buildAbsoluteAppUrl(buildLocalizedAdminPath(resolvedLocale));

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

export default async function LocalizedAdminPage({
  params,
}: LocalizedAdminPageProps) {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    notFound();
  }

  const adminProfile = await requireServerAdminAccess();

  return (
    <AdminWorkspace
      locale={resolvedLocale}
      adminProfile={adminProfile}
      articleFeatureStage={getArticleFeatureStage()}
    />
  );
}
