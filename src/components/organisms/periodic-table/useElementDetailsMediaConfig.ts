'use client';

import { useMemo } from 'react';

import type { ChemicalElement } from '@/shared/types/element';
import { isElementRadioactive } from '@/shared/utils/elementPresentation';

import type { ViewerMode } from './elementDetails.types';
import { hasDisplayText, normalizeElementImageUrl } from './elementDetailsUtils';

type UseElementDetailsMediaConfigOptions = {
  element: ChemicalElement | null;
  viewerModeOverride: ViewerMode | null;
};

export default function useElementDetailsMediaConfig({
  element,
  viewerModeOverride,
}: UseElementDetailsMediaConfigOptions) {
  return useMemo(() => {
    const has3D = hasDisplayText(element?.bohr_model_3d);
    const elementImageUrl = normalizeElementImageUrl(element?.image?.url);
    const hasElementImage = elementImageUrl.length > 0;
    const twoDImageUrl = hasDisplayText(element?.bohr_model_image)
      ? String(element?.bohr_model_image).trim()
      : elementImageUrl;
    const has2D = twoDImageUrl.length > 0;
    const viewerMode = viewerModeOverride ?? (hasElementImage ? 'image' : '2d');
    const isRadioactive = element === null ? false : isElementRadioactive(element);

    return {
      elementImageUrl,
      has2D,
      has3D,
      hasElementImage,
      isRadioactive,
      twoDImageUrl,
      viewerMode,
    };
  }, [element, viewerModeOverride]);
}
