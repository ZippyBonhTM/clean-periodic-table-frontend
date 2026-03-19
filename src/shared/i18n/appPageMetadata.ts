import type { Metadata } from 'next';

import { appPageMetadataEn } from '@/shared/i18n/appPageMetadata.en';
import { appPageMetadataPt } from '@/shared/i18n/appPageMetadata.pt';
import type { AppLocale } from '@/shared/i18n/appLocale.types';
import { buildLocalizedAbsoluteAppUrl } from '@/shared/seo/appSite';

const APP_PAGE_METADATA_BY_LOCALE = {
  'en-US': appPageMetadataEn,
  'pt-BR': appPageMetadataPt,
} as const;

export type AppPageMetadataKey = keyof typeof appPageMetadataEn.pages;

const APP_PAGE_PATHNAME_BY_KEY: Record<AppPageMetadataKey, string> = {
  home: '/',
  periodicTable: '/periodic-table',
  balanceEquation: '/balance-equation',
  molecularEditor: '/molecular-editor',
  moleculeGallery: '/molecule-gallery',
  login: '/login',
  register: '/register',
};

export function getAppPageMetadata(locale: AppLocale) {
  return APP_PAGE_METADATA_BY_LOCALE[locale];
}

export function buildLocalizedPageMetadata(
  locale: AppLocale,
  page: AppPageMetadataKey,
): Metadata {
  const metadata = getAppPageMetadata(locale);
  const pageMetadata = metadata.pages[page];
  const keywords = 'keywords' in pageMetadata ? [...pageMetadata.keywords] : undefined;
  const pathname = APP_PAGE_PATHNAME_BY_KEY[page];
  const canonicalUrl = buildLocalizedAbsoluteAppUrl(locale, pathname);
  const isIndexable = !('indexable' in pageMetadata) || pageMetadata.indexable !== false;

  return {
    title: `${pageMetadata.title} | ${metadata.brandTitle}`,
    description: pageMetadata.description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: buildLocalizedAbsoluteAppUrl('en-US', pathname),
        pt: buildLocalizedAbsoluteAppUrl('pt-BR', pathname),
      },
    },
    robots: isIndexable
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: false,
        },
    openGraph: {
      title: `${pageMetadata.title} | ${metadata.brandTitle}`,
      description: pageMetadata.description,
      siteName: metadata.brandTitle,
      locale,
      type: 'website',
      url: canonicalUrl,
    },
  };
}
