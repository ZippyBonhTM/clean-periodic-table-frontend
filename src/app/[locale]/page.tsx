import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import HomeLandingPage from '@/components/templates/HomeLandingPage';
import { getHomeLandingText } from '@/components/templates/homeLandingText';
import { buildLocalizedAppPath, resolveAppLocaleFromSegment } from '@/shared/i18n/appLocaleRouting';
import { buildLocalizedPageMetadata } from '@/shared/i18n/appPageMetadata';

type LocalizedHomePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

function buildHomeStructuredData(locale: 'en-US' | 'pt-BR') {
  const text = getHomeLandingText(locale);
  const localeSegment = locale === 'pt-BR' ? 'pt' : 'en';
  const pageUrl = `https://clean-periodic-table.vercel.app/${localeSegment}`;

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
}: LocalizedHomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const resolvedLocale = resolveAppLocaleFromSegment(locale);

  if (resolvedLocale === null) {
    return {};
  }

  const localeSegment = locale === 'pt' ? 'pt' : 'en';

  return {
    ...buildLocalizedPageMetadata(resolvedLocale, 'home'),
    alternates: {
      canonical: `/${localeSegment}`,
      languages: {
        en: buildLocalizedAppPath('en-US', '/'),
        pt: buildLocalizedAppPath('pt-BR', '/'),
      },
    },
  };
}

export default async function LocalizedHomePage({
  params,
}: LocalizedHomePageProps) {
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
