'use client';

import { useMemo } from 'react';

import { getMolecularEditorText } from '@/components/organisms/molecular-editor/molecularEditorText';
import useAppLocale from '@/shared/i18n/useAppLocale';

export default function useMolecularEditorText() {
  const { locale } = useAppLocale();

  return useMemo(() => getMolecularEditorText(locale), [locale]);
}
