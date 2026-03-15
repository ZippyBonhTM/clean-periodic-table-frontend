'use client';

import { createElement } from 'react';

import type { ChemicalElement } from '@/shared/types/element';

import ElementDetailsLinkButton from './ElementDetailsLinkButton';
import { ImageUnavailableState, NativeElementImage } from './ElementDetailsNativeImage';
import type { ExpandedImageState, ViewerMode } from './elementDetails.types';
import { normalizeText } from './elementDetailsUtils';

type ElementDetailsViewerPanelProps = {
  element: ChemicalElement;
  elementImageUrl: string;
  elementName: string;
  has2D: boolean;
  has3D: boolean;
  hasElementImage: boolean;
  is3DViewerReady: boolean;
  isImageFailed: (url: string) => boolean;
  onImageLoadError: (url: string) => void;
  onOpenExpandedImage: (
    sourceUrl: string,
    altText: string,
    kind: ExpandedImageState['kind'],
  ) => void;
  twoDImageUrl: string;
  viewerMode: ViewerMode;
};

export default function ElementDetailsViewerPanel({
  element,
  elementImageUrl,
  elementName,
  has2D,
  has3D,
  hasElementImage,
  is3DViewerReady,
  isImageFailed,
  onImageLoadError,
  onOpenExpandedImage,
  twoDImageUrl,
  viewerMode,
}: ElementDetailsViewerPanelProps) {
  return (
    <section className="surface-panel rounded-2xl border border-[var(--border-subtle)] p-3">
      {viewerMode === '2d' ? (
        has2D && !isImageFailed(twoDImageUrl) ? (
          <NativeElementImage
            key={twoDImageUrl}
            src={twoDImageUrl}
            alt={`2D Bohr model of ${elementName}`}
            containerClassName="h-56 rounded-xl md:h-72"
            imageClassName="h-full w-full rounded-xl object-contain"
            onClick={() => {
              onOpenExpandedImage(twoDImageUrl, `2D Bohr model of ${elementName}`, 'bohr');
            }}
            onError={() => {
              onImageLoadError(twoDImageUrl);
            }}
          />
        ) : (
          <ImageUnavailableState elementName={elementName} />
        )
      ) : viewerMode === 'image' ? (
        hasElementImage && !isImageFailed(elementImageUrl) ? (
          <NativeElementImage
            key={elementImageUrl}
            src={elementImageUrl}
            alt={`Image of ${elementName}`}
            containerClassName="h-56 rounded-xl md:h-72"
            imageClassName="h-full w-full rounded-xl object-contain"
            onClick={() => {
              onOpenExpandedImage(elementImageUrl, `Image of ${elementName}`, 'element');
            }}
            onError={() => {
              onImageLoadError(elementImageUrl);
            }}
          />
        ) : (
          <ImageUnavailableState elementName={elementName} />
        )
      ) : has3D ? (
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
      ) : (
        <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] text-sm text-[var(--text-muted)] md:h-72">
          3D model is unavailable for this element.
        </div>
      )}
    </section>
  );
}
