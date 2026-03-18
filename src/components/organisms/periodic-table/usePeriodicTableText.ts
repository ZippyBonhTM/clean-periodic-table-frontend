'use client';

import { useMemo } from 'react';

import { getPeriodicTableText } from '@/components/organisms/periodic-table/periodicTableText';
import useAppLocale from '@/shared/i18n/useAppLocale';

export default function usePeriodicTableText() {
  const { locale } = useAppLocale();

  return useMemo(() => getPeriodicTableText(locale), [locale]);
}
