'use client';

import { createContext, useEffect, useMemo, useState } from 'react';

import {
  persistAppLocale,
  resolveInitialAppLocale,
  toHtmlLang,
} from '@/shared/i18n/appLocale';
import type { AppLocale } from '@/shared/i18n/appLocale.types';

type AppLocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

export const AppLocaleContext = createContext<AppLocaleContextValue | null>(null);

type AppLocaleProviderProps = {
  children: React.ReactNode;
};

export default function AppLocaleProvider({ children }: AppLocaleProviderProps) {
  const [locale, setLocale] = useState<AppLocale>(resolveInitialAppLocale);

  useEffect(() => {
    persistAppLocale(locale);
    document.documentElement.lang = toHtmlLang(locale);
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
    }),
    [locale],
  );

  return <AppLocaleContext.Provider value={value}>{children}</AppLocaleContext.Provider>;
}
