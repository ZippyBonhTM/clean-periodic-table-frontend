'use client';

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

type EditorViewMode = 'editor' | 'structural' | 'simplified' | 'stick';

type UseMoleculeEditorMeasurementsOptions = {
  activeView: EditorViewMode;
  paletteSearchRailRef: RefObject<HTMLDivElement | null>;
};

export default function useMoleculeEditorMeasurements({
  activeView,
  paletteSearchRailRef,
}: UseMoleculeEditorMeasurementsOptions) {
  const topControlsRef = useRef<HTMLDivElement | null>(null);
  const topOverlayRef = useRef<HTMLDivElement | null>(null);
  const bottomNoticeRef = useRef<HTMLDivElement | null>(null);
  const canvasFrameRef = useRef<HTMLDivElement | null>(null);

  const [topControlsHeight, setTopControlsHeight] = useState(0);
  const [topOverlayHeight, setTopOverlayHeight] = useState(0);
  const [paletteSearchRailHeight, setPaletteSearchRailHeight] = useState(0);
  const [bottomNoticeHeight, setBottomNoticeHeight] = useState(0);
  const [canvasFrameSize, setCanvasFrameSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const topControlsElement = topControlsRef.current;
    const overlayElement = topOverlayRef.current;
    const searchRailElement = paletteSearchRailRef.current;
    const bottomNoticeElement = bottomNoticeRef.current;
    const canvasElement = canvasFrameRef.current;

    if (
      topControlsElement === null &&
      overlayElement === null &&
      searchRailElement === null &&
      bottomNoticeElement === null &&
      canvasElement === null
    ) {
      return;
    }

    const updateMeasurements = () => {
      if (topControlsElement !== null) {
        const nextTopControlsHeight = Math.round(topControlsElement.getBoundingClientRect().height);
        setTopControlsHeight((currentHeight) =>
          currentHeight === nextTopControlsHeight ? currentHeight : nextTopControlsHeight,
        );
      }

      if (overlayElement !== null) {
        const nextOverlayHeight = Math.round(overlayElement.getBoundingClientRect().height);
        setTopOverlayHeight((currentHeight) =>
          currentHeight === nextOverlayHeight ? currentHeight : nextOverlayHeight,
        );
      }

      if (searchRailElement !== null) {
        const nextSearchRailHeight = Math.round(searchRailElement.getBoundingClientRect().height);
        setPaletteSearchRailHeight((currentHeight) =>
          currentHeight === nextSearchRailHeight ? currentHeight : nextSearchRailHeight,
        );
      }

      if (bottomNoticeElement !== null) {
        const nextBottomNoticeHeight = Math.round(bottomNoticeElement.getBoundingClientRect().height);
        setBottomNoticeHeight((currentHeight) =>
          currentHeight === nextBottomNoticeHeight ? currentHeight : nextBottomNoticeHeight,
        );
      } else {
        setBottomNoticeHeight((currentHeight) => (currentHeight === 0 ? currentHeight : 0));
      }

      if (canvasElement !== null) {
        const rect = canvasElement.getBoundingClientRect();
        const nextWidth = Math.round(rect.width);
        const nextHeight = Math.round(rect.height);

        setCanvasFrameSize((currentSize) =>
          currentSize.width === nextWidth && currentSize.height === nextHeight
            ? currentSize
            : { width: nextWidth, height: nextHeight },
        );
      }
    };

    updateMeasurements();

    const resizeObserver = new ResizeObserver(() => {
      updateMeasurements();
    });

    if (topControlsElement !== null) {
      resizeObserver.observe(topControlsElement);
    }

    if (overlayElement !== null) {
      resizeObserver.observe(overlayElement);
    }

    if (searchRailElement !== null) {
      resizeObserver.observe(searchRailElement);
    }

    if (bottomNoticeElement !== null) {
      resizeObserver.observe(bottomNoticeElement);
    }

    if (canvasElement !== null) {
      resizeObserver.observe(canvasElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [activeView, paletteSearchRailRef]);

  return {
    bottomNoticeHeight,
    bottomNoticeRef,
    canvasFrameRef,
    canvasFrameSize,
    paletteSearchRailHeight,
    topControlsHeight,
    topControlsRef,
    topOverlayHeight,
    topOverlayRef,
  };
}
