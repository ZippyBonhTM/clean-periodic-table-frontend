'use client';

import { ImageUnavailableState, NativeElementImage } from './ElementDetailsNativeImage';
import type { ExpandedImageState } from './elementDetails.types';

type ElementDetailsStaticImagePanelProps = {
  altText: string;
  elementName: string;
  imageKind: ExpandedImageState['kind'];
  imageUrl: string;
  isImageFailed: (url: string) => boolean;
  onImageLoadError: (url: string) => void;
  onOpenExpandedImage: (
    sourceUrl: string,
    altText: string,
    kind: ExpandedImageState['kind'],
  ) => void;
};

export default function ElementDetailsStaticImagePanel({
  altText,
  elementName,
  imageKind,
  imageUrl,
  isImageFailed,
  onImageLoadError,
  onOpenExpandedImage,
}: ElementDetailsStaticImagePanelProps) {
  if (imageUrl.length === 0 || isImageFailed(imageUrl)) {
    return <ImageUnavailableState elementName={elementName} />;
  }

  return (
    <NativeElementImage
      key={imageUrl}
      src={imageUrl}
      alt={altText}
      containerClassName="h-56 rounded-xl md:h-72"
      imageClassName="h-full w-full rounded-xl object-contain"
      onClick={() => {
        onOpenExpandedImage(imageUrl, altText, imageKind);
      }}
      onError={() => {
        onImageLoadError(imageUrl);
      }}
    />
  );
}
