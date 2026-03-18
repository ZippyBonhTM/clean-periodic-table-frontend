import type { MetadataRoute } from 'next';

import type { AppLocale } from '@/shared/i18n/appLocale.types';
import { buildLocalizedAbsoluteAppUrl } from '@/shared/seo/appSite';

const INDEXABLE_PATHNAMES = [
  '/',
  '/search',
  '/periodic-table',
  '/balance-equation',
  '/molecular-editor',
] as const;

const APP_LOCALES: AppLocale[] = ['en-US', 'pt-BR'];

function resolvePriority(pathname: (typeof INDEXABLE_PATHNAMES)[number]): number {
  if (pathname === '/') {
    return 1;
  }

  if (pathname === '/periodic-table') {
    return 0.9;
  }

  return 0.8;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return INDEXABLE_PATHNAMES.flatMap((pathname) => {
    const alternates = {
      languages: {
        en: buildLocalizedAbsoluteAppUrl('en-US', pathname),
        pt: buildLocalizedAbsoluteAppUrl('pt-BR', pathname),
      },
    };

    return APP_LOCALES.map((locale) => ({
      url: buildLocalizedAbsoluteAppUrl(locale, pathname),
      lastModified,
      changeFrequency: 'weekly' as const,
      priority: resolvePriority(pathname),
      alternates,
    }));
  });
}
