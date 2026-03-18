'use client';

import { useMemo } from 'react';

import type { ChemicalElement } from '@/shared/types/element';
import usePeriodicTableText from '@/components/organisms/periodic-table/usePeriodicTableText';

import {
  buildCardOptimizedRows,
  buildElementRows,
} from './elementDetailsUtils';

type UseElementDetailsRowsOptions = {
  element: ChemicalElement | null;
};

export default function useElementDetailsRows({
  element,
}: UseElementDetailsRowsOptions) {
  const text = usePeriodicTableText();

  const dataRows = useMemo(() => {
    if (element === null) {
      return [];
    }

    return buildElementRows(element, text.details.fields, text.common);
  }, [element, text.common, text.details.fields]);

  const cardRows = useMemo(() => {
    return buildCardOptimizedRows(dataRows);
  }, [dataRows]);

  return {
    cardRows,
    dataRows,
  };
}
