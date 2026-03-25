import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import AdminContentWorkspace from '@/components/templates/AdminContentWorkspace';
import AdminDashboardShell from '@/components/templates/AdminDashboardShell';
import { buildAdminPageMetadata } from '@/shared/admin/adminPageMetadata';
import { resolveServerAdminAccessGate } from '@/shared/admin/serverAdminAccess';
import { getArticleFeatureStage } from '@/shared/config/articleFeature';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';

type LocalizedAdminContentPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedAdminContentPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  return buildAdminPageMetadata(resolvedLocale, 'content');
}

export default async function LocalizedAdminContentPage({
  params,
}: LocalizedAdminContentPageProps) {
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
      <AdminContentWorkspace
        locale={resolvedLocale}
        articleFeatureStage={articleFeatureStage}
      />
    </AdminDashboardShell>
  );
}
