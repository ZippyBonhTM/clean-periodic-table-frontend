'use client';

import { createElement } from 'react';

import type { ChemicalElement } from '@/shared/types/element';

import ElementDetailsLinkButton from './ElementDetailsLinkButton';
import { normalizeText } from './elementDetailsUtils';

type ElementDetails3DViewerProps = {
  element: ChemicalElement;
  elementName: string;
  has3D: boolean;
  is3DViewerReady: boolean;
};

export default function ElementDetails3DViewer({
  element,
  elementName,
  has3D,
  is3DViewerReady,
}: ElementDetails3DViewerProps) {
  if (!has3D) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] text-sm text-[var(--text-muted)] md:h-72">
        3D model is unavailable for this element.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-56 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] md:h-72">
        {is3DViewerReady ? (
          createElement('model-viewer', {
            src: normalizeText(element.bohr_model_3d) || undefined,
            poster: normalizeText(element.bohr_model_image) || undefined,
            alt: `3D model of ${elementName}`,
            'camera-controls': 'true',
            autoplay: 'true',
            'interaction-prompt': 'auto',
            'shadow-intensity': '0.55',
            exposure: '0.95',
            className: 'h-full w-full',
          })
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
            Loading lightweight 3D viewer...
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <ElementDetailsLinkButton href={element.bohr_model_3d} label="Open 3D File in New Tab" />
        <span className="text-xs text-[var(--text-muted)]">
          Powered by Google model-viewer for lightweight rendering.
        </span>
      </div>
    </div>
  );
}
