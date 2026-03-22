import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import AdminDashboardShell from '@/components/templates/AdminDashboardShell';
import AdminUsersWorkspace from '@/components/templates/AdminUsersWorkspace';
import { buildAdminPageMetadata } from '@/shared/admin/adminPageMetadata';
import { resolveAdminUsersBrowseFilters } from '@/shared/admin/adminUsersFilters';
import { requireServerAdminAccess } from '@/shared/admin/serverAdminAccess';
import { getArticleFeatureStage } from '@/shared/config/articleFeature';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';

type LocalizedAdminUsersPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams?: Promise<{
    status?: string | string[];
    track?: string | string[];
    q?: string | string[];
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedAdminUsersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  return buildAdminPageMetadata(resolvedLocale, 'users');
}

export default async function LocalizedAdminUsersPage({
  params,
  searchParams,
}: LocalizedAdminUsersPageProps) {
  const { locale } = await params;
  const resolvedSearchParams = searchParams === undefined ? {} : await searchParams;
  const initialFilters = resolveAdminUsersBrowseFilters(resolvedSearchParams);
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
      <AdminUsersWorkspace
        key={`${initialFilters.status}:${initialFilters.track}:${initialFilters.query ?? ''}`}
        locale={resolvedLocale}
        adminProfile={adminProfile}
        initialFilters={initialFilters}
      />
    </AdminDashboardShell>
  );
}
