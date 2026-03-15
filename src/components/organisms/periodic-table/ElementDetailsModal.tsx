'use client';

import { memo, useState } from 'react';

import FloatingModal from '@/components/molecules/FloatingModal';
import type { ChemicalElement } from '@/shared/types/element';

import ElementDetailsDataSection from './ElementDetailsDataSection';
import ElementDetailsExpandedImageOverlay from './ElementDetailsExpandedImageOverlay';
import ElementDetailsMediaSection from './ElementDetailsMediaSection';
import ElementDetailsModalHeaderActions from './ElementDetailsModalHeaderActions';
import type { DetailsViewMode, ViewerMode } from './elementDetails.types';
import useElementDetailsExpandedImage from './useElementDetailsExpandedImage';
import useElementDetailsMediaConfig from './useElementDetailsMediaConfig';
import useElementDetailsRows from './useElementDetailsRows';

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
  const { cardRows, dataRows } = useElementDetailsRows({ element });

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
          <ElementDetailsModalHeaderActions
            hasNextElement={hasNextElement}
            hasPreviousElement={hasPreviousElement}
            onCloseExpandedImage={onCloseExpandedImage}
            onOpenNextElement={onOpenNextElement}
            onOpenPreviousElement={onOpenPreviousElement}
          />
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
