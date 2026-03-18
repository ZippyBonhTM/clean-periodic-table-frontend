'use client';

import { useMemo } from 'react';

import { getAppFooterText } from '@/components/shared/footer/appFooterText';
import useAppLocale from '@/shared/i18n/useAppLocale';

export default function useAppFooterText() {
  const { locale } = useAppLocale();

  return useMemo(() => getAppFooterText(locale), [locale]);
}
