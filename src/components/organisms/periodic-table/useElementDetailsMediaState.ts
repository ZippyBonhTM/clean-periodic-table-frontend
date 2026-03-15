'use client';

import { useEffect, useState } from 'react';

import type { ViewerMode } from './elementDetails.types';

type ModelViewerConstructor = {
  minimumRenderScale: number;
};

type UseElementDetailsMediaStateOptions = {
  elementNumber: number;
  has3D: boolean;
  viewerMode: ViewerMode;
};

const HIGH_QUALITY_MIN_RENDER_SCALE = 0.95;

export default function useElementDetailsMediaState({
  elementNumber,
  has3D,
  viewerMode,
}: UseElementDetailsMediaStateOptions) {
  const [is3DViewerReady, setIs3DViewerReady] = useState(false);
  const [failedImageUrls, setFailedImageUrls] = useState<Record<string, true>>({});

  useEffect(() => {
    setFailedImageUrls({});
  }, [elementNumber]);

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

  return {
    is3DViewerReady,
    isImageFailed,
    onImageLoadError,
  };
}
