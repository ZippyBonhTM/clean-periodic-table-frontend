'use client';

import type { ChemicalElement } from '@/shared/types/element';

import { normalizeElementImageUrl, normalizeText } from './elementDetailsUtils';

function LinkButton({ href, label }: { href: string | null | undefined; label: string }) {
  const normalizedHref = normalizeText(href);

  if (normalizedHref.length === 0) {
    return (
      <span className="text-xs font-semibold text-[var(--text-muted)]">
        {label}: unavailable
      </span>
    );
  }

  return (
    <a
      href={normalizedHref}
      target="_blank"
      rel="noreferrer"
      className="text-xs font-semibold text-orange-400 underline decoration-2 underline-offset-2 transition-colors hover:text-orange-300"
    >
      {label}
    </a>
  );
}

type ElementDetailsExternalLinksProps = {
  element: ChemicalElement;
};

export default function ElementDetailsExternalLinks({ element }: ElementDetailsExternalLinksProps) {
  return (
    <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3">
      <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">External Links</p>
      <div className="flex flex-wrap gap-3">
        <LinkButton href={element.source} label="Open Official Source" />
        <LinkButton href={normalizeElementImageUrl(element.image?.url)} label="Open Element Image" />
        <LinkButton href={element.bohr_model_image} label="Open Bohr 2D" />
        <LinkButton href={element.bohr_model_3d} label="Open Bohr 3D" />
        <LinkButton href={element.spectral_img} label="Open Spectral Image" />
      </div>
    </section>
  );
}
