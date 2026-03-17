'use client';

import { useMemo } from 'react';

import {
  getChemistryBalanceText,
} from '@/components/templates/chemistryBalanceText';
import useAppLocale from '@/shared/i18n/useAppLocale';

export default function useChemistryBalanceText() {
  const { locale, setLocale } = useAppLocale();
  const text = useMemo(() => getChemistryBalanceText(locale), [locale]);

  return {
    locale,
    setLocale,
    text,
  };
}
