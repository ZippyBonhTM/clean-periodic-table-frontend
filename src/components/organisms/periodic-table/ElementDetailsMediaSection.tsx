'use client';

import { createElement, useEffect, useState } from 'react';

import type { ChemicalElement } from '@/shared/types/element';

import type { ExpandedImageState, ViewerMode } from './elementDetails.types';
import {
  formatNullableValue,
  normalizeElementImageUrl,
  normalizeText,
} from './elementDetailsUtils';

type ElementDetailsMediaSectionProps = {
  element: ChemicalElement;
  viewerMode: ViewerMode;
  hasElementImage: boolean;
  has2D: boolean;
  has3D: boolean;
  elementImageUrl: string;
  twoDImageUrl: string;
  isRadioactive: boolean;
  onViewerModeChange: (mode: ViewerMode) => void;
  onOpenExpandedImage: (
    sourceUrl: string,
    altText: string,
    kind: ExpandedImageState['kind'],
  ) => void;
};

type ModelViewerConstructor = {
  minimumRenderScale: number;
};

type NativeElementImageProps = {
  src: string;
  alt: string;
  containerClassName: string;
  imageClassName: string;
  loading?: 'eager' | 'lazy';
  onClick?: () => void;
  onError?: (src: string) => void;
};

type DetailBadgeTone = 'neutral' | 'radioactive';

const HIGH_QUALITY_MIN_RENDER_SCALE = 0.95;

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

function ImageUnavailableState({ elementName }: { elementName: string }) {
  return (
    <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] px-4 text-center text-sm text-[var(--text-muted)] md:h-72">
      {`Image of element ${elementName}; Not available.`}
    </div>
  );
}

function NativeElementImage({
  src,
  alt,
  containerClassName,
  imageClassName,
  loading = 'lazy',
  onClick,
  onError,
}: NativeElementImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasErrored, setHasErrored] = useState(false);

  if (hasErrored) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden bg-[var(--surface-2)] ${containerClassName}`}>
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(251,146,60,0.12),transparent_52%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.72))] transition-opacity duration-300 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <div
        aria-hidden="true"
        className={`absolute inset-0 animate-pulse bg-white/4 transition-opacity duration-300 ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        className={`${imageClassName} transition-[opacity,filter,transform] duration-300 ${
          onClick !== undefined ? 'cursor-zoom-in hover:scale-[1.01]' : ''
        } ${isLoaded ? 'scale-100 blur-0 opacity-100' : 'scale-[1.01] blur-[6px] opacity-70'}`}
        onLoad={() => {
          setIsLoaded(true);
        }}
        onClick={onClick}
        onError={() => {
          setHasErrored(true);
          onError?.(src);
        }}
      />
    </div>
  );
}

function DetailBadge({ label, tone = 'neutral' }: { label: string; tone?: DetailBadgeTone }) {
  if (tone === 'radioactive') {
    return (
      <span className="inline-flex rounded-md border border-rose-400/60 bg-rose-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-rose-300">
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-1 text-xs font-semibold text-[var(--text-strong)]">
      {label}
    </span>
  );
}

export default function ElementDetailsMediaSection({
  element,
  viewerMode,
  hasElementImage,
  has2D,
  has3D,
  elementImageUrl,
  twoDImageUrl,
  isRadioactive,
  onViewerModeChange,
  onOpenExpandedImage,
}: ElementDetailsMediaSectionProps) {
  const [is3DViewerReady, setIs3DViewerReady] = useState(false);
  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, true>>({});

  useEffect(() => {
    setFailedImageUrls({});
  }, [element.number]);

  useEffect(() => {
    if (viewerMode !== '3d' || !has3D) {
      setIs3DViewerReady(false);
      return;
    }

    let isMounted = true;

    import('@google/model-viewer')
      .then(() => {
        const modelViewerElement = customElements.get('model-viewer') as
          | ModelViewerConstructor
          | undefined;

        if (modelViewerElement !== undefined) {
          modelViewerElement.minimumRenderScale = HIGH_QUALITY_MIN_RENDER_SCALE;
        }

        if (isMounted) {
          setIs3DViewerReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIs3DViewerReady(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [has3D, viewerMode]);

  const isImageFailed = (url: string): boolean => {
    return failedImageUrls[url] === true;
  };

  const onImageLoadError = (url: string) => {
    if (url.length === 0) {
      return;
    }

    setFailedImageUrls((previous) => {
      if (previous[url] === true) {
        return previous;
      }

      return {
        ...previous,
        [url]: true,
      };
    });
  };

  const elementName = formatNullableValue(element.name);

  return (
    <>
      <section className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 max-[344px]:grid-cols-1">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--text-muted)]">Element Details</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {isRadioactive ? <DetailBadge label="Radioactive" tone="radioactive" /> : null}
            <DetailBadge label={formatNullableValue(element.category)} />
            <DetailBadge label={formatNullableValue(element.phase)} />
          </div>
        </div>

        <div className="flex items-end gap-2 max-[464px]:flex-col max-[464px]:items-stretch">
          <button
            type="button"
            onClick={() => onViewerModeChange('image')}
            disabled={!hasElementImage}
            className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors max-[464px]:order-1 max-[464px]:w-full max-[464px]:text-center ${
              viewerMode === 'image'
                ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--text-strong)]'
                : 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-strong)]'
            } disabled:cursor-not-allowed disabled:opacity-55`}
          >
            Element Image
          </button>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)] p-2 max-[464px]:order-2 max-[464px]:w-full">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Borh
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onViewerModeChange('2d')}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                  viewerMode === '2d'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--text-strong)]'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                }`}
              >
                2D
              </button>

              <button
                type="button"
                onClick={() => onViewerModeChange('3d')}
                disabled={!has3D}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                  viewerMode === '3d'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--text-strong)]'
                    : 'border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-strong)]'
                } disabled:cursor-not-allowed disabled:opacity-55`}
              >
                3D
              </button>
            </div>
          </div>
        </div>
      </section>

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
              <LinkButton href={element.bohr_model_3d} label="Open 3D File in New Tab" />
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
    </>
  );
}

export { NativeElementImage };
