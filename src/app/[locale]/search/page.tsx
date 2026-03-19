import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ElementsWorkspace from '@/components/templates/ElementsWorkspace';
import { listPublicElementsServer } from '@/shared/api/backendServerApi';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildLocalizedPageMetadata } from '@/shared/i18n/appPageMetadata';

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

  return buildLocalizedPageMetadata(resolvedLocale, 'search');
}

export default async function LocalizedSearchPage({
  params,
}: LocalizedSearchPageProps) {
  const { locale } = await params;
  const { elements, isPubliclyAvailable } = await listPublicElementsServer();

  if (resolveAppLocaleFromSegment(locale) === null) {
    notFound();
  }

  return (
    <ElementsWorkspace
      tableMode="explore"
      initialElements={elements}
      hasPublicElements={isPubliclyAvailable}
    />
  );
}
