'use client';

import { useCallback, useEffect, useState } from 'react';

import type { ExpandedImageState } from './elementDetails.types';

type OpenExpandedImage = (
  sourceUrl: string,
  altText: string,
  kind: ExpandedImageState['kind'],
) => void;

export default function useElementDetailsExpandedImage() {
  const [expandedImage, setExpandedImage] = useState<ExpandedImageState | null>(null);

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

  const onCloseExpandedImage = useCallback(() => {
    setExpandedImage(null);
  }, []);

  const onOpenExpandedImage = useCallback<OpenExpandedImage>((sourceUrl, altText, kind) => {
    if (sourceUrl.trim().length === 0) {
      return;
    }

    setExpandedImage({
      kind,
      src: sourceUrl,
      alt: altText,
    });
  }, []);

  return {
    expandedImage,
    onCloseExpandedImage,
    onOpenExpandedImage,
  };
}
