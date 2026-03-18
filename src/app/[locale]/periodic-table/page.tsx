import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ElementsWorkspace from '@/components/templates/ElementsWorkspace';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildLocalizedPageMetadata } from '@/shared/i18n/appPageMetadata';

type LocalizedPeriodicTablePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedPeriodicTablePageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  return buildLocalizedPageMetadata(resolvedLocale, 'periodicTable');
}

export default async function LocalizedPeriodicTablePage({
  params,
}: LocalizedPeriodicTablePageProps) {
  const { locale } = await params;

  if (resolveAppLocaleFromSegment(locale) === null) {
    notFound();
  }

  return <ElementsWorkspace tableMode="table" />;
}
