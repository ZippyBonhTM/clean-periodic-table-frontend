'use client';

import { useMemo } from 'react';

import { getTokenStatusText } from '@/components/molecules/tokenStatusText';
import useAppLocale from '@/shared/i18n/useAppLocale';

export default function useTokenStatusText() {
  const { locale } = useAppLocale();

  return useMemo(() => getTokenStatusText(locale), [locale]);
}
