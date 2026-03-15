'use client';

import { memo, useMemo, useState } from 'react';

import FloatingModal from '@/components/molecules/FloatingModal';
import type { ChemicalElement } from '@/shared/types/element';

import ElementDetailsDataSection from './ElementDetailsDataSection';
import ElementDetailsExpandedImageOverlay from './ElementDetailsExpandedImageOverlay';
import ElementDetailsMediaSection from './ElementDetailsMediaSection';
import type { DetailsViewMode, ViewerMode } from './elementDetails.types';
import {
  buildCardOptimizedRows,
  buildElementRows,
} from './elementDetailsUtils';
import useElementDetailsExpandedImage from './useElementDetailsExpandedImage';
import useElementDetailsMediaConfig from './useElementDetailsMediaConfig';

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
  const { expandedImage, onCloseExpandedImage, onOpenExpandedImage } = useElementDetailsExpandedImage();
  const { elementImageUrl, has2D, has3D, hasElementImage, isRadioactive, twoDImageUrl, viewerMode } =
    useElementDetailsMediaConfig({
      element,
      viewerModeOverride,
    });

  const dataRows = useMemo(() => {
    if (element === null) {
      return [];
    }

    return buildElementRows(element);
  }, [element]);

  const cardRows = useMemo(() => {
    return buildCardOptimizedRows(dataRows);
  }, [dataRows]);

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
          onCloseExpandedImage();
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
                  onCloseExpandedImage();
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
                  onCloseExpandedImage();
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
            onOpenExpandedImage={onOpenExpandedImage}
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
        <ElementDetailsExpandedImageOverlay expandedImage={expandedImage} onClose={onCloseExpandedImage} />
      ) : null}
    </>
  );
}

export default memo(ElementDetailsModal);
