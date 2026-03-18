import { notFound } from 'next/navigation';

import ElementsWorkspace from '@/components/templates/ElementsWorkspace';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';

type LocalizedPeriodicTablePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedPeriodicTablePage({
  params,
}: LocalizedPeriodicTablePageProps) {
  const { locale } = await params;

  if (resolveAppLocaleFromSegment(locale) === null) {
    notFound();
  }

  return <ElementsWorkspace tableMode="table" />;
}
