import type { AppLocale } from '@/shared/i18n/appLocale.types';

export const APP_LOCALE_SEGMENT_BY_LOCALE = {
  'en-US': 'en',
  'pt-BR': 'pt',
} as const;

export const APP_LOCALE_BY_SEGMENT = {
  en: 'en-US',
  pt: 'pt-BR',
} as const;

export type AppLocaleSegment = keyof typeof APP_LOCALE_BY_SEGMENT;

export function isAppLocaleSegment(value: unknown): value is AppLocaleSegment {
  return value === 'en' || value === 'pt';
}

export function resolveAppLocaleFromSegment(segment: string | null | undefined): AppLocale | null {
  if (segment === null || segment === undefined || !isAppLocaleSegment(segment)) {
    return null;
  }

  return APP_LOCALE_BY_SEGMENT[segment];
}

export function resolveAppLocaleFromPathname(pathname: string | null): AppLocale | null {
  if (pathname === null) {
    return null;
  }

  const [firstSegment = ''] = pathname.split('/').filter(Boolean);
  return resolveAppLocaleFromSegment(firstSegment);
}

export function buildBalanceEquationPath(locale: AppLocale): string {
  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}/balance-equation`;
}

export function isBalanceEquationPath(pathname: string | null): boolean {
  if (pathname === null) {
    return false;
  }

  return (
    pathname === '/balance-equation' ||
    pathname === '/en/balance-equation' ||
    pathname === '/pt/balance-equation'
  );
}
