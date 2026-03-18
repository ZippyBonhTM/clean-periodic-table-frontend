import { notFound } from 'next/navigation';

import LoginPage from '@/app/login/page';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';

type LocalizedLoginPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function LocalizedLoginPage({
  params,
}: LocalizedLoginPageProps) {
  const { locale } = await params;

  if (resolveAppLocaleFromSegment(locale) === null) {
    notFound();
  }

  return <LoginPage />;
}
