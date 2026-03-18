import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ChemistryBalanceWorkspace from '@/components/templates/ChemistryBalanceWorkspace';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildLocalizedPageMetadata } from '@/shared/i18n/appPageMetadata';

type LocalizedBalanceEquationPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export async function generateMetadata({
  params,
}: LocalizedBalanceEquationPageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  return buildLocalizedPageMetadata(resolvedLocale, 'balanceEquation');
}

export default async function LocalizedBalanceEquationPage({
  params,
}: LocalizedBalanceEquationPageProps) {
  const { locale } = await params;

  if (resolveAppLocaleFromSegment(locale) === null) {
    notFound();
  }

  return <ChemistryBalanceWorkspace />;
}
