import { notFound } from 'next/navigation';

import RegisterPage from '@/app/register/page';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';

type LocalizedRegisterPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedRegisterPage({
  params,
}: LocalizedRegisterPageProps) {
  const { locale } = await params;

  if (resolveAppLocaleFromSegment(locale) === null) {
    notFound();
  }

  return <RegisterPage />;
}
