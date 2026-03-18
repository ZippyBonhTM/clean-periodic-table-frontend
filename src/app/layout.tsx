import type { Metadata } from 'next';
import { JetBrains_Mono, Space_Grotesk } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from 'next/script';

import AppLocaleProvider from '@/shared/i18n/AppLocaleProvider';
import {
  APP_LOCALE_COOKIE_KEY,
  APP_LOCALE_STORAGE_KEY,
} from '@/shared/i18n/appLocale';

import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
});

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Clean Periodic Table',
  description: 'Interactive periodic table frontend for auth + backend microservices',
  other: {
    google: 'notranslate',
  },
};

const appLocaleBootstrapScript = `
  (function() {
    try {
      var path = window.location.pathname || '/';
      var firstSegment = path.split('/').filter(Boolean)[0] || '';
      var cookieMatch = document.cookie.match(new RegExp('(?:^|; )' + '${APP_LOCALE_COOKIE_KEY}' + '=([^;]*)'));
      var cookieLocale = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
      var storedLocale = window.localStorage.getItem('${APP_LOCALE_STORAGE_KEY}');
      var locale = firstSegment === 'pt'
        ? 'pt-BR'
        : firstSegment === 'en'
          ? 'en-US'
          : cookieLocale || storedLocale;
      var htmlLang = locale === 'pt-BR' ? 'pt-BR' : 'en';
      document.documentElement.lang = htmlLang;
    } catch (error) {
      document.documentElement.lang = 'en';
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Script
          id="app-locale-bootstrap"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: appLocaleBootstrapScript }}
        />
        <AppLocaleProvider>
          {children}
          {isProduction ? <Analytics /> : null}
          {isProduction ? <SpeedInsights /> : null}
        </AppLocaleProvider>
      </body>
    </html>
  );
}
