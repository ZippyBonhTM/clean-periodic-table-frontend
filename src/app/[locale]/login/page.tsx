import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import LoginPage from '@/app/login/page';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildLocalizedPageMetadata } from '@/shared/i18n/appPageMetadata';

type LocalizedLoginPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedLoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  return buildLocalizedPageMetadata(resolvedLocale, 'login');
}

export default async function LocalizedLoginPage({
  params,
}: LocalizedLoginPageProps) {
  const { locale } = await params;

  if (resolveAppLocaleFromSegment(locale) === null) {
    notFound();
  }

  return <LoginPage />;
}
