import { notFound, redirect } from 'next/navigation';

import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';

type LocalizedMolecularBuilderPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedMolecularBuilderPage({
  params,
}: LocalizedMolecularBuilderPageProps) {
  const { locale } = await params;

  if (resolveAppLocaleFromSegment(locale) === null) {
    notFound();
  }

  redirect(`/${locale}/molecular-editor`);
}
