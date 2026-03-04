'use client';

import { useCallback, useEffect, useState } from 'react';

type AppTheme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'clean-periodic-theme';

function resolveTheme(rawTheme: string | null): AppTheme {
  if (rawTheme === 'light') {
    return 'light';
  }

  return 'dark';
}

function useTheme() {
  const [theme, setTheme] = useState<AppTheme>(() => {
    if (typeof window === 'undefined') {
      return 'dark';
    }

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return resolveTheme(stored);
  });

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset.theme = theme;

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((previousTheme) => (previousTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    theme,
    toggleTheme,
    setTheme,
  };
}

export default useTheme;
export type { AppTheme };
