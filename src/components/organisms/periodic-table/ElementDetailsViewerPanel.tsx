'use client';

import type { ChemicalElement } from '@/shared/types/element';
import {
  formatBohrImageAlt,
  formatElementImageAlt,
} from '@/components/organisms/periodic-table/periodicTableText';
import usePeriodicTableText from '@/components/organisms/periodic-table/usePeriodicTableText';

import ElementDetails3DViewer from './ElementDetails3DViewer';
import ElementDetailsStaticImagePanel from './ElementDetailsStaticImagePanel';
import type { ExpandedImageState, ViewerMode } from './elementDetails.types';

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
  const text = usePeriodicTableText();

  return (
    <section className="surface-panel rounded-2xl border border-[var(--border-subtle)] p-3">
      {viewerMode === '2d' ? (
        <ElementDetailsStaticImagePanel
          altText={formatBohrImageAlt(text, elementName)}
          elementName={elementName}
          imageKind="bohr"
          imageUrl={has2D ? twoDImageUrl : ''}
          isImageFailed={isImageFailed}
          onImageLoadError={onImageLoadError}
          onOpenExpandedImage={onOpenExpandedImage}
        />
      ) : viewerMode === 'image' ? (
        <ElementDetailsStaticImagePanel
          altText={formatElementImageAlt(text, elementName)}
          elementName={elementName}
          imageKind="element"
          imageUrl={hasElementImage ? elementImageUrl : ''}
          isImageFailed={isImageFailed}
          onImageLoadError={onImageLoadError}
          onOpenExpandedImage={onOpenExpandedImage}
        />
      ) : (
        <ElementDetails3DViewer
          element={element}
          elementName={elementName}
          has3D={has3D}
          is3DViewerReady={is3DViewerReady}
        />
      )}
    </section>
  );
}
