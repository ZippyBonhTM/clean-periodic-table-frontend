import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import AdminAuditWorkspace from '@/components/templates/AdminAuditWorkspace';
import AdminDashboardShell from '@/components/templates/AdminDashboardShell';
import { buildAdminPageMetadata } from '@/shared/admin/adminPageMetadata';
import { resolveAdminAuditBrowseFilters } from '@/shared/admin/adminAuditFilters';
import { requireServerAdminAccess } from '@/shared/admin/serverAdminAccess';
import { getArticleFeatureStage } from '@/shared/config/articleFeature';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';

type LocalizedAdminAuditPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams?: Promise<{
    action?: string | string[];
    q?: string | string[];
    cursor?: string | string[];
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedAdminAuditPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  return buildAdminPageMetadata(resolvedLocale, 'audit');
}

export default async function LocalizedAdminAuditPage({
  params,
  searchParams,
}: LocalizedAdminAuditPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams === undefined ? {} : await searchParams;
  const initialFilters = resolveAdminAuditBrowseFilters(resolvedSearchParams);
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
      <AdminAuditWorkspace locale={resolvedLocale} initialFilters={initialFilters} />
    </AdminDashboardShell>
  );
}
