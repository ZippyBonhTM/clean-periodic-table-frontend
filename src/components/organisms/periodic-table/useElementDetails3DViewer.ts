'use client';

import { useEffect, useState } from 'react';

import type { ViewerMode } from './elementDetails.types';

type ModelViewerConstructor = {
  minimumRenderScale: number;
};

type UseElementDetails3DViewerOptions = {
  has3D: boolean;
  viewerMode: ViewerMode;
};

const HIGH_QUALITY_MIN_RENDER_SCALE = 0.95;

export default function useElementDetails3DViewer({
  has3D,
  viewerMode,
}: UseElementDetails3DViewerOptions) {
  const [is3DViewerReady, setIs3DViewerReady] = useState(false);

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

  return {
    is3DViewerReady,
  };
}
