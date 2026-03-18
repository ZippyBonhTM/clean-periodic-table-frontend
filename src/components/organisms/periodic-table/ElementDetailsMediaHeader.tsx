'use client';

import type { ChemicalElement } from '@/shared/types/element';
import usePeriodicTableText from '@/components/organisms/periodic-table/usePeriodicTableText';

import ElementDetailsBadge from './ElementDetailsBadge';
import type { ViewerMode } from './elementDetails.types';
import { formatNullableValue } from './elementDetailsUtils';
import ElementDetailsViewerModeControls from './ElementDetailsViewerModeControls';

type ElementDetailsMediaHeaderProps = {
  element: ChemicalElement;
  has3D: boolean;
  hasElementImage: boolean;
  isRadioactive: boolean;
  viewerMode: ViewerMode;
  onViewerModeChange: (mode: ViewerMode) => void;
};

export default function ElementDetailsMediaHeader({
  element,
  has3D,
  hasElementImage,
  isRadioactive,
  viewerMode,
  onViewerModeChange,
}: ElementDetailsMediaHeaderProps) {
  const text = usePeriodicTableText();
  const nullableValueText = {
    fallbackText: text.details.fields.notInformed,
    yesText: text.common.yes,
    noText: text.common.no,
  };

  return (
    <section className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 max-[344px]:grid-cols-1">
      <div>
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">{text.details.sectionTitle}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {isRadioactive ? <ElementDetailsBadge label={text.details.badges.radioactive} tone="radioactive" /> : null}
          <ElementDetailsBadge label={formatNullableValue(element.category, nullableValueText)} />
          <ElementDetailsBadge label={formatNullableValue(element.phase, nullableValueText)} />
        </div>
      </div>

      <ElementDetailsViewerModeControls
        has3D={has3D}
        hasElementImage={hasElementImage}
        viewerMode={viewerMode}
        onViewerModeChange={onViewerModeChange}
      />
    </section>
  );
}
