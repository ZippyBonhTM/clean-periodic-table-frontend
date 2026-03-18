import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  resolveRequestAppLocale,
} from '@/shared/i18n/appLocale';
import { buildLocalizedAppPath } from '@/shared/i18n/appLocaleRouting';

export default async function HomePage() {
  const requestHeaders = await headers();
  const locale = resolveRequestAppLocale({
    cookieHeader: requestHeaders.get('cookie'),
    acceptLanguage: requestHeaders.get('accept-language'),
  });

  redirect(buildLocalizedAppPath(locale, '/search'));
}
