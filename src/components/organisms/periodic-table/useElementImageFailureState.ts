'use client';

import { useState } from 'react';

type UseElementImageFailureStateOptions = {
  elementNumber: number;
};

export default function useElementImageFailureState({
  elementNumber,
}: UseElementImageFailureStateOptions) {
  const [failureState, setFailureState] = useState<{
    elementNumber: number;
    failedImageUrls: Record<string, true>;
  }>({
    elementNumber,
    failedImageUrls: {},
  });

  const isImageFailed = (url: string): boolean => {
    if (failureState.elementNumber !== elementNumber) {
      return false;
    }

    return failureState.failedImageUrls[url] === true;
  };

  const onImageLoadError = (url: string) => {
    if (url.length === 0) {
      return;
    }

    setFailureState((previous) => {
      const failedImageUrls =
        previous.elementNumber === elementNumber ? previous.failedImageUrls : {};

      if (failedImageUrls[url] === true) {
        return previous.elementNumber === elementNumber
          ? previous
          : { elementNumber, failedImageUrls };
      }

      return {
        elementNumber,
        failedImageUrls: {
          ...failedImageUrls,
          [url]: true,
        },
      };
    });
  };

  return {
    isImageFailed,
    onImageLoadError,
  };
}
