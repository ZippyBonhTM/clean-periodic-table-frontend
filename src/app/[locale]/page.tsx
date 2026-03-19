import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import HomeLandingPage from '@/components/templates/HomeLandingPage';
import { getHomeLandingText } from '@/components/templates/homeLandingText';
import { resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildLocalizedPageMetadata } from '@/shared/i18n/appPageMetadata';
import { buildLocalizedAbsoluteAppUrl } from '@/shared/seo/appSite';

type PageProps = {
  params: Promise<{
    locale: string;
  }>;
};

function buildHomeStructuredData(locale: 'en-US' | 'pt-BR') {
  const text = getHomeLandingText(locale);
  const pageUrl = buildLocalizedAbsoluteAppUrl(locale, '/');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Clean Periodic Table',
        url: pageUrl,
        inLanguage: locale,
        description: text.hero.description,
      },
      {
        '@type': 'FAQPage',
        inLanguage: locale,
        mainEntity: text.faq.items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  return buildLocalizedPageMetadata(resolvedLocale, 'home');
}

export default async function Page({
  params,
}: PageProps) {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    notFound();
  }

  const structuredData = buildHomeStructuredData(resolvedLocale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomeLandingPage locale={resolvedLocale} />
    </>
  );
}
