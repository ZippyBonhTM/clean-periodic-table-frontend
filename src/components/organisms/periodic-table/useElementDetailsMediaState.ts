'use client';

import useElementDetails3DViewer from './useElementDetails3DViewer';
import useElementImageFailureState from './useElementImageFailureState';
import type { ViewerMode } from './elementDetails.types';

type UseElementDetailsMediaStateOptions = {
  elementNumber: number;
  has3D: boolean;
  viewerMode: ViewerMode;
};

export default function useElementDetailsMediaState({
  elementNumber,
  has3D,
  viewerMode,
}: UseElementDetailsMediaStateOptions) {
  const { is3DViewerReady } = useElementDetails3DViewer({
    has3D,
    viewerMode,
  });

  const { isImageFailed, onImageLoadError } = useElementImageFailureState({
    elementNumber,
  });

  return {
    is3DViewerReady,
    isImageFailed,
    onImageLoadError,
  };
}
