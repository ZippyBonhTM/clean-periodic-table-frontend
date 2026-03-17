'use client';

import { useContext } from 'react';

import { AppLocaleContext } from '@/shared/i18n/AppLocaleProvider';

export default function useAppLocale() {
  const context = useContext(AppLocaleContext);

  if (context === null) {
    throw new Error('useAppLocale must be used inside AppLocaleProvider.');
  }

  return context;
}
