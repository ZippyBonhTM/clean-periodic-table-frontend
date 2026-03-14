'use client';

import { memo, useEffect, useMemo, useState } from 'react';

import FloatingModal from '@/components/molecules/FloatingModal';
import type { ChemicalElement } from '@/shared/types/element';
import { isElementRadioactive } from '@/shared/utils/elementPresentation';

import ElementDetailsDataSection from './ElementDetailsDataSection';
import ElementDetailsMediaSection, { NativeElementImage } from './ElementDetailsMediaSection';
import type {
  DetailsViewMode,
  ExpandedImageState,
  ViewerMode,
} from './elementDetails.types';
import {
  buildCardOptimizedRows,
  buildElementRows,
  hasDisplayText,
  normalizeElementImageUrl,
} from './elementDetailsUtils';

type ElementDetailsModalProps = {
  element: ChemicalElement | null;
  isOpen: boolean;
  onClose: () => void;
  hasPreviousElement?: boolean;
  hasNextElement?: boolean;
  onOpenPreviousElement?: () => void;
  onOpenNextElement?: () => void;
};

function ElementDetailsModal({
  element,
  isOpen,
  onClose,
  hasPreviousElement = false,
  hasNextElement = false,
  onOpenPreviousElement,
  onOpenNextElement,
}: ElementDetailsModalProps) {
  const [viewerModeOverride, setViewerModeOverride] = useState<ViewerMode | null>(null);
  const [detailsViewMode, setDetailsViewMode] = useState<DetailsViewMode>('cards');
  const [expandedImage, setExpandedImage] = useState<ExpandedImageState | null>(null);

  const has3D = hasDisplayText(element?.bohr_model_3d);
  const elementImageUrl = normalizeElementImageUrl(element?.image?.url);
  const hasElementImage = elementImageUrl.length > 0;
  const twoDImageUrl = hasDisplayText(element?.bohr_model_image)
    ? String(element?.bohr_model_image).trim()
    : elementImageUrl;
  const has2D = twoDImageUrl.length > 0;
  const viewerMode = viewerModeOverride ?? (hasElementImage ? 'image' : '2d');

  const dataRows = useMemo(() => {
    if (element === null) {
      return [];
    }

    return buildElementRows(element);
  }, [element]);

  const cardRows = useMemo(() => {
    return buildCardOptimizedRows(dataRows);
  }, [dataRows]);

  const isRadioactive = useMemo(() => {
    if (element === null) {
      return false;
    }

    return isElementRadioactive(element);
  }, [element]);

  useEffect(() => {
    if (expandedImage === null) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpandedImage(null);
      }
    };

    window.addEventListener('keydown', onEscape);

    return () => {
      window.removeEventListener('keydown', onEscape);
    };
  }, [expandedImage]);

  if (element === null) {
    return (
      <FloatingModal
        isOpen={isOpen}
        onClose={onClose}
        title="Element Details"
        panelClassName="max-w-5xl self-start mt-1 sm:mt-3"
        bodyClassName="element-modal-scroll pr-1 pb-1"
      >
        {null}
      </FloatingModal>
    );
  }

  return (
    <>
      <FloatingModal
        isOpen={isOpen}
        onClose={() => {
          setViewerModeOverride(null);
          setExpandedImage(null);
          onClose();
        }}
        title={`${element.name} (${element.symbol})`}
        panelClassName="max-w-5xl self-start mt-1 sm:mt-3"
        bodyClassName="element-modal-scroll pr-1 pb-1"
        headerActions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (hasPreviousElement && onOpenPreviousElement !== undefined) {
                  setExpandedImage(null);
                  onOpenPreviousElement();
                }
              }}
              disabled={!hasPreviousElement}
              aria-label="Previous element"
              className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => {
                if (hasNextElement && onOpenNextElement !== undefined) {
                  setExpandedImage(null);
                  onOpenNextElement();
                }
              }}
              disabled={!hasNextElement}
              aria-label="Next element"
              className="rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              →
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <ElementDetailsMediaSection
            element={element}
            viewerMode={viewerMode}
            hasElementImage={hasElementImage}
            has2D={has2D}
            has3D={has3D}
            elementImageUrl={elementImageUrl}
            twoDImageUrl={twoDImageUrl}
            isRadioactive={isRadioactive}
            onViewerModeChange={setViewerModeOverride}
            onOpenExpandedImage={(sourceUrl, altText, kind) => {
              if (sourceUrl.trim().length === 0) {
                return;
              }

              setExpandedImage({
                kind,
                src: sourceUrl,
                alt: altText,
              });
            }}
          />

          <ElementDetailsDataSection
            detailsViewMode={detailsViewMode}
            dataRows={dataRows}
            cardRows={cardRows}
            onToggleDetailsViewMode={() => {
              setDetailsViewMode((previous) => (previous === 'cards' ? 'table' : 'cards'));
            }}
          />
        </div>
      </FloatingModal>

      {expandedImage !== null ? (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-3 md:p-6"
          onClick={() => {
            setExpandedImage(null);
          }}
          role="button"
          tabIndex={0}
          aria-label="Close expanded image"
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              setExpandedImage(null);
            }
          }}
        >
          <div
            className="relative flex max-h-[94vh] w-full max-w-7xl items-center justify-center rounded-2xl border border-white/20 bg-[var(--surface-2)] p-2 shadow-2xl md:p-3"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setExpandedImage(null);
              }}
              className="absolute right-3 top-3 z-20 rounded-lg border border-white/35 bg-black/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:border-white/75"
            >
              Close
            </button>
            <NativeElementImage
              key={`${expandedImage.kind}:${expandedImage.src}`}
              src={expandedImage.src}
              alt={expandedImage.alt}
              loading="eager"
              containerClassName={
                expandedImage.kind === 'bohr'
                  ? 'max-h-[84vh] w-[min(92vw,1200px)] rounded-xl'
                  : 'max-h-[84vh] w-auto max-w-[92vw] rounded-xl'
              }
              imageClassName="h-full w-full rounded-xl object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

export default memo(ElementDetailsModal);
