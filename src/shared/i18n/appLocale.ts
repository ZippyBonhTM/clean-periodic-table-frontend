import type { AppLocale } from '@/shared/i18n/appLocale.types';

export const APP_LOCALE_STORAGE_KEY = 'app-locale';
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
}

export function toHtmlLang(locale: AppLocale): string {
  return locale === 'pt-BR' ? 'pt-BR' : 'en';
}
