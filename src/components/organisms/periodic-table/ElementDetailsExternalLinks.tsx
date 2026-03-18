'use client';

import type { ChemicalElement } from '@/shared/types/element';
import usePeriodicTableText from '@/components/organisms/periodic-table/usePeriodicTableText';

import ElementDetailsLinkButton from './ElementDetailsLinkButton';
import { normalizeElementImageUrl } from './elementDetailsUtils';

type ElementDetailsExternalLinksProps = {
  element: ChemicalElement;
};

export default function ElementDetailsExternalLinks({ element }: ElementDetailsExternalLinksProps) {
  const text = usePeriodicTableText();

  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
      <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">{text.details.externalLinksTitle}</p>
      <div className="flex flex-wrap gap-3">
        <ElementDetailsLinkButton href={element.source} label={text.details.links.officialSource} />
        <ElementDetailsLinkButton
          href={normalizeElementImageUrl(element.image?.url)}
          label={text.details.links.elementImage}
        />
        <ElementDetailsLinkButton href={element.bohr_model_image} label={text.details.links.bohr2d} />
        <ElementDetailsLinkButton href={element.bohr_model_3d} label={text.details.links.bohr3d} />
        <ElementDetailsLinkButton href={element.spectral_img} label={text.details.links.spectralImage} />
      </div>
    </section>
  );
}
