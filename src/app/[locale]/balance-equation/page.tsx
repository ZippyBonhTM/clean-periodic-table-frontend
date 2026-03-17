import { notFound } from 'next/navigation';

import ChemistryBalanceWorkspace from '@/components/templates/ChemistryBalanceWorkspace';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';

type LocalizedBalanceEquationPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedBalanceEquationPage({
  params,
}: LocalizedBalanceEquationPageProps) {
  const { locale } = await params;

  if (resolveAppLocaleFromSegment(locale) === null) {
    notFound();
  }

  return <ChemistryBalanceWorkspace />;
}
