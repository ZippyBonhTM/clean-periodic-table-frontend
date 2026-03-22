import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import AdminAccessWorkspace from '@/components/templates/AdminAccessWorkspace';
import AdminDashboardShell from '@/components/templates/AdminDashboardShell';
import { buildAdminPageMetadata } from '@/shared/admin/adminPageMetadata';
import { requireServerAdminAccess } from '@/shared/admin/serverAdminAccess';
import { getArticleFeatureStage } from '@/shared/config/articleFeature';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';

type LocalizedAdminAccessPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedAdminAccessPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  return buildAdminPageMetadata(resolvedLocale, 'access');
}

export default async function LocalizedAdminAccessPage({
  params,
}: LocalizedAdminAccessPageProps) {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    notFound();
  }

  const adminProfile = await requireServerAdminAccess();
  const articleFeatureStage = getArticleFeatureStage();

  return (
    <AdminDashboardShell
      locale={resolvedLocale}
      adminProfile={adminProfile}
      articleFeatureStage={articleFeatureStage}
    >
      <AdminAccessWorkspace
        locale={resolvedLocale}
        articleFeatureStage={articleFeatureStage}
      />
    </AdminDashboardShell>
  );
}
