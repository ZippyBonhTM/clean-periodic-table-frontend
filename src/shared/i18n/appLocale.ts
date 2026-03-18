import type { AppLocale } from '@/shared/i18n/appLocale.types';

export const APP_LOCALE_STORAGE_KEY = 'app-locale';
export const APP_LOCALE_COOKIE_KEY = 'app-locale';
export const APP_LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const DEFAULT_APP_LOCALE: AppLocale = 'en-US';

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'en-US' || value === 'pt-BR';
}

export function resolveNavigatorAppLocale(navigatorLanguage?: string | null): AppLocale {
  if (typeof navigatorLanguage === 'string' && navigatorLanguage.toLowerCase().startsWith('pt')) {
    return 'pt-BR';
  }

  return DEFAULT_APP_LOCALE;
}

export function readAppLocaleCookie(cookieValue?: string | null): AppLocale | null {
  if (typeof cookieValue !== 'string' || cookieValue.trim().length === 0) {
    return null;
  }

  return isAppLocale(cookieValue) ? cookieValue : null;
}

export function readAppLocaleFromCookieHeader(cookieHeader?: string | null): AppLocale | null {
  if (typeof cookieHeader !== 'string' || cookieHeader.trim().length === 0) {
    return null;
  }

  const parts = cookieHeader.split(';');

  for (const part of parts) {
    const [rawKey, ...valueParts] = part.trim().split('=');

    if (rawKey !== APP_LOCALE_COOKIE_KEY) {
      continue;
    }

    const value = valueParts.join('=').trim();
    return readAppLocaleCookie(decodeURIComponent(value));
  }

  return null;
}

export function resolveRequestAppLocale(options?: {
  cookieHeader?: string | null;
  acceptLanguage?: string | null;
}): AppLocale {
  const cookieLocale = readAppLocaleFromCookieHeader(options?.cookieHeader);

  if (cookieLocale !== null) {
    return cookieLocale;
  }

  return resolveNavigatorAppLocale(options?.acceptLanguage);
}

export function readStoredAppLocale(): AppLocale | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedLocale = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY);
  return isAppLocale(storedLocale) ? storedLocale : null;
}

export function resolveInitialAppLocale(): AppLocale {
  const storedLocale = readStoredAppLocale();

  if (storedLocale !== null) {
    return storedLocale;
  }

  if (typeof navigator === 'undefined') {
    return DEFAULT_APP_LOCALE;
  }

  return resolveNavigatorAppLocale(navigator.language);
}

export function persistAppLocale(locale: AppLocale): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
  document.cookie = `${APP_LOCALE_COOKIE_KEY}=${encodeURIComponent(locale)}; path=/; max-age=${APP_LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
}

export function toHtmlLang(locale: AppLocale): string {
  return locale === 'pt-BR' ? 'pt-BR' : 'en';
}
