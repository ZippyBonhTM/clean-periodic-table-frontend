import { memo } from 'react';

import NoTranslateText from '@/components/atoms/NoTranslateText';
import Panel from '@/components/atoms/Panel';
import {
  formatElementCategoryLabel,
  formatElementPhaseLabel,
} from '@/components/organisms/periodic-table/periodicTableText';
import usePeriodicTableText from '@/components/organisms/periodic-table/usePeriodicTableText';
import type { ChemicalElement } from '@/shared/types/element';

type ElementCardProps = {
  element: ChemicalElement;
};

function ElementCard({ element }: ElementCardProps) {
  const text = usePeriodicTableText();

  return (
    <Panel className="h-full space-y-3">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
          #{element.number}
        </span>
        <span className="rounded-full bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800">
          {formatElementPhaseLabel(text, element.phase, text.common.notAvailableShort)}
        </span>
      </div>

      <div>
        <NoTranslateText as="p" className="text-xs uppercase tracking-wide text-slate-500">
          {element.symbol}
        </NoTranslateText>
        <h3 className="text-lg font-bold text-slate-900">{element.name}</h3>
        <p className="mt-1 text-xs text-slate-600">
          {formatElementCategoryLabel(text, element.category, text.common.notAvailableShort)}
        </p>
      </div>

      <p className="line-clamp-5 text-sm leading-6 text-slate-700">{element.summary}</p>
    </Panel>
  );
}

export default memo(ElementCard);
