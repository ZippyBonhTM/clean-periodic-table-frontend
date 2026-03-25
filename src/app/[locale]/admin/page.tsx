import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import AdminDashboardShell from '@/components/templates/AdminDashboardShell';
import AdminOverviewWorkspace from '@/components/templates/AdminOverviewWorkspace';
import { buildAdminPageMetadata } from '@/shared/admin/adminPageMetadata';
import { resolveServerAdminAccessGate } from '@/shared/admin/serverAdminAccess';
import { getArticleFeatureStage } from '@/shared/config/articleFeature';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';

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

  return buildAdminPageMetadata(resolvedLocale, 'overview');
}

export default async function LocalizedAdminPage({
  params,
}: LocalizedAdminPageProps) {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    notFound();
  }

  const adminAccess = await resolveServerAdminAccessGate();

  if (adminAccess === null) {
    notFound();
  }

  const articleFeatureStage = getArticleFeatureStage();

  return (
    <AdminDashboardShell
      locale={resolvedLocale}
      adminProfile={adminAccess.userProfile}
      articleFeatureStage={articleFeatureStage}
    >
      <AdminOverviewWorkspace
        locale={resolvedLocale}
        articleFeatureStage={articleFeatureStage}
      />
    </AdminDashboardShell>
  );
}
