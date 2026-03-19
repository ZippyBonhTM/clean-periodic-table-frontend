import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import { resolveRequestAppLocale } from '@/shared/i18n/appLocale';
import { buildLocalizedAppPath } from '@/shared/i18n/appLocaleRouting';

export default async function SearchPage() {
  const requestHeaders = await headers();
  const locale = resolveRequestAppLocale({
    cookieHeader: requestHeaders.get('cookie'),
    acceptLanguage: requestHeaders.get('accept-language'),
  });
  redirect(buildLocalizedAppPath(locale, '/periodic-table'));
}
