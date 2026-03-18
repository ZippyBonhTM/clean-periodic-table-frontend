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

const LOCALIZED_APP_PATHS = new Set([
  '/',
  '/search',
  '/periodic-table',
  '/balance-equation',
  '/molecular-editor',
  '/molecule-gallery',
  '/login',
  '/register',
  '/molecular-builder',
]);

export function normalizeAppPathname(pathname: string | null): string | null {
  if (pathname === null) {
    return null;
  }

  const trimmed = pathname.trim();

  if (trimmed.length === 0) {
    return '/';
  }

  const normalizedPath = trimmed === '/' ? '/' : trimmed.replace(/\/+$/, '');
  const segments = normalizedPath.split('/').filter(Boolean);

  if (segments.length === 0) {
    return '/';
  }

  if (isAppLocaleSegment(segments[0])) {
    const remainingPath = `/${segments.slice(1).join('/')}`;
    return remainingPath === '/' ? '/' : remainingPath.replace(/\/+$/, '');
  }

  return normalizedPath;
}

export function isLocalizedAppPath(pathname: string | null): boolean {
  const normalizedPathname = normalizeAppPathname(pathname);

  if (normalizedPathname === null) {
    return false;
  }

  return LOCALIZED_APP_PATHS.has(normalizedPathname);
}

export function buildLocalizedAppPath(locale: AppLocale, pathname: string): string {
  const normalizedPathname = normalizeAppPathname(pathname);

  if (normalizedPathname === null || !LOCALIZED_APP_PATHS.has(normalizedPathname)) {
    return pathname;
  }

  if (normalizedPathname === '/') {
    return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}`;
  }

  return `/${APP_LOCALE_SEGMENT_BY_LOCALE[locale]}${normalizedPathname}`;
}

export function isLocalizedAppHrefActive(pathname: string | null, href: string): boolean {
  const normalizedCurrentPath = normalizeAppPathname(pathname);

  if (normalizedCurrentPath === null) {
    return false;
  }

  return normalizedCurrentPath === href;
}

export function buildBalanceEquationPath(locale: AppLocale): string {
  return buildLocalizedAppPath(locale, '/balance-equation');
}

export function isBalanceEquationPath(pathname: string | null): boolean {
  return isLocalizedAppHrefActive(pathname, '/balance-equation');
}
