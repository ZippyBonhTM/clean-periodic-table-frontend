import { notFound } from 'next/navigation';

import ElementsWorkspace from '@/components/templates/ElementsWorkspace';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';

type LocalizedSearchPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedSearchPage({
  params,
}: LocalizedSearchPageProps) {
  const { locale } = await params;

  if (resolveAppLocaleFromSegment(locale) === null) {
    notFound();
  }

  return <ElementsWorkspace tableMode="explore" />;
}
