import type { Metadata } from 'next';

import { appPageMetadataEn } from '@/shared/i18n/appPageMetadata.en';
import { appPageMetadataPt } from '@/shared/i18n/appPageMetadata.pt';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

const APP_PAGE_METADATA_BY_LOCALE = {
  'en-US': appPageMetadataEn,
  'pt-BR': appPageMetadataPt,
} as const;

export type AppPageMetadataKey = keyof typeof appPageMetadataEn.pages;

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

  return {
    title: `${pageMetadata.title} | ${metadata.brandTitle}`,
    description: pageMetadata.description,
    keywords,
    openGraph: {
      title: `${pageMetadata.title} | ${metadata.brandTitle}`,
      description: pageMetadata.description,
      siteName: metadata.brandTitle,
      locale,
      type: 'website',
    },
  };
}
