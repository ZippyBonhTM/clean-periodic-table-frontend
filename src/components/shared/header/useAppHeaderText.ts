'use client';

import { useMemo } from 'react';

import { getAppHeaderText } from '@/components/shared/header/appHeaderText';
import useAppLocale from '@/shared/i18n/useAppLocale';

export default function useAppHeaderText() {
  const { locale } = useAppLocale();

  return useMemo(() => getAppHeaderText(locale), [locale]);
}
