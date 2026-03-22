import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import AdminDashboardShell from '@/components/templates/AdminDashboardShell';
import AdminUserDetailWorkspace from '@/components/templates/AdminUserDetailWorkspace';
import { buildAdminPageMetadata } from '@/shared/admin/adminPageMetadata';
import { requireServerAdminAccess } from '@/shared/admin/serverAdminAccess';
import { getArticleFeatureStage } from '@/shared/config/articleFeature';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';

type LocalizedAdminUserDetailPageProps = {
  params: Promise<{
    locale: string;
    userId: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedAdminUserDetailPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  return buildAdminPageMetadata(resolvedLocale, 'users');
}

export default async function LocalizedAdminUserDetailPage({
  params,
}: LocalizedAdminUserDetailPageProps) {
  const { locale, userId } = await params;
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
      <AdminUserDetailWorkspace
        locale={resolvedLocale}
        adminProfile={adminProfile}
        userId={userId}
      />
    </AdminDashboardShell>
  );
}
