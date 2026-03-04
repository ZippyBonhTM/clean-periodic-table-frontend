'use client';

import { memo } from 'react';

import PeriodicTable from '@/components/organisms/periodic-table/PeriodicTable';
import type { ChemicalElement } from '@/shared/types/element';

type ElementsGridProps = {
  elements: ChemicalElement[];
};

function ElementsGrid({ elements }: ElementsGridProps) {
  return <PeriodicTable elements={elements} />;
}

export default memo(ElementsGrid);
