'use client';

import { useEffect, useState } from 'react';
import type { MutableRefObject, RefObject } from 'react';

type UseMoleculePaletteEdgePaddingOptions = {
  filteredElementCount: number;
  paletteItemRefs: MutableRefObject<Record<number, HTMLButtonElement | null>>;
  paletteViewportRef: RefObject<HTMLDivElement | null>;
  resolvedExpandedPaletteIndex: number;
};

export default function useMoleculePaletteEdgePadding({
  filteredElementCount,
  paletteItemRefs,
  paletteViewportRef,
  resolvedExpandedPaletteIndex,
}: UseMoleculePaletteEdgePaddingOptions) {
  const [paletteEdgePadding, setPaletteEdgePadding] = useState(0);

  useEffect(() => {
    const viewport = paletteViewportRef.current;

    if (viewport === null) {
      return;
    }

    let frameId = 0;
    const updatePadding = () => {
      const selectedButton = paletteItemRefs.current[resolvedExpandedPaletteIndex];
      const selectedWidth = selectedButton?.clientWidth ?? 0;
      const nextPadding = Math.max(0, Math.round(viewport.clientWidth / 2 - selectedWidth / 2));

      setPaletteEdgePadding((currentPadding) => (currentPadding === nextPadding ? currentPadding : nextPadding));
    };

    frameId = window.requestAnimationFrame(updatePadding);
    const resizeObserver = new ResizeObserver(() => {
      updatePadding();
    });

    resizeObserver.observe(viewport);
    const selectedButton = paletteItemRefs.current[resolvedExpandedPaletteIndex];

    if (selectedButton !== null && selectedButton !== undefined) {
      resizeObserver.observe(selectedButton);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [filteredElementCount, paletteItemRefs, paletteViewportRef, resolvedExpandedPaletteIndex]);

  return paletteEdgePadding;
}
