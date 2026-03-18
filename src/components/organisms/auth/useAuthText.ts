'use client';

import { useMemo } from 'react';

import { getAuthText } from '@/components/organisms/auth/authText';
import useAppLocale from '@/shared/i18n/useAppLocale';

export default function useAuthText() {
  const { locale } = useAppLocale();

  return useMemo(() => getAuthText(locale), [locale]);
}
