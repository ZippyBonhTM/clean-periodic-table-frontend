'use client';

import type { ChemicalElement } from '@/shared/types/element';

import ElementDetailsExternalLinks from './ElementDetailsExternalLinks';
import ElementDetailsMediaHeader from './ElementDetailsMediaHeader';
import { NativeElementImage } from './ElementDetailsNativeImage';
import type { ExpandedImageState, ViewerMode } from './elementDetails.types';
import { formatNullableValue } from './elementDetailsUtils';
import ElementDetailsViewerPanel from './ElementDetailsViewerPanel';
import useElementDetailsMediaState from './useElementDetailsMediaState';

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
  const { is3DViewerReady, isImageFailed, onImageLoadError } = useElementDetailsMediaState({
    elementNumber: element.number,
    has3D,
    viewerMode,
  });

  const elementName = formatNullableValue(element.name);

  return (
    <>
      <ElementDetailsMediaHeader
        element={element}
        has3D={has3D}
        hasElementImage={hasElementImage}
        isRadioactive={isRadioactive}
        viewerMode={viewerMode}
        onViewerModeChange={onViewerModeChange}
      />

      <ElementDetailsViewerPanel
        element={element}
        elementImageUrl={elementImageUrl}
        elementName={elementName}
        has2D={has2D}
        has3D={has3D}
        hasElementImage={hasElementImage}
        is3DViewerReady={is3DViewerReady}
        isImageFailed={isImageFailed}
        onImageLoadError={onImageLoadError}
        onOpenExpandedImage={onOpenExpandedImage}
        twoDImageUrl={twoDImageUrl}
        viewerMode={viewerMode}
      />

      <ElementDetailsExternalLinks element={element} />
    </>
  );
}

export { NativeElementImage };
