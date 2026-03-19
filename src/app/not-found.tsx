import { headers } from 'next/headers';

import NotFoundPage from '@/components/templates/NotFoundPage';
import { resolveRequestAppLocale } from '@/shared/i18n/appLocale';

export default async function GlobalNotFoundPage() {
  const requestHeaders = await headers();
  const locale = resolveRequestAppLocale({
    cookieHeader: requestHeaders.get('cookie'),
    acceptLanguage: requestHeaders.get('accept-language'),
  });

  return <NotFoundPage locale={locale} />;
}
