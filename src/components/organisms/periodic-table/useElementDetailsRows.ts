'use client';

import { useMemo } from 'react';

import type { ChemicalElement } from '@/shared/types/element';

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
  const dataRows = useMemo(() => {
    if (element === null) {
      return [];
    }

    return buildElementRows(element);
  }, [element]);

  const cardRows = useMemo(() => {
    return buildCardOptimizedRows(dataRows);
  }, [dataRows]);

  return {
    cardRows,
    dataRows,
  };
}
