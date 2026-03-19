import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';

type LocalizedSearchPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedSearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  return {};
}

export default async function LocalizedSearchPage({
  params,
}: LocalizedSearchPageProps) {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    notFound();
  }

  redirect(`/${locale}/periodic-table`);
}
