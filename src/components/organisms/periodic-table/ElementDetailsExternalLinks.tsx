'use client';

import type { ChemicalElement } from '@/shared/types/element';

import ElementDetailsLinkButton from './ElementDetailsLinkButton';
import { normalizeElementImageUrl } from './elementDetailsUtils';

type ElementDetailsExternalLinksProps = {
  element: ChemicalElement;
};

export default function ElementDetailsExternalLinks({ element }: ElementDetailsExternalLinksProps) {
  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
      <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">External Links</p>
      <div className="flex flex-wrap gap-3">
        <ElementDetailsLinkButton href={element.source} label="Open Official Source" />
        <ElementDetailsLinkButton
          href={normalizeElementImageUrl(element.image?.url)}
          label="Open Element Image"
        />
        <ElementDetailsLinkButton href={element.bohr_model_image} label="Open Bohr 2D" />
        <ElementDetailsLinkButton href={element.bohr_model_3d} label="Open Bohr 3D" />
        <ElementDetailsLinkButton href={element.spectral_img} label="Open Spectral Image" />
      </div>
    </section>
  );
}
