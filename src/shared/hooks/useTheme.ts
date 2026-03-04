'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

type AppTheme = 'dark' | 'light';

const THEME_STORAGE_KEY = 'clean-periodic-theme';

function resolveTheme(rawTheme: string | null): AppTheme {
  if (rawTheme === 'light') {
    return 'light';
  }

  return 'dark';
}

function readThemeSnapshot(): AppTheme {
  if (typeof window === 'undefined') {
    return 'dark';
  }

  return resolveTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== THEME_STORAGE_KEY) {
      return;
    }

    onStoreChange();
  };
  const onThemeChange = () => onStoreChange();

  window.addEventListener('storage', onStorage);
  window.addEventListener('theme-changed', onThemeChange);

  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener('theme-changed', onThemeChange);
  };
}

function emitThemeChange(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event('theme-changed'));
}

function useTheme() {
  const theme = useSyncExternalStore<AppTheme>(
    subscribe,
    readThemeSnapshot,
    () => 'dark',
  );

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    emitThemeChange();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  return {
    theme,
    toggleTheme,
    setTheme,
  };
}

export default useTheme;
export type { AppTheme };
